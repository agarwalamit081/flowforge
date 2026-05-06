use std::time::Duration;

use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::models::{AppSettings, DailyOutcome, InterventionSuggestion, Task};

#[derive(Debug, Clone, Deserialize, Serialize)]
struct BriefingPayload {
    headline: String,
    focus_prompt: String,
    suggested_task_ids: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct StuckPayload {
    prompt: String,
    next_step: String,
}

pub fn morning_briefing(
    date: &str,
    outcomes: &[DailyOutcome],
    tasks: &[Task],
    settings: &AppSettings,
) -> (String, String, Vec<String>) {
    let fallback = deterministic_morning_briefing(date, outcomes, tasks);
    let Some(api_key) = api_key_for_provider(&settings.default_ai_provider) else {
        return fallback;
    };

    let payload = match settings.default_ai_provider.as_str() {
        "openai" => generate_openai_briefing(date, outcomes, tasks, &settings.default_ai_model, &api_key),
        "anthropic" => {
            generate_anthropic_briefing(date, outcomes, tasks, &settings.default_ai_model, &api_key)
        }
        _ => Err("unsupported provider".to_string()),
    };

    match payload {
        Ok(payload) => normalize_briefing_payload(payload, tasks).unwrap_or(fallback),
        Err(_) => fallback,
    }
}

pub fn stuck_suggestion(task: &Task, reason: &str, settings: &AppSettings) -> InterventionSuggestion {
    let fallback = deterministic_stuck_suggestion(task, reason);
    let Some(api_key) = api_key_for_provider(&settings.default_ai_provider) else {
        return fallback;
    };

    let payload = match settings.default_ai_provider.as_str() {
        "openai" => generate_openai_stuck(task, reason, &settings.default_ai_model, &api_key),
        "anthropic" => generate_anthropic_stuck(task, reason, &settings.default_ai_model, &api_key),
        _ => Err("unsupported provider".to_string()),
    };

    match payload {
        Ok(payload) if !payload.prompt.trim().is_empty() && !payload.next_step.trim().is_empty() => {
            InterventionSuggestion {
                task_id: task.id.clone(),
                reason: reason.to_string(),
                prompt: payload.prompt,
                next_step: payload.next_step,
            }
        }
        _ => fallback,
    }
}

fn deterministic_morning_briefing(
    date: &str,
    outcomes: &[DailyOutcome],
    tasks: &[Task],
) -> (String, String, Vec<String>) {
    let headline = if outcomes.is_empty() {
        format!("Good morning. Define 1-3 outcomes for {}.", date)
    } else {
        format!("Focus on {} meaningful outcome(s) today.", outcomes.len())
    };

    let top_task = tasks
        .first()
        .map(|task| task.title.clone())
        .unwrap_or_else(|| "your easiest next step".to_string());
    let focus_prompt = format!("Start with {top_task} and aim for visible progress before switching contexts.");
    let suggested_task_ids = tasks.iter().take(3).map(|task| task.id.clone()).collect();

    (headline, focus_prompt, suggested_task_ids)
}

fn deterministic_stuck_suggestion(task: &Task, reason: &str) -> InterventionSuggestion {
    let next_step = match reason {
        "activation_friction" => "Open the task context, then complete a two-minute starter action before judging the rest.",
        "unclear_scope" => "Reduce the task to one concrete deliverable and stop after that first checkpoint.",
        _ => "Pick the smallest visible action and do only that for five minutes.",
    };

    InterventionSuggestion {
        task_id: task.id.clone(),
        reason: reason.to_string(),
        prompt: format!("You're not behind. Make '{}' smaller.", task.title),
        next_step: next_step.to_string(),
    }
}

fn api_key_for_provider(provider: &str) -> Option<String> {
    let env_key = match provider {
        "openai" => "OPENAI_API_KEY",
        "anthropic" => "ANTHROPIC_API_KEY",
        _ => return None,
    };
    std::env::var(env_key).ok().filter(|value| !value.trim().is_empty())
}

fn http_client() -> Result<Client, String> {
    Client::builder()
        .timeout(Duration::from_secs(12))
        .build()
        .map_err(|error| error.to_string())
}

fn generate_openai_briefing(
    date: &str,
    outcomes: &[DailyOutcome],
    tasks: &[Task],
    model: &str,
    api_key: &str,
) -> Result<BriefingPayload, String> {
    let client = http_client()?;
    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&json!({
            "model": model,
            "response_format": { "type": "json_object" },
            "messages": [
                {
                    "role": "system",
                    "content": "You are FlowForge. Return only valid JSON with keys headline, focus_prompt, suggested_task_ids."
                },
                {
                    "role": "user",
                    "content": openai_briefing_prompt(date, outcomes, tasks)
                }
            ]
        }))
        .send()
        .map_err(|error| error.to_string())?;

    let value: serde_json::Value = response.json().map_err(|error| error.to_string())?;
    let content = value["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "missing OpenAI content".to_string())?;
    parse_json_payload(content)
}

fn generate_openai_stuck(
    task: &Task,
    reason: &str,
    model: &str,
    api_key: &str,
) -> Result<StuckPayload, String> {
    let client = http_client()?;
    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&json!({
            "model": model,
            "response_format": { "type": "json_object" },
            "messages": [
                {
                    "role": "system",
                    "content": "You are FlowForge. Return only valid JSON with keys prompt and next_step."
                },
                {
                    "role": "user",
                    "content": openai_stuck_prompt(task, reason)
                }
            ]
        }))
        .send()
        .map_err(|error| error.to_string())?;

    let value: serde_json::Value = response.json().map_err(|error| error.to_string())?;
    let content = value["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "missing OpenAI content".to_string())?;
    parse_json_payload(content)
}

fn generate_anthropic_briefing(
    date: &str,
    outcomes: &[DailyOutcome],
    tasks: &[Task],
    model: &str,
    api_key: &str,
) -> Result<BriefingPayload, String> {
    let client = http_client()?;
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&json!({
            "model": model,
            "max_tokens": 300,
            "messages": [
                {
                    "role": "user",
                    "content": format!(
                        "Return only valid JSON with keys headline, focus_prompt, suggested_task_ids.\n{}",
                        openai_briefing_prompt(date, outcomes, tasks)
                    )
                }
            ]
        }))
        .send()
        .map_err(|error| error.to_string())?;

    let value: serde_json::Value = response.json().map_err(|error| error.to_string())?;
    let content = value["content"][0]["text"]
        .as_str()
        .ok_or_else(|| "missing Anthropic text".to_string())?;
    parse_json_payload(content)
}

fn generate_anthropic_stuck(
    task: &Task,
    reason: &str,
    model: &str,
    api_key: &str,
) -> Result<StuckPayload, String> {
    let client = http_client()?;
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&json!({
            "model": model,
            "max_tokens": 220,
            "messages": [
                {
                    "role": "user",
                    "content": format!(
                        "Return only valid JSON with keys prompt and next_step.\n{}",
                        openai_stuck_prompt(task, reason)
                    )
                }
            ]
        }))
        .send()
        .map_err(|error| error.to_string())?;

    let value: serde_json::Value = response.json().map_err(|error| error.to_string())?;
    let content = value["content"][0]["text"]
        .as_str()
        .ok_or_else(|| "missing Anthropic text".to_string())?;
    parse_json_payload(content)
}

fn openai_briefing_prompt(date: &str, outcomes: &[DailyOutcome], tasks: &[Task]) -> String {
    format!(
        "Date: {date}\nOutcomes: {}\nTasks: {}\nWrite a concise, compassionate morning briefing. Keep suggested_task_ids to ids from the provided task list only.",
        serde_json::to_string(outcomes).unwrap_or_else(|_| "[]".to_string()),
        serde_json::to_string(tasks).unwrap_or_else(|_| "[]".to_string())
    )
}

fn openai_stuck_prompt(task: &Task, reason: &str) -> String {
    format!(
        "Task: {}\nReason: {}\nReturn a concise compassionate prompt and one concrete next step. Keep the next step physically actionable.",
        serde_json::to_string(task).unwrap_or_else(|_| "{}".to_string()),
        reason
    )
}

fn parse_json_payload<T: for<'de> Deserialize<'de>>(content: &str) -> Result<T, String> {
    let normalized = extract_json_object(content).unwrap_or_else(|| content.trim().to_string());
    serde_json::from_str(&normalized).map_err(|error| error.to_string())
}

fn extract_json_object(content: &str) -> Option<String> {
    let start = content.find('{')?;
    let end = content.rfind('}')?;
    if end <= start {
        return None;
    }
    Some(content[start..=end].to_string())
}

fn normalize_briefing_payload(payload: BriefingPayload, tasks: &[Task]) -> Option<(String, String, Vec<String>)> {
    if payload.headline.trim().is_empty() || payload.focus_prompt.trim().is_empty() {
        return None;
    }

    let allowed_ids: std::collections::HashSet<&str> = tasks.iter().map(|task| task.id.as_str()).collect();
    let mut suggested_task_ids: Vec<String> = payload
        .suggested_task_ids
        .into_iter()
        .filter(|id| allowed_ids.contains(id.as_str()))
        .collect();

    if suggested_task_ids.is_empty() {
        suggested_task_ids = tasks.iter().take(3).map(|task| task.id.clone()).collect();
    }

    Some((payload.headline, payload.focus_prompt, suggested_task_ids))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_task() -> Task {
        Task {
            id: "task-1".to_string(),
            project_id: None,
            title: "Ship roadmap".to_string(),
            description: None,
            status: "not_started".to_string(),
            priority: 1,
            energy_level: "high".to_string(),
            estimated_minutes: Some(30),
            actual_minutes: 0,
            due_at: None,
            scheduled_start_at: None,
            scheduled_end_at: None,
            source: "manual".to_string(),
            start_here_hint: None,
            good_enough_definition: None,
            sort_order: 0,
            created_at: "2026-05-06T09:00:00Z".to_string(),
            updated_at: "2026-05-06T09:00:00Z".to_string(),
            completed_at: None,
            micro_tasks: vec![],
            tags: vec![],
            links: vec![],
        }
    }

    #[test]
    fn extracts_json_from_fenced_text() {
        let payload: StuckPayload = parse_json_payload("```json\n{\"prompt\":\"A\",\"next_step\":\"B\"}\n```").unwrap();
        assert_eq!(payload.prompt, "A");
        assert_eq!(payload.next_step, "B");
    }

    #[test]
    fn falls_back_without_api_key() {
        let settings = AppSettings {
            theme: "system".to_string(),
            accent_color: "#2e5e4e".to_string(),
            morning_briefing_enabled: true,
            default_focus_minutes: 25,
            default_ai_provider: "openai".to_string(),
            default_ai_model: "gpt-4.1-mini".to_string(),
        };
        let task = sample_task();
        let briefing = morning_briefing("2026-05-06", &[], &[task.clone()], &settings);
        let stuck = stuck_suggestion(&task, "activation_friction", &settings);

        assert!(briefing.0.contains("2026-05-06") || briefing.0.contains("Focus on"));
        assert!(stuck.prompt.contains("Ship roadmap"));
    }

    #[test]
    fn filters_unknown_suggested_task_ids() {
        let task = sample_task();
        let payload = BriefingPayload {
            headline: "Start steady".to_string(),
            focus_prompt: "Open the roadmap file first.".to_string(),
            suggested_task_ids: vec!["unknown".to_string(), "task-1".to_string()],
        };

        let normalized = normalize_briefing_payload(payload, &[task]).unwrap();
        assert_eq!(normalized.2, vec!["task-1".to_string()]);
    }
}
