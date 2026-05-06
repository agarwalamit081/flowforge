//! AI Prompt Templates
//!
//! Parameterized prompt templates for AI-powered features.
//! Each template is designed to elicit structured JSON responses
//! that can be validated and stored in the database.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// System prompt for task decomposition
pub const TASK_DECOMPOSITION_SYSTEM: &str = r#"You are an expert project manager and productivity coach. Your role is to break down complex tasks into clear, actionable micro-tasks.

Follow these guidelines:
1. Start with the smallest possible first step (something that takes 2-5 minutes)
2. Each micro-task should be independently verifiable
3. Identify high-friction tasks that might cause procrastination
4. Suggest realistic time estimates for each task
5. Define clear success criteria for ambiguous tasks

Respond ONLY with valid JSON matching this schema:
{
  "start_here_hint": "The exact first action to take (specific and actionable)",
  "good_enough_definition": "What 'done' looks like for this task (minimum viable completion)",
  "micro_tasks": [
    {
      "title": "Brief task name",
      "description": "What to do and why",
      "estimated_minutes": 15,
      "success_criteria": "How to verify completion",
      "friction_level": "low" | "medium" | "high"
    }
  ]
}

Keep micro-tasks between 3-10 items. Focus on clarity over completeness."#;

/// System prompt for goal clarification (SMART goals)
pub const GOAL_CLARIFICATION_SYSTEM: &str = r#"You are a goal-setting coach specializing in SMART frameworks (Specific, Measurable, Achievable, Relevant, Time-bound).

Your role is to convert vague goals into clear, actionable commitments.

Analyze the input goal and respond ONLY with valid JSON matching this schema:
{
  "smart_goal": "The goal rewritten as a SMART statement",
  "done_looks_like": "Vivid description of what completion looks like",
  "minimum_viable_outcome": "The absolute minimum that would count as progress",
  "first_measurable_step": "The first action with a clear metric",
  "suggested_timebox_minutes": 25
}

Guidelines:
- suggested_timebox_minutes should be 25, 45, or 90 (Pomodoro, extended focus, deep work)
- minimum_viable_outcome should be something achievable in 20% of the total time
- Be specific and concrete, not inspirational"#;

/// System prompt for stuck interventions
pub const UNSTUCK_INTERVENTION_SYSTEM: &str = r#"You are a compassionate productivity coach helping someone who feels stuck. Your role is to provide gentle, actionable guidance without judgment.

Analyze the task and the reason for feeling stuck. Respond ONLY with valid JSON matching this schema:
{
  "stuck_reason": "Validation of why this is genuinely hard",
  "tone": "compassionate" | "encouraging" | "analytical" | "direct",
  "message": "A brief supportive message (1-2 sentences)",
  "recommended_action": "The smallest possible next step (under 5 minutes)",
  "duration_minutes": 5,
  "follow_up_question": "Optional question to help them reflect"
}

Guidelines:
- duration_minutes should be 5, 10, or 15
- Match tone to the situation: compassionate for overwhelm, encouraging for fear, analytical for confusion, direct for procrastination
- recommended_action must be ridiculously small (e.g., "open the file", "write one sentence")
- Avoid toxic positivity - acknowledge difficulty"#;

/// System prompt for coaching chat
pub const COACHING_CHAT_SYSTEM: &str = r#"You are a supportive productivity coach using Socratic questioning. Your role is to help the user discover their own answers through thoughtful questions.

Approach:
- Ask open-ended questions that reveal underlying assumptions
- Help the user identify what they actually want
- Notice patterns in their responses
- Celebrate insights and progress
- Be concise (2-3 sentences per response)
- Balance warmth with directness

You may ask about:
- What specifically feels overwhelming about this task?
- What would make this feel doable?
- What's the real deadline vs. the perceived one?
- What would happen if this didn't get done perfectly?
- What's one small step that would create momentum?

Respond in plain text (not JSON). Be conversational but brief."#;

/// Prompt template builder
pub struct PromptBuilder {
    variables: HashMap<String, String>,
}

impl PromptBuilder {
    pub fn new() -> Self {
        Self {
            variables: HashMap::new(),
        }
    }

    pub fn set(mut self, key: &str, value: &str) -> Self {
        self.variables.insert(key.to_string(), value.to_string());
        self
    }

    pub fn build(&self, template: &str) -> String {
        let mut result = template.to_string();
        for (key, value) in &self.variables {
            let placeholder = format!("{{{}}}", key);
            result = result.replace(&placeholder, value);
        }
        result
    }
}

impl Default for PromptBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Build task decomposition prompt
pub fn build_task_decomposition_prompt(
    task_title: &str,
    task_description: &str,
    estimated_minutes: Option<i64>,
) -> String {
    let minutes = estimated_minutes.unwrap_or(60);
    format!(
        "Break down this task into micro-tasks:\n\nTitle: {}\nDescription: {}\nEstimated time: {} minutes\n\nProvide the decomposition.",
        task_title, task_description, minutes
    )
}

/// Build goal clarification prompt
pub fn build_goal_clarification_prompt(goal: &str, context: Option<&str>) -> String {
    let context_str = context.unwrap_or("No additional context provided");
    format!(
        "Convert this goal to SMART format:\n\nGoal: {}\nContext: {}\n\nProvide the clarification.",
        goal, context_str
    )
}

/// Build stuck intervention prompt
pub fn build_unstick_prompt(task_title: &str, stuck_reason: &str, task_context: Option<&str>) -> String {
    let context_str = task_context.unwrap_or("No additional context");
    format!(
        "The user is stuck on this task:\n\nTask: {}\nReason: {}\nContext: {}\n\nProvide an intervention.",
        task_title, stuck_reason, context_str
    )
}

/// Build coaching chat prompt
pub fn build_coaching_prompt(
    task_title: &str,
    user_message: &str,
    chat_history: &[ChatMessageForPrompt],
) -> String {
    let mut prompt = format!("Task context: {}\n\n", task_title);

    if !chat_history.is_empty() {
        prompt.push_str("Recent conversation:\n");
        for msg in chat_history.iter().rev().take(5) {
            prompt.push_str(&format!("{}: {}\n", msg.role, msg.content));
        }
        prompt.push_str("\n");
    }

    prompt.push_str(&format!("User: {}", user_message));
    prompt
}

/// Chat message for prompt context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessageForPrompt {
    pub role: String,
    pub content: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prompt_builder() {
        let prompt = PromptBuilder::new()
            .set("task", "Write documentation")
            .set("time", "30 minutes")
            .build("Task: {task} in {time}");

        assert_eq!(prompt, "Task: Write documentation in 30 minutes");
    }

    #[test]
    fn test_build_task_decomposition_prompt() {
        let prompt = build_task_decomposition_prompt("Write report", "Monthly sales report", Some(60));
        assert!(prompt.contains("Write report"));
        assert!(prompt.contains("Monthly sales report"));
        assert!(prompt.contains("60"));
    }

    #[test]
    fn test_build_goal_clarification_prompt() {
        let prompt = build_goal_clarification_prompt("Get in shape", Some("Want to run a 5k"));
        assert!(prompt.contains("Get in shape"));
        assert!(prompt.contains("Want to run a 5k"));
    }

    #[test]
    fn test_build_unstick_prompt() {
        let prompt = build_unstick_prompt("Write chapter", "Overwhelmed by scope", Some("First chapter of thesis"));
        assert!(prompt.contains("Write chapter"));
        assert!(prompt.contains("Overwhelmed by scope"));
        assert!(prompt.contains("First chapter of thesis"));
    }
}
