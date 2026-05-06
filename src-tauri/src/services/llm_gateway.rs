//! LLM Gateway - Provider abstraction for AI services
//!
//! Provides a unified interface for interacting with different LLM providers
//! (OpenAI, Anthropic, DeepSeek, etc.) with structured output validation.

use reqwest::header;
use serde::Deserialize;
use std::time::Duration;
use thiserror::Error;

/// Error types for LLM operations
#[derive(Debug, Error)]
pub enum LlmError {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    #[error("JSON serialization/deserialization failed: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("Invalid API key for provider '{provider}'")]
    InvalidApiKey { provider: String },

    #[error("API request failed: {message}")]
    ApiError {
        provider: String,
        message: String,
        retryable: bool,
    },

    #[error("Response validation failed: {0}")]
    ValidationError(String),

    #[error("Rate limited by provider '{provider}'")]
    RateLimited { provider: String, retry_after_seconds: Option<u64> },

    #[error("Timeout after {seconds}s")]
    Timeout { seconds: u64 },
}

/// Request sent to an LLM provider
#[derive(Debug, Clone)]
pub struct LlmRequest {
    /// System prompt for the conversation
    pub system_prompt: String,
    /// User prompt (the actual request to the AI)
    pub user_prompt: String,
    /// Maximum tokens to generate
    pub max_tokens: u32,
    /// Temperature for response randomness (0.0 - 1.0)
    pub temperature: f32,
}

/// Response from an LLM provider
#[derive(Debug, Clone)]
pub struct LlmResponse {
    /// Raw response text
    pub content: String,
    /// Number of tokens used in the input
    pub input_tokens: u32,
    /// Number of tokens used in the output
    pub output_tokens: u32,
    /// Estimated cost in US cents
    pub cost_estimate_cents: i64,
    /// Round-trip latency in milliseconds
    pub latency_ms: u64,
}

/// Provider abstraction for different LLM services
pub trait LlmProvider: Send + Sync {
    /// Complete a prompt and return structured output
    fn complete_structured<T: for<'de> Deserialize<'de> + Send>(
        &self,
        request: LlmRequest,
    ) -> Result<T, LlmError>;

    /// Complete a prompt and return raw text
    fn complete(&self, request: LlmRequest) -> Result<LlmResponse, LlmError>;

    /// Get the provider display name
    fn provider_name(&self) -> &str;

    /// Get the model name
    fn model_name(&self) -> &str;

    /// Test if the provider configuration is valid
    fn test_connection(&self) -> Result<bool, LlmError>;
}

/// OpenAI provider implementation
pub struct OpenAiProvider {
    api_key: String,
    base_url: String,
    model: String,
    client: reqwest::blocking::Client,
}

impl OpenAiProvider {
    /// Create a new OpenAI provider
    ///
    /// # Arguments
    /// * `api_key` - OpenAI API key
    /// * `model` - Model to use (e.g., "gpt-4.1-mini", "gpt-4o")
    pub fn new(api_key: String, model: String) -> Self {
        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .unwrap();

        Self {
            api_key,
            base_url: "https://api.openai.com/v1".to_string(),
            model,
            client,
        }
    }

    fn build_request(&self, system_prompt: &str, user_prompt: &str, max_tokens: u32, temperature: f32) -> serde_json::Value {
        serde_json::json!({
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": temperature
        })
    }

    fn parse_response(&self, response_text: &str, usage: &serde_json::Value) -> Result<LlmResponse, LlmError> {
        let input_tokens = usage["prompt_tokens"].as_u64().unwrap_or(0) as u32;
        let output_tokens = usage["completion_tokens"].as_u64().unwrap_or(0) as u32;

        // Cost estimation (as of 2025)
        let cost_per_million_input = 0.15_f64; // gpt-4.1-mini: $0.15 per 1M input tokens
        let cost_per_million_output = 0.60_f64; // gpt-4.1-mini: $0.60 per 1M output tokens
        let input_cost = (input_tokens as f64) * cost_per_million_input / 1_000_000.0;
        let output_cost = (output_tokens as f64) * cost_per_million_output / 1_000_000.0;
        let cost_estimate_cents = ((input_cost + output_cost) * 100.0) as i64;

        Ok(LlmResponse {
            content: response_text.to_string(),
            input_tokens,
            output_tokens,
            cost_estimate_cents,
            latency_ms: 0, // Will be set by caller
        })
    }
}

impl LlmProvider for OpenAiProvider {
    fn complete_structured<T: for<'de> Deserialize<'de> + Send>(
        &self,
        request: LlmRequest,
    ) -> Result<T, LlmError> {
        let response = self.complete(request)?;
        let parsed: T = serde_json::from_str(&response.content)
            .map_err(|e| LlmError::ValidationError(format!("Failed to parse structured output: {}", e)))?;
        Ok(parsed)
    }

    fn complete(&self, request: LlmRequest) -> Result<LlmResponse, LlmError> {
        let start = std::time::Instant::now();

        let request_body = self.build_request(&request.system_prompt, &request.user_prompt, request.max_tokens, request.temperature);

        let response = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .header(header::AUTHORIZATION, format!("Bearer {}", self.api_key))
            .header(header::CONTENT_TYPE, "application/json")
            .json(&request_body)
            .send()?;

        let status = response.status();
        let latency_ms = start.elapsed().as_millis() as u64;

        if status.is_client_error() {
            if status.as_u16() == 401 {
                return Err(LlmError::InvalidApiKey {
                    provider: self.provider_name().to_string(),
                });
            }
            let error_text = response.text().unwrap_or_else(|_| "Unknown error".to_string());
            return Err(LlmError::ApiError {
                provider: self.provider_name().to_string(),
                message: error_text,
                retryable: false,
            });
        }

        if status.is_server_error() {
            return Err(LlmError::ApiError {
                provider: self.provider_name().to_string(),
                message: "Server error".to_string(),
                retryable: true,
            });
        }

        if status == 429 {
            return Err(LlmError::RateLimited {
                provider: self.provider_name().to_string(),
                retry_after_seconds: None,
            });
        }

        let response_json: serde_json::Value = response.json()?;

        let content = response_json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| LlmError::ApiError {
                provider: self.provider_name().to_string(),
                message: "No content in response".to_string(),
                retryable: false,
            })?;

        let usage = &response_json["usage"];
        let mut result = self.parse_response(content, usage)?;
        result.latency_ms = latency_ms;
        Ok(result)
    }

    fn provider_name(&self) -> &str {
        "openai"
    }

    fn model_name(&self) -> &str {
        &self.model
    }

    fn test_connection(&self) -> Result<bool, LlmError> {
        let request = LlmRequest {
            system_prompt: "You are a helpful assistant.".to_string(),
            user_prompt: "Hello!".to_string(),
            max_tokens: 5,
            temperature: 0.0,
        };

        match self.complete(request) {
            Ok(_) => Ok(true),
            Err(LlmError::InvalidApiKey { .. }) => Ok(false),
            Err(_) => Ok(false),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_openai_provider_new() {
        let provider = OpenAiProvider::new("test-key".to_string(), "gpt-4".to_string());
        assert_eq!(provider.model_name(), "gpt-4");
        assert_eq!(provider.provider_name(), "openai");
    }
}
