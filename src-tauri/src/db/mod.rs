use std::path::Path;
use std::sync::Mutex;

use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, MappedRows, OptionalExtension, Row};
use serde_json::json;
use thiserror::Error;
use uuid::Uuid;

use crate::models::*;
use crate::services;

const MIGRATION_0001: &str = include_str!("migrations/0001_initial.sql");

#[derive(Debug, Error)]
pub enum AppError {
    #[error("database error: {0}")]
    Db(#[from] rusqlite::Error),
    #[error("serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("not found: {0}")]
    NotFound(String),
}

pub type AppResult<T> = Result<T, AppError>;

pub struct Database {
    connection: Mutex<Connection>,
    default_ai_provider: String,
    default_ai_model: String,
}

impl Database {
    pub fn new(path: &Path, default_ai_provider: String, default_ai_model: String) -> AppResult<Self> {
        let connection = Connection::open(path)?;
        connection.execute_batch(MIGRATION_0001)?;
        let db = Self {
            connection: Mutex::new(connection),
            default_ai_provider,
            default_ai_model,
        };
        db.seed_settings()?;
        Ok(db)
    }

    #[cfg(test)]
    pub fn new_in_memory() -> AppResult<Self> {
        let connection = Connection::open_in_memory()?;
        connection.execute_batch(MIGRATION_0001)?;
        let db = Self {
            connection: Mutex::new(connection),
            default_ai_provider: "openai".to_string(),
            default_ai_model: "gpt-4.1-mini".to_string(),
        };
        db.seed_settings()?;
        Ok(db)
    }

    fn conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.connection.lock().expect("database mutex poisoned")
    }

    fn seed_settings(&self) -> AppResult<()> {
        let settings = self.default_settings();
        let conn = self.conn();
        for (key, value) in [
            ("theme", settings.theme),
            ("accent_color", settings.accent_color),
            ("morning_briefing_enabled", settings.morning_briefing_enabled.to_string()),
            ("default_focus_minutes", settings.default_focus_minutes.to_string()),
            ("default_ai_provider", settings.default_ai_provider),
            ("default_ai_model", settings.default_ai_model),
        ] {
            conn.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
                params![key, value],
            )?;
        }
        Ok(())
    }

    fn default_settings(&self) -> AppSettings {
        AppSettings {
            theme: "system".to_string(),
            accent_color: "#2e5e4e".to_string(),
            morning_briefing_enabled: true,
            default_focus_minutes: 25,
            default_ai_provider: self.default_ai_provider.clone(),
            default_ai_model: self.default_ai_model.clone(),
        }
    }

    pub fn create_project(&self, input: CreateProjectRequest) -> AppResult<Project> {
        let now = now();
        let project = Project {
            id: Uuid::new_v4().to_string(),
            name: input.name,
            description: input.description,
            color: input.color.unwrap_or_else(|| "#2e5e4e".to_string()),
            status: "active".to_string(),
            created_at: now.clone(),
            updated_at: now,
        };

        self.conn().execute(
            "INSERT INTO projects (id, name, description, color, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                project.id,
                project.name,
                project.description,
                project.color,
                project.status,
                project.created_at,
                project.updated_at
            ],
        )?;
        Ok(project)
    }

    pub fn list_projects(&self) -> AppResult<Vec<Project>> {
        let conn = self.conn();
        let mut statement = conn.prepare(
            "SELECT id, name, description, color, status, created_at, updated_at
             FROM projects
             WHERE status = 'active'
             ORDER BY updated_at DESC",
        )?;
        let rows = statement.query_map([], map_project)?;
        collect_rows(rows)
    }

    pub fn archive_project(&self, id: &str) -> AppResult<()> {
        let now = now();
        let conn = self.conn();
        conn.execute("UPDATE projects SET status = 'archived', updated_at = ?2 WHERE id = ?1", params![id, now])?;
        conn.execute("UPDATE tasks SET status = 'archived', updated_at = ?2 WHERE project_id = ?1", params![id, now])?;
        Ok(())
    }

    pub fn create_task(&self, input: CreateTaskRequest) -> AppResult<Task> {
        let now = now();
        let id = Uuid::new_v4().to_string();
        self.conn().execute(
            "INSERT INTO tasks (
                id, project_id, title, description, status, priority, energy_level, estimated_minutes,
                actual_minutes, due_at, scheduled_start_at, scheduled_end_at, source, start_here_hint,
                good_enough_definition, sort_order, created_at, updated_at, completed_at
             ) VALUES (?1, ?2, ?3, ?4, 'not_started', ?5, 'medium', ?6, 0, ?7, NULL, NULL, 'manual', NULL, ?8, 0, ?9, ?9, NULL)",
            params![
                id,
                input.project_id,
                input.title,
                input.description,
                input.priority.unwrap_or(3),
                input.estimated_minutes,
                input.due_at,
                input.good_enough_definition,
                now,
            ],
        )?;
        self.insert_event("task_created", "task", &id, json!({"title": input.title}))?;
        self.get_task(&id)
    }

    pub fn get_task(&self, task_id: &str) -> AppResult<Task> {
        let conn = self.conn();
        let mut statement = conn.prepare(
            "SELECT id, project_id, title, description, status, priority, energy_level, estimated_minutes,
                    actual_minutes, due_at, scheduled_start_at, scheduled_end_at, source, start_here_hint,
                    good_enough_definition, sort_order, created_at, updated_at, completed_at
             FROM tasks WHERE id = ?1",
        )?;
        let mut task: Task = statement
            .query_row(params![task_id], map_task_base)
            .optional()?
            .ok_or_else(|| AppError::NotFound(format!("task {task_id}")))?;
        hydrate_task(&conn, &mut task)?;
        Ok(task)
    }

    pub fn list_tasks(&self, filter: Option<TaskFilter>) -> AppResult<Vec<Task>> {
        let conn = self.conn();
        let mut tasks = {
            let mut statement = conn.prepare(
                "SELECT id, project_id, title, description, status, priority, energy_level, estimated_minutes,
                        actual_minutes, due_at, scheduled_start_at, scheduled_end_at, source, start_here_hint,
                        good_enough_definition, sort_order, created_at, updated_at, completed_at
                 FROM tasks
                 WHERE (?1 IS NULL OR status = ?1)
                   AND (?2 IS NULL OR project_id = ?2)
                   AND (?3 IS NULL OR priority = ?3)
                   AND (?4 IS NULL OR due_at LIKE (?4 || '%'))
                   AND status != 'archived'
                 ORDER BY priority ASC, COALESCE(due_at, '9999-12-31T00:00:00') ASC, updated_at DESC",
            )?;
            let rows = statement.query_map(
                params![
                    filter.as_ref().and_then(|item| item.status.clone()),
                    filter.as_ref().and_then(|item| item.project_id.clone()),
                    filter.as_ref().and_then(|item| item.priority),
                    filter.as_ref().and_then(|item| item.due_date.clone()),
                ],
                map_task_base,
            )?;
            collect_rows(rows)?
        };

        for task in &mut tasks {
            hydrate_task(&conn, task)?;
        }

        if let Some(filter) = filter {
            if let Some(tag) = filter.tag {
                tasks.retain(|task| task.tags.iter().any(|task_tag| task_tag == &tag));
            }
        }
        Ok(tasks)
    }

    pub fn update_task(&self, id: &str, patch: UpdateTaskRequest) -> AppResult<Task> {
        let mut task = self.get_task(id)?;
        task.project_id = patch.project_id.or(task.project_id);
        if let Some(title) = patch.title {
            task.title = title;
        }
        if let Some(description) = patch.description {
            task.description = Some(description);
        }
        if let Some(priority) = patch.priority {
            task.priority = priority;
        }
        if let Some(due_at) = patch.due_at {
            task.due_at = Some(due_at);
        }
        if let Some(estimated_minutes) = patch.estimated_minutes {
            task.estimated_minutes = Some(estimated_minutes);
        }
        if let Some(good_enough_definition) = patch.good_enough_definition {
            task.good_enough_definition = Some(good_enough_definition);
        }
        task.updated_at = now();

        self.conn().execute(
            "UPDATE tasks
             SET project_id = ?2, title = ?3, description = ?4, priority = ?5, due_at = ?6,
                 estimated_minutes = ?7, good_enough_definition = ?8, updated_at = ?9
             WHERE id = ?1",
            params![
                id,
                task.project_id,
                task.title,
                task.description,
                task.priority,
                task.due_at,
                task.estimated_minutes,
                task.good_enough_definition,
                task.updated_at,
            ],
        )?;
        self.get_task(id)
    }

    pub fn delete_task(&self, id: &str) -> AppResult<()> {
        self.update_task_status(id, TaskStatus::Archived)?;
        Ok(())
    }

    pub fn update_task_status(&self, id: &str, status: TaskStatus) -> AppResult<Task> {
        let completed_at = if matches!(status, TaskStatus::Done) {
            Some(now())
        } else {
            None
        };
        let updated_at = now();
        self.conn().execute(
            "UPDATE tasks SET status = ?2, updated_at = ?3, completed_at = ?4 WHERE id = ?1",
            params![id, status.as_str(), updated_at, completed_at],
        )?;
        self.insert_event(
            "status_changed",
            "task",
            id,
            json!({ "status": status.as_str() }),
        )?;
        self.get_task(id)
    }

    pub fn create_micro_task(&self, task_id: &str, input: CreateMicroTaskRequest) -> AppResult<MicroTask> {
        let conn = self.conn();
        let position: i64 = conn.query_row(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM micro_tasks WHERE task_id = ?1",
            params![task_id],
            |row| row.get(0),
        )?;
        let micro_task = MicroTask {
            id: Uuid::new_v4().to_string(),
            task_id: task_id.to_string(),
            title: input.title,
            position,
            estimated_minutes: input.estimated_minutes.unwrap_or(10),
            status: "not_started".to_string(),
            created_at: now(),
            completed_at: None,
        };
        conn.execute(
            "INSERT INTO micro_tasks (id, task_id, title, position, estimated_minutes, status, created_at, completed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL)",
            params![
                micro_task.id,
                micro_task.task_id,
                micro_task.title,
                micro_task.position,
                micro_task.estimated_minutes,
                micro_task.status,
                micro_task.created_at,
            ],
        )?;
        Ok(micro_task)
    }

    pub fn complete_micro_task(&self, id: &str) -> AppResult<MicroTask> {
        let completed_at = now();
        self.conn().execute(
            "UPDATE micro_tasks SET status = 'done', completed_at = ?2 WHERE id = ?1",
            params![id, completed_at],
        )?;
        let conn = self.conn();
        conn.query_row(
            "SELECT id, task_id, title, position, estimated_minutes, status, created_at, completed_at
             FROM micro_tasks WHERE id = ?1",
            params![id],
            map_micro_task,
        )
        .map_err(AppError::from)
    }

    pub fn reorder_micro_tasks(&self, updates: Vec<ReorderUpdate>) -> AppResult<()> {
        let conn = self.conn();
        for update in updates {
            conn.execute(
                "UPDATE micro_tasks SET position = ?2 WHERE id = ?1",
                params![update.id, update.position],
            )?;
        }
        Ok(())
    }

    pub fn create_daily_outcome(&self, input: CreateOutcomeRequest) -> AppResult<DailyOutcome> {
        let outcome = DailyOutcome {
            id: Uuid::new_v4().to_string(),
            local_date: input.local_date,
            title: input.title,
            success_criteria: input.success_criteria,
            linked_task_id: None,
            status: "active".to_string(),
            created_at: now(),
        };
        self.conn().execute(
            "INSERT INTO daily_outcomes (id, local_date, title, success_criteria, linked_task_id, status, created_at)
             VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6)",
            params![
                outcome.id,
                outcome.local_date,
                outcome.title,
                outcome.success_criteria,
                outcome.status,
                outcome.created_at
            ],
        )?;
        Ok(outcome)
    }

    pub fn list_today_agenda(&self, date: &str) -> AppResult<TodayAgenda> {
        let outcomes = self.list_daily_outcomes(date)?;
        let tasks = self.list_tasks(Some(TaskFilter {
            status: None,
            project_id: None,
            priority: None,
            due_date: Some(date.to_string()),
            tag: None,
        }))?;
        Ok(TodayAgenda {
            date: date.to_string(),
            outcomes,
            tasks,
        })
    }

    pub fn run_morning_briefing(&self, date: &str) -> AppResult<MorningBriefing> {
        let agenda = self.list_today_agenda(date)?;
        let (headline, focus_prompt, suggested_task_ids) =
            services::morning_briefing(date, &agenda.outcomes, &agenda.tasks);
        Ok(MorningBriefing {
            date: date.to_string(),
            headline,
            focus_prompt,
            outcomes: agenda.outcomes,
            suggested_task_ids,
        })
    }

    pub fn start_focus_session(&self, task_id: &str, planned_minutes: i64) -> AppResult<FocusSession> {
        let session = FocusSession {
            id: Uuid::new_v4().to_string(),
            task_id: Some(task_id.to_string()),
            started_at: now(),
            ended_at: None,
            planned_minutes: Some(planned_minutes),
            actual_minutes: None,
            outcome: None,
            interruption_count: 0,
        };
        self.conn().execute(
            "INSERT INTO focus_sessions (id, task_id, started_at, ended_at, planned_minutes, actual_minutes, outcome, interruption_count)
             VALUES (?1, ?2, ?3, NULL, ?4, NULL, NULL, 0)",
            params![session.id, session.task_id, session.started_at, session.planned_minutes],
        )?;
        Ok(session)
    }

    pub fn end_focus_session(&self, id: &str, outcome: &str) -> AppResult<FocusSession> {
        let ended_at = now();
        let started_at: String = self
            .conn()
            .query_row(
                "SELECT started_at FROM focus_sessions WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| AppError::NotFound(format!("focus session {id}")))?;
        let actual_minutes = minutes_between(&started_at, &ended_at);
        self.conn().execute(
            "UPDATE focus_sessions
             SET ended_at = ?2, actual_minutes = ?3, outcome = ?4
             WHERE id = ?1",
            params![id, ended_at, actual_minutes, outcome],
        )?;
        let conn = self.conn();
        conn.query_row(
            "SELECT id, task_id, started_at, ended_at, planned_minutes, actual_minutes, outcome, interruption_count
             FROM focus_sessions WHERE id = ?1",
            params![id],
            map_focus_session,
        )
        .map_err(AppError::from)
    }

    pub fn record_stuck_event(&self, task_id: &str, reason: &str) -> AppResult<InterventionSuggestion> {
        let task = self.get_task(task_id)?;
        self.insert_event("stuck", "task", task_id, json!({ "reason": reason }))?;
        Ok(services::stuck_suggestion(&task, reason))
    }

    pub fn export_user_data(&self) -> AppResult<ExportBundle> {
        Ok(ExportBundle {
            projects: self.list_projects()?,
            tasks: self.list_tasks(None)?,
            daily_outcomes: self.list_daily_outcomes("%")?,
            focus_sessions: self.list_focus_sessions()?,
            settings: self.get_app_settings()?,
        })
    }

    pub fn purge_user_data(&self) -> AppResult<()> {
        let conn = self.conn();
        conn.execute_batch(
            "DELETE FROM task_tags;
             DELETE FROM task_links;
             DELETE FROM micro_tasks;
             DELETE FROM focus_sessions;
             DELETE FROM daily_outcomes;
             DELETE FROM agenda_events;
             DELETE FROM tasks;
             DELETE FROM projects;
             DELETE FROM tags;
             DELETE FROM settings;",
        )?;
        drop(conn);
        self.seed_settings()?;
        Ok(())
    }

    pub fn get_app_settings(&self) -> AppResult<AppSettings> {
        let conn = self.conn();
        let mut statement = conn.prepare("SELECT key, value FROM settings")?;
        let mut settings = self.default_settings();
        let rows = statement.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;
        for row in rows {
            let (key, value) = row?;
            match key.as_str() {
                "theme" => settings.theme = value,
                "accent_color" => settings.accent_color = value,
                "morning_briefing_enabled" => settings.morning_briefing_enabled = value == "true",
                "default_focus_minutes" => settings.default_focus_minutes = value.parse().unwrap_or(25),
                "default_ai_provider" => settings.default_ai_provider = value,
                "default_ai_model" => settings.default_ai_model = value,
                _ => {}
            }
        }
        Ok(settings)
    }

    pub fn update_app_settings(&self, patch: SettingsPatch) -> AppResult<AppSettings> {
        let mut current = self.get_app_settings()?;
        if let Some(theme) = patch.theme {
            current.theme = theme;
        }
        if let Some(accent_color) = patch.accent_color {
            current.accent_color = accent_color;
        }
        if let Some(enabled) = patch.morning_briefing_enabled {
            current.morning_briefing_enabled = enabled;
        }
        if let Some(minutes) = patch.default_focus_minutes {
            current.default_focus_minutes = minutes;
        }
        if let Some(provider) = patch.default_ai_provider {
            current.default_ai_provider = provider;
        }
        if let Some(model) = patch.default_ai_model {
            current.default_ai_model = model;
        }

        let conn = self.conn();
        for (key, value) in [
            ("theme", current.theme.clone()),
            ("accent_color", current.accent_color.clone()),
            ("morning_briefing_enabled", current.morning_briefing_enabled.to_string()),
            ("default_focus_minutes", current.default_focus_minutes.to_string()),
            ("default_ai_provider", current.default_ai_provider.clone()),
            ("default_ai_model", current.default_ai_model.clone()),
        ] {
            conn.execute(
                "INSERT INTO settings (key, value, updated_at)
                 VALUES (?1, ?2, ?3)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                params![key, value, now()],
            )?;
        }
        Ok(current)
    }

    fn list_daily_outcomes(&self, date: &str) -> AppResult<Vec<DailyOutcome>> {
        let conn = self.conn();
        let mut statement = conn.prepare(
            "SELECT id, local_date, title, success_criteria, linked_task_id, status, created_at
             FROM daily_outcomes
             WHERE local_date LIKE ?1
             ORDER BY created_at ASC",
        )?;
        let rows = statement.query_map(params![date], map_daily_outcome)?;
        collect_rows(rows)
    }

    fn list_focus_sessions(&self) -> AppResult<Vec<FocusSession>> {
        let conn = self.conn();
        let mut statement = conn.prepare(
            "SELECT id, task_id, started_at, ended_at, planned_minutes, actual_minutes, outcome, interruption_count
             FROM focus_sessions
             ORDER BY started_at DESC",
        )?;
        let rows = statement.query_map([], map_focus_session)?;
        collect_rows(rows)
    }

    fn insert_event(&self, event_type: &str, entity_type: &str, entity_id: &str, payload: serde_json::Value) -> AppResult<()> {
        self.conn().execute(
            "INSERT INTO agenda_events (id, event_type, entity_type, entity_id, payload_json, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                Uuid::new_v4().to_string(),
                event_type,
                entity_type,
                entity_id,
                serde_json::to_string(&payload)?,
                now(),
            ],
        )?;
        Ok(())
    }
}

fn map_project(row: &Row<'_>) -> rusqlite::Result<Project> {
    Ok(Project {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        color: row.get(3)?,
        status: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn map_task_base(row: &Row<'_>) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get(0)?,
        project_id: row.get(1)?,
        title: row.get(2)?,
        description: row.get(3)?,
        status: row.get(4)?,
        priority: row.get(5)?,
        energy_level: row.get(6)?,
        estimated_minutes: row.get(7)?,
        actual_minutes: row.get(8)?,
        due_at: row.get(9)?,
        scheduled_start_at: row.get(10)?,
        scheduled_end_at: row.get(11)?,
        source: row.get(12)?,
        start_here_hint: row.get(13)?,
        good_enough_definition: row.get(14)?,
        sort_order: row.get(15)?,
        created_at: row.get(16)?,
        updated_at: row.get(17)?,
        completed_at: row.get(18)?,
        micro_tasks: Vec::new(),
        tags: Vec::new(),
        links: Vec::new(),
    })
}

fn hydrate_task(conn: &Connection, task: &mut Task) -> AppResult<()> {
    let mut micro_task_statement = conn.prepare(
        "SELECT id, task_id, title, position, estimated_minutes, status, created_at, completed_at
         FROM micro_tasks WHERE task_id = ?1 ORDER BY position ASC",
    )?;
    let micro_rows = micro_task_statement.query_map(params![task.id], map_micro_task)?;
    task.micro_tasks = collect_rows(micro_rows)?;

    let mut tag_statement = conn.prepare(
        "SELECT tags.name
         FROM tags
         INNER JOIN task_tags ON task_tags.tag_id = tags.id
         WHERE task_tags.task_id = ?1
         ORDER BY tags.name ASC",
    )?;
    let tag_rows = tag_statement.query_map(params![task.id], |row| row.get::<_, String>(0))?;
    task.tags = collect_rows(tag_rows)?;

    let mut link_statement = conn.prepare(
        "SELECT id, task_id, link_type, label, uri, created_at
         FROM task_links WHERE task_id = ?1 ORDER BY created_at ASC",
    )?;
    let link_rows = link_statement.query_map(params![task.id], |row| {
        Ok(TaskLink {
            id: row.get(0)?,
            task_id: row.get(1)?,
            link_type: row.get(2)?,
            label: row.get(3)?,
            target: row.get(4)?,
            created_at: row.get(5)?,
        })
    })?;
    task.links = collect_rows(link_rows)?;
    Ok(())
}

fn map_micro_task(row: &Row<'_>) -> rusqlite::Result<MicroTask> {
    Ok(MicroTask {
        id: row.get(0)?,
        task_id: row.get(1)?,
        title: row.get(2)?,
        position: row.get(3)?,
        estimated_minutes: row.get(4)?,
        status: row.get(5)?,
        created_at: row.get(6)?,
        completed_at: row.get(7)?,
    })
}

fn map_daily_outcome(row: &Row<'_>) -> rusqlite::Result<DailyOutcome> {
    Ok(DailyOutcome {
        id: row.get(0)?,
        local_date: row.get(1)?,
        title: row.get(2)?,
        success_criteria: row.get(3)?,
        linked_task_id: row.get(4)?,
        status: row.get(5)?,
        created_at: row.get(6)?,
    })
}

fn map_focus_session(row: &Row<'_>) -> rusqlite::Result<FocusSession> {
    Ok(FocusSession {
        id: row.get(0)?,
        task_id: row.get(1)?,
        started_at: row.get(2)?,
        ended_at: row.get(3)?,
        planned_minutes: row.get(4)?,
        actual_minutes: row.get(5)?,
        outcome: row.get(6)?,
        interruption_count: row.get(7)?,
    })
}

fn now() -> String {
    Utc::now().to_rfc3339()
}

fn minutes_between(started_at: &str, ended_at: &str) -> i64 {
    let start = DateTime::parse_from_rfc3339(started_at)
        .map(|value| value.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now());
    let end = DateTime::parse_from_rfc3339(ended_at)
        .map(|value| value.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now());
    (end - start).num_minutes().max(0)
}

fn collect_rows<T, F>(rows: MappedRows<'_, F>) -> AppResult<Vec<T>>
where
    F: FnMut(&Row<'_>) -> rusqlite::Result<T>,
{
    let mut items = Vec::new();
    for row in rows {
        items.push(row?);
    }
    Ok(items)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn applies_migration_and_creates_task() {
        let db = Database::new_in_memory().unwrap();
        let task = db
            .create_task(CreateTaskRequest {
                project_id: None,
                title: "Ship MVP".to_string(),
                description: None,
                priority: Some(1),
                due_at: Some("2026-05-06T17:00:00".to_string()),
                estimated_minutes: Some(45),
                good_enough_definition: Some("Visible draft".to_string()),
            })
            .unwrap();

        assert_eq!(task.title, "Ship MVP");
        assert_eq!(db.list_tasks(None).unwrap().len(), 1);
    }

    #[test]
    fn exports_and_purges_data() {
        let db = Database::new_in_memory().unwrap();
        db.create_project(CreateProjectRequest {
            name: "FlowForge".to_string(),
            description: None,
            color: None,
        })
        .unwrap();
        db.create_daily_outcome(CreateOutcomeRequest {
            local_date: "2026-05-06".to_string(),
            title: "Finish bootstrap".to_string(),
            success_criteria: None,
        })
        .unwrap();

        let export = db.export_user_data().unwrap();
        assert_eq!(export.projects.len(), 1);
        assert_eq!(export.daily_outcomes.len(), 1);

        db.purge_user_data().unwrap();
        assert!(db.list_projects().unwrap().is_empty());
        assert!(db.list_daily_outcomes("%").unwrap().is_empty());
        assert_eq!(db.get_app_settings().unwrap().default_ai_provider, "openai");
    }
}
