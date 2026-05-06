use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    NotStarted,
    InProgress,
    Stuck,
    Blocked,
    Done,
    Archived,
}

impl TaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::NotStarted => "not_started",
            Self::InProgress => "in_progress",
            Self::Stuck => "stuck",
            Self::Blocked => "blocked",
            Self::Done => "done",
            Self::Archived => "archived",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MicroTaskStatus {
    NotStarted,
    InProgress,
    Done,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MicroTask {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub position: i64,
    pub estimated_minutes: i64,
    pub status: String,
    pub created_at: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskLink {
    pub id: String,
    pub task_id: String,
    pub link_type: String,
    pub label: Option<String>,
    pub target: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub project_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: i64,
    pub energy_level: String,
    pub estimated_minutes: Option<i64>,
    pub actual_minutes: i64,
    pub due_at: Option<String>,
    pub scheduled_start_at: Option<String>,
    pub scheduled_end_at: Option<String>,
    pub source: String,
    pub start_here_hint: Option<String>,
    pub good_enough_definition: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
    pub micro_tasks: Vec<MicroTask>,
    pub tags: Vec<String>,
    pub links: Vec<TaskLink>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyOutcome {
    pub id: String,
    pub local_date: String,
    pub title: String,
    pub success_criteria: Option<String>,
    pub linked_task_id: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusSession {
    pub id: String,
    pub task_id: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub planned_minutes: Option<i64>,
    pub actual_minutes: Option<i64>,
    pub outcome: Option<String>,
    pub interruption_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarAccount {
    pub id: String,
    pub provider: String,
    pub email: String,
    pub display_name: Option<String>,
    pub sync_enabled: bool,
    pub last_synced_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    pub id: String,
    pub provider_event_id: String,
    pub account_id: String,
    pub title: String,
    pub starts_at: String,
    pub ends_at: String,
    pub busy_status: String,
    pub location: Option<String>,
    pub meeting_url: Option<String>,
    pub source_updated_at: Option<String>,
    pub local_updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusBlock {
    pub id: String,
    pub task_id: Option<String>,
    pub calendar_event_id: Option<String>,
    pub title: String,
    pub starts_at: String,
    pub ends_at: String,
    pub status: String,
    pub created_by: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitoringRule {
    pub id: String,
    pub rule_type: String,
    pub pattern: String,
    pub action: String,
    pub reason: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivitySegment {
    pub id: String,
    pub app_name: Option<String>,
    pub process_name: Option<String>,
    pub window_title_redacted: Option<String>,
    pub domain: Option<String>,
    pub started_at: String,
    pub ended_at: String,
    pub duration_seconds: i64,
    pub privacy_state: String,
    pub linked_focus_session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextSnapshot {
    pub generated_at: String,
    pub state: String,
    pub active_calendar_event_id: Option<String>,
    pub active_focus_block_id: Option<String>,
    pub current_task_id: Option<String>,
    pub activity_summary: Option<String>,
    pub nudge: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusSlotSuggestion {
    pub starts_at: String,
    pub ends_at: String,
    pub duration_minutes: i64,
    pub reason: String,
    pub task_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TodayAgenda {
    pub date: String,
    pub outcomes: Vec<DailyOutcome>,
    pub tasks: Vec<Task>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MorningBriefing {
    pub date: String,
    pub headline: String,
    pub focus_prompt: String,
    pub outcomes: Vec<DailyOutcome>,
    pub suggested_task_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InterventionSuggestion {
    pub task_id: String,
    pub reason: String,
    pub prompt: String,
    pub next_step: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub accent_color: String,
    pub morning_briefing_enabled: bool,
    pub default_focus_minutes: i64,
    pub default_ai_provider: String,
    pub default_ai_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportBundle {
    pub projects: Vec<Project>,
    pub tasks: Vec<Task>,
    pub daily_outcomes: Vec<DailyOutcome>,
    pub focus_sessions: Vec<FocusSession>,
    pub settings: AppSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub project_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<i64>,
    pub due_at: Option<String>,
    pub estimated_minutes: Option<i64>,
    pub good_enough_definition: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskRequest {
    pub project_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub priority: Option<i64>,
    pub due_at: Option<String>,
    pub estimated_minutes: Option<i64>,
    pub good_enough_definition: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskFilter {
    pub status: Option<String>,
    pub project_id: Option<String>,
    pub priority: Option<i64>,
    pub due_date: Option<String>,
    pub tag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMicroTaskRequest {
    pub title: String,
    pub estimated_minutes: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderUpdate {
    pub id: String,
    pub position: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOutcomeRequest {
    pub local_date: String,
    pub title: String,
    pub success_criteria: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsPatch {
    pub theme: Option<String>,
    pub accent_color: Option<String>,
    pub morning_briefing_enabled: Option<bool>,
    pub default_focus_minutes: Option<i64>,
    pub default_ai_provider: Option<String>,
    pub default_ai_model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarConnectRequest {
    pub provider: String,
    pub authorization_code: String,
    pub redirect_uri: String,
    pub code_verifier: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarRangeRequest {
    pub start: String,
    pub end: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusSlotSuggestionRequest {
    pub task_id: Option<String>,
    pub start: String,
    pub end: String,
    pub preferred_minutes: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFocusBlockRequest {
    pub task_id: Option<String>,
    pub calendar_event_id: Option<String>,
    pub title: String,
    pub starts_at: String,
    pub ends_at: String,
    pub created_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMonitoringRuleRequest {
    pub rule_type: String,
    pub pattern: String,
    pub action: String,
    pub reason: Option<String>,
}
