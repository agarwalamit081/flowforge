use serde::{Deserialize, Serialize};
use std::env;
use tauri::State;

use crate::db::Database;
use crate::models::*;
use crate::services::{LlmProvider, LlmRequest, OpenAiProvider};
use crate::services::{build_task_decomposition_prompt, build_goal_clarification_prompt, build_unstick_prompt, ChatMessageForPrompt};

type CommandResult<T> = Result<T, String>;

fn map_err<T>(result: crate::db::AppResult<T>) -> CommandResult<T> {
    result.map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_task(db: State<'_, Database>, input: CreateTaskRequest) -> CommandResult<Task> {
    map_err(db.create_task(input))
}

#[tauri::command]
pub fn get_task(db: State<'_, Database>, task_id: String) -> CommandResult<Task> {
    map_err(db.get_task(&task_id))
}

#[tauri::command]
pub fn list_tasks(db: State<'_, Database>, filter: Option<TaskFilter>) -> CommandResult<Vec<Task>> {
    map_err(db.list_tasks(filter))
}

#[tauri::command]
pub fn update_task(db: State<'_, Database>, id: String, patch: UpdateTaskRequest) -> CommandResult<Task> {
    map_err(db.update_task(&id, patch))
}

#[tauri::command]
pub fn delete_task(db: State<'_, Database>, id: String) -> CommandResult<()> {
    map_err(db.delete_task(&id))
}

#[tauri::command]
pub fn update_task_status(db: State<'_, Database>, id: String, status: TaskStatus) -> CommandResult<Task> {
    map_err(db.update_task_status(&id, status))
}

#[tauri::command]
pub fn create_micro_task(
    db: State<'_, Database>,
    task_id: String,
    input: CreateMicroTaskRequest,
) -> CommandResult<MicroTask> {
    map_err(db.create_micro_task(&task_id, input))
}

#[tauri::command]
pub fn complete_micro_task(db: State<'_, Database>, id: String) -> CommandResult<MicroTask> {
    map_err(db.complete_micro_task(&id))
}

#[tauri::command]
pub fn reorder_micro_tasks(db: State<'_, Database>, updates: Vec<ReorderUpdate>) -> CommandResult<()> {
    map_err(db.reorder_micro_tasks(updates))
}

#[tauri::command]
pub fn create_project(db: State<'_, Database>, input: CreateProjectRequest) -> CommandResult<Project> {
    map_err(db.create_project(input))
}

#[tauri::command]
pub fn list_projects(db: State<'_, Database>) -> CommandResult<Vec<Project>> {
    map_err(db.list_projects())
}

#[tauri::command]
pub fn archive_project(db: State<'_, Database>, id: String) -> CommandResult<()> {
    map_err(db.archive_project(&id))
}

#[tauri::command]
pub fn list_today_agenda(db: State<'_, Database>, date: String) -> CommandResult<TodayAgenda> {
    map_err(db.list_today_agenda(&date))
}

#[tauri::command]
pub fn create_daily_outcome(db: State<'_, Database>, input: CreateOutcomeRequest) -> CommandResult<DailyOutcome> {
    map_err(db.create_daily_outcome(input))
}

#[tauri::command]
pub fn run_morning_briefing(db: State<'_, Database>, date: String) -> CommandResult<MorningBriefing> {
    map_err(db.run_morning_briefing(&date))
}

#[tauri::command]
pub fn start_focus_session(
    db: State<'_, Database>,
    task_id: String,
    planned_minutes: i64,
) -> CommandResult<FocusSession> {
    map_err(db.start_focus_session(&task_id, planned_minutes))
}

#[tauri::command]
pub fn end_focus_session(db: State<'_, Database>, id: String, outcome: String) -> CommandResult<FocusSession> {
    map_err(db.end_focus_session(&id, &outcome))
}

#[tauri::command]
pub fn record_stuck_event(
    db: State<'_, Database>,
    task_id: String,
    reason: String,
) -> CommandResult<InterventionSuggestion> {
    map_err(db.record_stuck_event(&task_id, &reason))
}

#[tauri::command]
pub fn export_user_data(db: State<'_, Database>) -> CommandResult<ExportBundle> {
    map_err(db.export_user_data())
}

#[tauri::command]
pub fn purge_user_data(db: State<'_, Database>) -> CommandResult<()> {
    map_err(db.purge_user_data())
}

#[tauri::command]
pub fn get_app_settings(db: State<'_, Database>) -> CommandResult<AppSettings> {
    map_err(db.get_app_settings())
}

#[tauri::command]
pub fn update_app_settings(db: State<'_, Database>, patch: SettingsPatch) -> CommandResult<AppSettings> {
    map_err(db.update_app_settings(patch))
}

#[tauri::command]
pub fn connect_calendar(
    db: State<'_, Database>,
    input: CalendarConnectRequest,
) -> CommandResult<CalendarAccount> {
    map_err(db.connect_calendar(input))
}

#[tauri::command]
pub fn disconnect_calendar(db: State<'_, Database>, account_id: String) -> CommandResult<()> {
    map_err(db.disconnect_calendar(&account_id))
}

#[tauri::command]
pub fn list_calendar_accounts(db: State<'_, Database>) -> CommandResult<Vec<CalendarAccount>> {
    map_err(db.list_calendar_accounts())
}

#[tauri::command]
pub fn list_calendar_events(
    db: State<'_, Database>,
    range: CalendarRangeRequest,
) -> CommandResult<Vec<CalendarEvent>> {
    map_err(db.list_calendar_events(&range.start, &range.end))
}

#[tauri::command]
pub fn suggest_focus_slots(
    db: State<'_, Database>,
    input: FocusSlotSuggestionRequest,
) -> CommandResult<Vec<FocusSlotSuggestion>> {
    map_err(db.suggest_focus_slots(input))
}

#[tauri::command]
pub fn create_focus_block(
    db: State<'_, Database>,
    input: CreateFocusBlockRequest,
) -> CommandResult<FocusBlock> {
    map_err(db.create_focus_block(input))
}

#[tauri::command]
pub fn cancel_focus_block(db: State<'_, Database>, id: String) -> CommandResult<FocusBlock> {
    map_err(db.cancel_focus_block(&id))
}

#[tauri::command]
pub fn start_focus_block(db: State<'_, Database>, id: String) -> CommandResult<FocusBlock> {
    map_err(db.start_focus_block(&id))
}

#[tauri::command]
pub fn end_focus_block(db: State<'_, Database>, id: String) -> CommandResult<FocusBlock> {
    map_err(db.end_focus_block(&id))
}

#[tauri::command]
pub fn list_focus_blocks(
    db: State<'_, Database>,
    range: CalendarRangeRequest,
) -> CommandResult<Vec<FocusBlock>> {
    map_err(db.list_focus_blocks(&range.start, &range.end))
}

#[tauri::command]
pub fn list_monitoring_rules(db: State<'_, Database>) -> CommandResult<Vec<MonitoringRule>> {
    map_err(db.list_monitoring_rules())
}

#[tauri::command]
pub fn create_monitoring_rule(
    db: State<'_, Database>,
    input: CreateMonitoringRuleRequest,
) -> CommandResult<MonitoringRule> {
    map_err(db.create_monitoring_rule(input))
}

#[tauri::command]
pub fn delete_monitoring_rule(db: State<'_, Database>, id: String) -> CommandResult<()> {
    map_err(db.delete_monitoring_rule(&id))
}

#[tauri::command]
pub fn get_activity_log(
    db: State<'_, Database>,
    range: CalendarRangeRequest,
) -> CommandResult<Vec<ActivitySegment>> {
    map_err(db.get_activity_log(&range.start, &range.end))
}

#[tauri::command]
pub fn get_context_snapshot(db: State<'_, Database>) -> CommandResult<ContextSnapshot> {
    map_err(db.get_context_snapshot())
}

// =============================================
// Phase 3: AI-Powered Commands
// =============================================

/// Task decomposition request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskDecompositionRequest {
    pub task_id: String,
}

/// Goal clarification request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalClarificationRequest {
    pub task_id: String,
}

/// Intervention request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InterventionRequest {
    pub task_id: String,
    pub reason: String,
}

/// Chat message request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessageRequest {
    pub task_id: String,
    pub message: String,
}

/// AI usage stats request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiUsageStatsRequest {
    pub start: String,
    pub end: String,
}

/// AI provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiProviderConfig {
    pub provider: String,
    pub model: String,
    pub api_key: String,
}

/// Task decomposition result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskDecompositionResult {
    pub start_here_hint: String,
    pub good_enough_definition: String,
    pub micro_tasks: Vec<MicroTaskSuggestion>,
    pub accepted_at: Option<String>,
}

/// Micro-task suggestion from AI
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MicroTaskSuggestion {
    pub title: String,
    pub description: Option<String>,
    pub estimated_minutes: i64,
    pub success_criteria: Option<String>,
    pub friction_level: String,
}

/// Goal clarification result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalClarificationResult {
    pub smart_goal: String,
    pub done_looks_like: String,
    pub minimum_viable_outcome: String,
    pub first_measurable_step: String,
    pub suggested_timebox_minutes: i64,
}

/// Intervention result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InterventionResult {
    pub stuck_reason: String,
    pub tone: String,
    pub message: String,
    pub recommended_action: String,
    pub duration_minutes: i64,
    pub follow_up_question: Option<String>,
}

/// Chat response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatResponse {
    pub response: String,
    pub suggested_actions: Vec<SuggestedAction>,
    pub mood_assessment: Option<String>,
}

/// Suggested action from AI
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SuggestedAction {
    pub label: String,
    pub action_type: String,
}

#[tauri::command]
pub fn decompose_task(db: State<'_, Database>, input: TaskDecompositionRequest) -> CommandResult<TaskDecompositionResult> {
    let task = map_err(db.get_task(&input.task_id))?;

    let provider = env::var("FLOWFORGE_DEFAULT_AI_PROVIDER").unwrap_or_else(|_| "openai".to_string());
    let model = env::var("FLOWFORGE_DEFAULT_MODEL").unwrap_or_else(|_| "gpt-4.1-mini".to_string());

    let api_key = match provider.as_str() {
        "openai" => env::var("OPENAI_API_KEY"),
        "anthropic" => env::var("ANTHROPIC_API_KEY"),
        "deepseek" => env::var("DEEPSEEK_API_KEY"),
        _ => return Err("Unsupported AI provider".to_string()),
    };

    let api_key = api_key.map_err(|_| format!("{} API key not found", provider.to_uppercase()))?;

    let llm_provider = OpenAiProvider::new(api_key, model);
    let user_prompt = build_task_decomposition_prompt(
        &task.title,
        task.description.as_deref().unwrap_or("No description"),
        task.estimated_minutes,
    );

    let request = LlmRequest {
        system_prompt: crate::services::TASK_DECOMPOSITION_SYSTEM.to_string(),
        user_prompt,
        max_tokens: 4096,
        temperature: 0.7,
    };

    let response = llm_provider.complete_structured::<TaskDecompositionResultInternal>(request)
        .map_err(|e| e.to_string())?;

    Ok(TaskDecompositionResult {
        start_here_hint: response.start_here_hint,
        good_enough_definition: response.good_enough_definition,
        micro_tasks: response.micro_tasks.into_iter().map(Into::into).collect(),
        accepted_at: None,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TaskDecompositionResultInternal {
    start_here_hint: String,
    good_enough_definition: String,
    micro_tasks: Vec<MicroTaskInternal>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct MicroTaskInternal {
    title: String,
    description: Option<String>,
    estimated_minutes: i64,
    success_criteria: Option<String>,
    friction_level: String,
}

impl From<MicroTaskInternal> for crate::commands::MicroTaskSuggestion {
    fn from(value: MicroTaskInternal) -> Self {
        Self {
            title: value.title,
            description: value.description,
            estimated_minutes: value.estimated_minutes,
            success_criteria: value.success_criteria,
            friction_level: value.friction_level,
        }
    }
}

#[tauri::command]
pub fn clarify_goal(db: State<'_, Database>, input: GoalClarificationRequest) -> CommandResult<GoalClarificationResult> {
    let task = map_err(db.get_task(&input.task_id))?;

    let provider = env::var("FLOWFORGE_DEFAULT_AI_PROVIDER").unwrap_or_else(|_| "openai".to_string());
    let model = env::var("FLOWFORGE_DEFAULT_MODEL").unwrap_or_else(|_| "gpt-4.1-mini".to_string());

    let api_key = match provider.as_str() {
        "openai" => env::var("OPENAI_API_KEY"),
        "anthropic" => env::var("ANTHROPIC_API_KEY"),
        "deepseek" => env::var("DEEPSEEK_API_KEY"),
        _ => return Err("Unsupported AI provider".to_string()),
    };

    let api_key = api_key.map_err(|_| format!("{} API key not found", provider.to_uppercase()))?;

    let llm_provider = OpenAiProvider::new(api_key, model);
    let user_prompt = build_goal_clarification_prompt(&task.title, task.description.as_deref());

    let request = LlmRequest {
        system_prompt: crate::services::GOAL_CLARIFICATION_SYSTEM.to_string(),
        user_prompt,
        max_tokens: 2048,
        temperature: 0.7,
    };

    let response = llm_provider.complete_structured::<GoalClarificationResultInternal>(request)
        .map_err(|e| e.to_string())?;

    Ok(GoalClarificationResult {
        smart_goal: response.smart_goal,
        done_looks_like: response.done_looks_like,
        minimum_viable_outcome: response.minimum_viable_outcome,
        first_measurable_step: response.first_measurable_step,
        suggested_timebox_minutes: response.suggested_timebox_minutes,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GoalClarificationResultInternal {
    smart_goal: String,
    done_looks_like: String,
    minimum_viable_outcome: String,
    first_measurable_step: String,
    suggested_timebox_minutes: i64,
}

#[tauri::command]
pub fn get_stuck_intervention(db: State<'_, Database>, input: InterventionRequest) -> CommandResult<InterventionResult> {
    let task = map_err(db.get_task(&input.task_id))?;

    let provider = env::var("FLOWFORGE_DEFAULT_AI_PROVIDER").unwrap_or_else(|_| "openai".to_string());
    let model = env::var("FLOWFORGE_DEFAULT_MODEL").unwrap_or_else(|_| "gpt-4.1-mini".to_string());

    let api_key = match provider.as_str() {
        "openai" => env::var("OPENAI_API_KEY"),
        "anthropic" => env::var("ANTHROPIC_API_KEY"),
        "deepseek" => env::var("DEEPSEEK_API_KEY"),
        _ => return Err("Unsupported AI provider".to_string()),
    };

    let api_key = api_key.map_err(|_| format!("{} API key not found", provider.to_uppercase()))?;

    let llm_provider = OpenAiProvider::new(api_key, model);
    let user_prompt = build_unstick_prompt(&task.title, &input.reason, task.description.as_deref());

    let request = LlmRequest {
        system_prompt: crate::services::UNSTUCK_INTERVENTION_SYSTEM.to_string(),
        user_prompt,
        max_tokens: 2048,
        temperature: 0.8,
    };

    let response = llm_provider.complete_structured::<InterventionResultInternal>(request)
        .map_err(|e| e.to_string())?;

    Ok(InterventionResult {
        stuck_reason: response.stuck_reason,
        tone: response.tone,
        message: response.message,
        recommended_action: response.recommended_action,
        duration_minutes: response.duration_minutes,
        follow_up_question: response.follow_up_question,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct InterventionResultInternal {
    stuck_reason: String,
    tone: String,
    message: String,
    recommended_action: String,
    duration_minutes: i64,
    follow_up_question: Option<String>,
}

#[tauri::command]
pub fn send_chat_message(db: State<'_, Database>, input: ChatMessageRequest) -> CommandResult<ChatResponse> {
    // Save user message
    map_err(db.save_chat_message(&input.task_id, "user", &input.message))?;

    let task = map_err(db.get_task(&input.task_id))?;

    let provider = env::var("FLOWFORGE_DEFAULT_AI_PROVIDER").unwrap_or_else(|_| "openai".to_string());
    let model = env::var("FLOWFORGE_DEFAULT_MODEL").unwrap_or_else(|_| "gpt-4.1-mini".to_string());

    let api_key = match provider.as_str() {
        "openai" => env::var("OPENAI_API_KEY"),
        "anthropic" => env::var("ANTHROPIC_API_KEY"),
        "deepseek" => env::var("DEEPSEEK_API_KEY"),
        _ => return Err("Unsupported AI provider".to_string()),
    };

    let api_key = api_key.map_err(|_| format!("{} API key not found", provider.to_uppercase()))?;

    // Get chat history for context
    let history = map_err(db.get_chat_messages(&input.task_id))?;
    let history_for_prompt: Vec<ChatMessageForPrompt> = history
        .iter()
        .rev()
        .take(10)
        .map(|msg| ChatMessageForPrompt {
            role: msg.role.clone(),
            content: msg.content.clone(),
        })
        .collect();

    let llm_provider = OpenAiProvider::new(api_key, model);
    let user_prompt = crate::services::build_coaching_prompt(&task.title, &input.message, &history_for_prompt);

    let request = LlmRequest {
        system_prompt: crate::services::COACHING_CHAT_SYSTEM.to_string(),
        user_prompt,
        max_tokens: 4096,
        temperature: 0.9,
    };

    let response = llm_provider.complete(request)
        .map_err(|e| e.to_string())?;

    // Save assistant message
    map_err(db.save_chat_message(&input.task_id, "assistant", &response.content))?;

    Ok(ChatResponse {
        response: response.content,
        suggested_actions: vec![],
        mood_assessment: None,
    })
}

#[tauri::command]
pub fn get_ai_usage_stats(db: State<'_, Database>, input: AiUsageStatsRequest) -> CommandResult<crate::models::AiUsageStats> {
    map_err(db.get_ai_usage_stats(&input.start, &input.end))
}

#[tauri::command]
pub fn delete_ai_data(db: State<'_, Database>) -> CommandResult<()> {
    map_err(db.delete_ai_data())
}

#[tauri::command]
pub fn test_ai_connection(_db: State<'_, Database>, input: AiProviderConfig) -> CommandResult<bool> {
    // TODO: Test connection with the provided credentials
    // For now, just validate the API key format
    let is_valid = !input.api_key.is_empty() && input.api_key.len() > 20;
    Ok(is_valid)
}
