use tauri::State;

use crate::db::Database;
use crate::models::*;

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
