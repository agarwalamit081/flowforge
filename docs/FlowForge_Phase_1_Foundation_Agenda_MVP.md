# FlowForge Phase 1 — Foundation + Agenda Tracker MVP

> **Estimated Duration:** 3–4 weeks  
> **Milestone:** A working Windows desktop app that lives in the system tray and functions as a focused agenda + daily intent tracker.

---

## 1. Goal & Philosophy

Build a small, stable Windows-tested desktop application that proves FlowForge can live in the system tray, store local data, and manage a useful agenda — without the full always-on intelligence stack.

This phase **intentionally avoids** screenshots, browser tracking, local LLMs, and advanced pattern detection. The outcome should feel like a focused agenda + daily intent app, not yet a full procrastination coach.

### Why This Phase First

The Agenda Tracker is the central nervous system of FlowForge. Every later module — from the Morning Briefing to the Intervention Engine to the Pattern Detector — reads from and writes to the task data managed here. Getting this data model and UI right early means every subsequent phase has a solid foundation to build on. Rushing into AI features or screenshot capture before a stable task system exists would create fragile integrations that break when the data model inevitably evolves.

---

## 2. Primary User Outcomes

| # | Outcome | Description |
|---|---------|-------------|
| 1 | Install and launch | User installs FlowForge on Windows and launches it from the Start Menu or system tray. |
| 2 | System tray access | App icon is visible in the system tray; right-click context menu opens the main window or quits. |
| 3 | Create tasks | User creates tasks, projects, and subtasks with titles, descriptions, priorities, and due dates. |
| 4 | Track status | Tasks can be `not_started`, `in_progress`, `stuck`, `blocked`, `done`, or `archived`. |
| 5 | Morning Briefing | A 5-minute check-in turns 1–3 daily outcomes into today's prioritized agenda. |
| 6 | Unstick Me | A button with rule-based suggestions for when the user feels stuck. |
| 7 | Persistent data | All data survives app restarts via local SQLite storage. |
| 8 | Data control | User can export all data as JSON or purge it entirely. |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────┐
│              System Tray & Main Window               │
│  ┌────────────────────────────────────────────────┐  │
│  │              React UI (Vite + TS)              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │Dashboard │ │  Agenda  │ │Morning Briefing│  │  │
│  │  └──────────┘ └──────────┘ └───────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │Projects  │ │ Settings │ │Data Viewer    │  │  │
│  │  └──────────┘ └──────────┘ └───────────────┘  │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │ Tauri IPC (invoke + events)  │
├───────────────────────┼──────────────────────────────┤
│  ┌────────────────────▼───────────────────────────┐  │
│  │               Rust Backend                     │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌──────────┐ │  │
│  │  │ App Bootstrap│ │System Tray  │ │Agenda Svc│ │  │
│  │  └────────────┘ └──────────────┘ └──────────┘ │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌──────────┐ │  │
│  │  │Briefing Svc│ │Intervention  │ │Settings  │ │  │
│  │  │            │ │  (rule-based)│ │  Service  │ │  │
│  │  └────────────┘ └──────────────┘ └──────────┘ │  │
│  │  ┌───────────────────────────────────────────┐ │  │
│  │  │        SQLite Repository (rusqlite)       │ │  │
│  │  └───────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│         Local SQLite Database + App Data Dir         │
└──────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Synchronous request-response IPC | Keeps Phase 1 architecture simple. Real-time events are added in Phase 2. |
| SQLite via rusqlite (not an ORM) | Direct SQL gives full control over migrations, performance, and the complex joins needed later. An ORM can be layered on later if desired. |
| No background scheduler yet | All operations are user-initiated. Background timers (calendar sync, activity polling) are added in Phase 2. |
| Zustand over Redux/Context | Minimal boilerplate for the number of UI slices needed. Each module (agenda, briefing, settings) gets its own store slice. |

---

## 4. Technical Stack

### 4.1 Desktop Shell

| Technology | Version | Purpose |
|-----------|---------|---------|
| Tauri | v2.x | Desktop runtime: system tray, window management, IPC bridge, native menus |
| Rust | stable | Backend logic, SQLite access, command handlers |
| `tauri-plugin-shell` | latest | Access to OS utilities (future phases) |
| `tauri-plugin-fs` | latest | Safe filesystem access for export/import |

### 4.2 Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18+ | Component framework for all 25+ future modules |
| TypeScript | 5.x | Type safety across IPC boundary |
| Vite | 6+ | Fast dev server with HMR; optimized production builds |
| Tailwind CSS | 4.x | Utility-first styling; dark/light theme support |
| Zustand | 5.x | Lightweight state management with minimal boilerplate |
| React Router | v7 | Client-side routing between Dashboard, Agenda, Settings |
| React Hook Form + Zod | latest | Form handling and validation for task creation/editing |
| Recharts | latest | Simple daily completion chart (optional) |
| Lucide React | latest | Consistent icon set |

### 4.3 Backend (Rust)

| Crate | Purpose |
|-------|---------|
| `rusqlite` | SQLite access with migrations |
| `tokio` | Async runtime foundation (light use in Phase 1) |
| `serde` + `serde_json` | Serialization/deserialization of all IPC payloads |
| `chrono` | Date/time handling for task dates and briefing timestamps |
| `uuid` | UUID v4 generation for entity IDs |
| `tauri` | Core Tauri APIs: commands, events, tray, window management |

### 4.4 Storage

| Component | Detail |
|-----------|--------|
| SQLite database | Located in Tauri's `app_data_dir` (e.g., `%APPDATA%/com.flowforge.dev/`) |
| Migrations | Versioned SQL files run on first launch and on upgrade |
| Export | Full data export as JSON (all tables) |
| Purge | Secure deletion of all user data (DROP tables + file deletion) |

---

## 5. Agenda Tracker — Detailed Specification

The Agenda Tracker is the **most important deliverable** of Phase 1. It is referenced by every subsequent phase, so the data model, backend API, and UI must be robust from the start.

### 5.1 Core Domain Concepts

| Concept | Description |
|---------|-------------|
| **Task** | A concrete unit of work. Can be quick, scheduled, stuck, or done. The atomic unit of the agenda. |
| **Project** | A grouping container for related tasks. Provides organizational hierarchy. |
| **MicroTask** | A 5–15 minute step. Created manually now; AI-generated in Phase 3. |
| **DailyOutcome** | A user-selected "today would be a win if..." goal. Drives the Morning Briefing. |
| **FocusSession** | A time-bounded attempt to work on a specific task. Tracked with planned vs. actual duration. |
| **AgendaEvent** | An internal timeline event (task created, status changed, stuck clicked). Powers the activity timeline. |
| **Tag** | Flexible labels (`admin`, `deep-work`, `health`, `urgent`) for filtering and categorization. |
| **TaskLink** | Attachments: links to files, URLs, emails, calendar events, or local notes. |

### 5.2 SQLite Schema

```sql
-- =============================================
-- Projects
-- =============================================
CREATE TABLE projects (
  id              TEXT PRIMARY KEY,          -- UUID v4
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT DEFAULT '#3b82f6',    -- Hex color for visual distinction
  status          TEXT NOT NULL DEFAULT 'active'  -- active | archived
                  CHECK(status IN ('active', 'archived')),
  created_at      TEXT NOT NULL,             -- ISO 8601
  updated_at      TEXT NOT NULL              -- ISO 8601
);

-- =============================================
-- Tasks (core entity)
-- =============================================
CREATE TABLE tasks (
  id                    TEXT PRIMARY KEY,    -- UUID v4
  project_id            TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title                 TEXT NOT NULL,
  description           TEXT,                -- Markdown supported
  status                TEXT NOT NULL DEFAULT 'not_started'
                        CHECK(status IN ('not_started','in_progress','stuck','blocked','done','archived')),
  priority              INTEGER NOT NULL DEFAULT 3
                        CHECK(priority BETWEEN 1 AND 5),  -- 1=urgent, 2=high, 3=medium, 4=low, 5=none
  energy_level          TEXT DEFAULT 'medium'
                        CHECK(energy_level IN ('low','medium','high')),
  estimated_minutes     INTEGER,             -- User's time estimate
  actual_minutes        INTEGER DEFAULT 0,   -- Tracked via focus sessions
  due_at                TEXT,                -- ISO 8601 datetime
  scheduled_start_at    TEXT,                -- Planned start (for time-blocking in Phase 2)
  scheduled_end_at      TEXT,                -- Planned end
  source                TEXT NOT NULL DEFAULT 'manual'
                        CHECK(source IN ('manual','calendar','email','voice','ai_decomposed')),
  start_here_hint       TEXT,                -- "Open the doc and title it" (Phase 3 AI)
  good_enough_definition TEXT,               -- MVP completion criteria
  sort_order            INTEGER DEFAULT 0,   -- For drag-and-drop ordering
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  completed_at          TEXT                 -- Set when status -> 'done'
);

-- Indexes for common queries
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_at);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- =============================================
-- Micro-tasks (sub-steps of a task)
-- =============================================
CREATE TABLE micro_tasks (
  id                TEXT PRIMARY KEY,        -- UUID v4
  task_id           TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  position          INTEGER NOT NULL,        -- Order within parent task
  estimated_minutes INTEGER DEFAULT 10,
  status            TEXT NOT NULL DEFAULT 'not_started'
                    CHECK(status IN ('not_started','in_progress','done')),
  created_at        TEXT NOT NULL,
  completed_at      TEXT
);

CREATE INDEX idx_micro_tasks_task ON micro_tasks(task_id);

-- =============================================
-- Daily Outcomes (morning intent)
-- =============================================
CREATE TABLE daily_outcomes (
  id               TEXT PRIMARY KEY,         -- UUID v4
  local_date       TEXT NOT NULL,            -- YYYY-MM-DD
  title            TEXT NOT NULL,            -- "Ship the landing page"
  success_criteria TEXT,                     -- "Page loads under 2s, all links work"
  linked_task_id   TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'active'
                    CHECK(status IN ('active','achieved','abandoned')),
  created_at       TEXT NOT NULL
);

CREATE INDEX idx_daily_outcomes_date ON daily_outcomes(local_date);

-- =============================================
-- Focus Sessions (time tracking)
-- =============================================
CREATE TABLE focus_sessions (
  id                TEXT PRIMARY KEY,        -- UUID v4
  task_id           TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  started_at        TEXT NOT NULL,
  ended_at          TEXT,
  planned_minutes   INTEGER,
  actual_minutes    INTEGER,
  outcome           TEXT,                     -- Free-text session reflection
  interruption_count INTEGER DEFAULT 0
);

CREATE INDEX idx_focus_sessions_task ON focus_sessions(task_id);

-- =============================================
-- Agenda Events (activity timeline)
-- =============================================
CREATE TABLE agenda_events (
  id            TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,               -- task_created, status_changed, stuck, unblocked, completed
  entity_type   TEXT NOT NULL,               -- task, micro_task, project, daily_outcome
  entity_id     TEXT NOT NULL,
  payload_json  TEXT,                        -- Structured event details
  created_at    TEXT NOT NULL
);

CREATE INDEX idx_agenda_events_entity ON agenda_events(entity_type, entity_id);
CREATE INDEX idx_agenda_events_time ON agenda_events(created_at);

-- =============================================
-- Tags & Task Tags (many-to-many)
-- =============================================
CREATE TABLE tags (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE task_tags (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- =============================================
-- Task Links (attachments)
-- =============================================
CREATE TABLE task_links (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  link_type  TEXT NOT NULL,                  -- url, file, email, calendar_event, note
  label      TEXT,
  uri        TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_task_links_task ON task_links(task_id);

-- =============================================
-- Settings (key-value store)
-- =============================================
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

### 5.3 Backend API (Rust Tauri Commands)

All commands are async Rust functions annotated with `#[tauri::command]`. They accept typed request structs and return typed response structs serialized with Serde.

#### Task Commands

| Command | Signature | Description |
|---------|-----------|-------------|
| `create_task` | `(CreateTaskRequest) -> Task` | Create a new task with all fields |
| `get_task` | `(task_id: String) -> Task` | Fetch a single task with its micro-tasks, tags, and links |
| `list_tasks` | `(filter: TaskFilter) -> Vec<Task>` | Filter by status, priority, project, due date, tag |
| `update_task` | `(id: String, patch: UpdateTaskRequest) -> Task` | Partial update of any task field |
| `delete_task` | `(id: String) -> ()` | Soft-delete (set status to `archived`) |
| `update_task_status` | `(id: String, status: TaskStatus) -> Task` | Transition task status with validation |

#### Micro-Task Commands

| Command | Signature | Description |
|---------|-----------|-------------|
| `create_micro_task` | `(task_id: String, input: CreateMicroTaskRequest) -> MicroTask` | Add a step to a task |
| `complete_micro_task` | `(id: String) -> MicroTask` | Mark a micro-task as done |
| `reorder_micro_tasks` | `(updates: Vec<ReorderUpdate>) -> ()` | Change ordering within parent task |

#### Project Commands

| Command | Signature | Description |
|---------|-----------|-------------|
| `create_project` | `(input: CreateProjectRequest) -> Project` | Create a project |
| `list_projects` | `() -> Vec<Project>` | List all active projects |
| `archive_project` | `(id: String) -> ()` | Archive a project and its tasks |

#### Agenda & Briefing Commands

| Command | Signature | Description |
|---------|-----------|-------------|
| `list_today_agenda` | `(date: String) -> TodayAgenda` | Returns daily outcomes + prioritized tasks |
| `create_daily_outcome` | `(input: CreateOutcomeRequest) -> DailyOutcome` | Set a daily win goal |
| `run_morning_briefing` | `(date: String) -> MorningBriefing` | Generate today's structured briefing |

#### Focus Session Commands

| Command | Signature | Description |
|---------|-----------|-------------|
| `start_focus_session` | `(task_id: String, planned_minutes: i32) -> FocusSession` | Begin tracking a work block |
| `end_focus_session` | `(id: String, outcome: String) -> FocusSession` | End session and record reflection |

#### Intervention Commands

| Command | Signature | Description |
|---------|-----------|-------------|
| `record_stuck_event` | `(task_id: String, reason: StuckReason) -> InterventionSuggestion` | Log that user is stuck, get suggestion |

#### Data Commands

| Command | Signature | Description |
|---------|-----------|-------------|
| `export_user_data` | `() -> ExportBundle` | Export all tables as JSON |
| `purge_user_data` | `() -> ()` | Delete all user data securely |
| `get_app_settings` | `() -> AppSettings` | Load current settings |
| `update_app_settings` | `(patch: SettingsPatch) -> AppSettings` | Update settings |

### 5.4 Agenda Tracker UI Screens

#### Screen 1: Today (Default Landing Page)

```
┌─────────────────────────────────────────────────────┐
│  ☀ Good morning! What would make today a win?       │
│  ┌─────────────────────────────────────────────┐    │
│  │ [Daily Outcome 1]  [Daily Outcome 2]  [+]  │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  Quick Capture: [_________________________] [+]     │
│                                                      │
│  ┌─ Today's Tasks ──────────────────────────────┐   │
│  │ 🔴 Ship landing page redesign      Due: Today│   │
│  │   ▸ Open Figma and export assets            │   │
│  │   ▸ Set up responsive grid                   │   │
│  │   ▸ Implement hero section                   │   │
│  │   [Start] [Break Down] [Stuck] [Done]        │   │
│  │                                               │   │
│  │ 🟡 Write weekly team update       Due: Today│   │
│  │   [Start] [Break Down] [Stuck] [Done]        │   │
│  │                                               │   │
│  │ 🟢 Review pull requests            Due: Fri  │   │
│  │   [Start] [Break Down] [Stuck] [Done]        │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

Key interactions:
- Daily outcomes are editable inline.
- Quick capture creates a task with `not_started` status and routes to Inbox for later triage.
- Task cards are color-coded by priority (left border).
- Action buttons trigger appropriate flows: `Start` creates a focus session, `Break Down` opens the micro-task panel, `Stuck` opens the stuck-workflow modal.

#### Screen 2: Inbox

```
┌─────────────────────────────────────────────────────┐
│  📥 Inbox                              [Select All] │
│  ┌─────────────────────────────────────────────┐    │
│  │ ☐ "Look into the database migration"        │    │
│  │   [→ Task] [→ Project] [→ Someday] [🗑]     │    │
│  │ ☐ "Handle the client feedback email"        │    │
│  │   [→ Task] [→ Project] [→ Someday] [🗑]     │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

Purpose: Quick-captured items land here for triage. One-click conversion routes them to the appropriate destination.

#### Screen 3: Projects

```
┌─────────────────────────────────────────────────────┐
│  📁 Projects                          [+ New Project]│
│  ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│  │ Website   │ │ Mobile App│ │ Admin     │        │
│  │ Redesign  │ │ v2        │ │ Overhaul  │        │
│  │ 8/12 tasks│ │ 3/5 tasks│ │ 0/3 tasks │        │
│  │ ██████░░░ │ │ ██████░░░ │ │ ░░░░░░░░░ │        │
│  └───────────┘ └───────────┘ └───────────┘        │
└──────────────────────────────────────────────────────┘
```

Each project card shows progress (tasks done / total). Clicking opens the project detail view with grouped tasks.

#### Screen 4: Task Detail (Slide-in Panel)

```
┌──────────────────────────────────────────────────────┐
│  ← Back    Ship landing page redesign                │
│  ─────────────────────────────────────────────────── │
│  Status:  [● Not Started ▾]  Priority: [🔴 Urgent ▾]│
│  Due:     [2026-05-08]      Energy:  [Medium ▾]      │
│  Estimate: [45 min]                                 │
│                                                       │
│  Description:                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ Update the marketing site with new brand...   │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  Start Here Hint:                                    │
│  💡 "Open Figma and export the new hero assets"      │
│                                                       │
│  Good Enough Definition:                             │
│  🎯 "Hero loads, CTA works, responsive on mobile"   │
│                                                       │
│  Micro-Tasks:                    [+ Add Step]        │
│  ☐ 1. Export hero assets from Figma     (10 min)    │
│  ☐ 2. Set up responsive CSS grid          (15 min)  │
│  ☐ 3. Implement hero section               (20 min)  │
│  ☐ 4. Add mobile breakpoints               (10 min)  │
│                                                       │
│  Links:                           [+ Add Link]       │
│  🔗 Figma Design File                                  │
│  📧 Client email thread                                │
│                                                       │
│  Tags: [deep-work] [design] [+ Add]                  │
│                                                       │
│  Activity Timeline:                                   │
│  • Created — May 6, 09:15                            │
│  • Status changed to stuck — May 6, 14:30            │
│  • Reason: "Unclear where to start"                  │
└──────────────────────────────────────────────────────┘
```

#### Screen 5: Review (End-of-Day)

```
┌─────────────────────────────────────────────────────┐
│  📊 Daily Review — May 6, 2026                       │
│                                                      │
│  Daily Outcomes:                                     │
│  ✅ Ship landing page redesign                        │
│  ❌ Write weekly team update                          │
│                                                      │
│  Completed Today:                                    │
│  ✅ Export hero assets from Figma          (12 min)  │
│  ✅ Set up responsive CSS grid              (18 min)  │
│  ❌ Implement hero section                  (planned 20)│
│                                                      │
│  Still Stuck:                                        │
│  ⚠ Write weekly team update — reason: "boring"      │
│                                                      │
│  Estimate vs. Actual:                                │
│  Planned: 45 min | Actual: 30 min | Tasks: 2/4      │
│                                                      │
│  [Carry Forward Incomplete] [End Review]             │
└──────────────────────────────────────────────────────┘
```

---

## 6. Morning Briefing

### Flow

1. User opens FlowForge (auto-shown on first launch of the day).
2. App displays yesterday's review summary (optional).
3. App prompts: *"What 1–3 outcomes would make today feel like a win?"*
4. User types outcomes; each is stored as a `DailyOutcome`.
5. App surfaces today's tasks (sorted by priority, then due date).
6. User confirms or adjusts the agenda.

### Implementation

```rust
struct MorningBriefing {
    date: NaiveDate,
    daily_outcomes: Vec<DailyOutcome>,
    carry_forward: Vec<Task>,      // Incomplete from yesterday
    today_tasks: Vec<Task>,         // Due today or overdue
    suggested_focus: Option<Task>,  // Highest-priority incomplete task
}
```

The `run_morning_briefing` command assembles this struct from multiple queries:
- `SELECT * FROM daily_outcomes WHERE local_date = ?`
- `SELECT * FROM tasks WHERE status NOT IN ('done','archived') AND due_at <= ?`
- Top task by priority + earliest due date.

---

## 7. Rule-Based Interventions (No AI Required)

Phase 1 uses **deterministic rules** instead of LLM calls. These are simple pattern-matchers that run when specific conditions are met.

| Trigger | Condition | Intervention |
|---------|-----------|--------------|
| User clicks `Stuck` | Always | Show modal: "What is blocking you?" with choices: `unclear`, `too_big`, `boring`, `anxious`, `waiting`, `tired` |
| Task has no micro-tasks | `estimated_minutes > 30` AND micro-task count = 0 | Suggest: "This task looks big. Want to break it into 3 smaller steps?" |
| Vague task title | Title starts with "work on", "look into", "handle", "figure out", "check" | Prompt: "What does 'done' look like for this task?" |
| Quick task detected | `estimated_minutes <= 5` OR title suggests < 5 min effort | Show Five-Minute Rule: "This takes less time than scrolling. Do it now?" |
| Task is overdue | `due_at < NOW()` AND status != `done` | Ask: "This is overdue. Reschedule, shrink scope, or archive?" |
| Task blocked | Status changed to `blocked` | Prompt: "What are you waiting on? Add a link or note." |
| No tasks for today | No tasks due today or this week | Suggest: "Your agenda is empty. Want to capture something?" |

### Implementation Pattern

```rust
struct InterventionRule {
    name: String,
    evaluate: fn(&Task, &AppState) -> bool,    // Pure function
    action: InterventionAction,                // What to show
}

enum InterventionAction {
    ShowStuckModal { reasons: Vec<StuckReason> },
    SuggestBreakdown { suggested_steps: u8 },
    PromptClarification { question: String },
    FiveMinuteNudge,
    OverdueOptions,
    BlockedFollowUp,
}
```

The intervention service iterates rules in priority order and returns the first match. This is fast, testable, and requires no external dependencies.

---

## 8. Windows WSL2 Development Setup

### 8.1 Prerequisites

On the **Windows host** (before WSL2 setup):

| Component | Where to Get |
|-----------|-------------|
| WSL2 | `wsl --install` in elevated PowerShell |
| Ubuntu 24.04 | `wsl --install -d Ubuntu-24.04` |
| WebView2 Runtime | Ships with Windows 11; download for Windows 10 from Microsoft |
| Visual Studio Build Tools 2022 | Install with "Desktop development with C++" workload |
| Windows 10/11 SDK | Via Visual Studio Installer |

### 8.2 Repository Layout

```
flowforge/
├── apps/
│   └── desktop/
│       ├── src-tauri/            # Rust backend
│       │   ├── Cargo.toml
│       │   ├── tauri.conf.json
│       │   ├── capabilities/
│       │   ├── src/
│       │   │   ├── main.rs
│       │   │   ├── lib.rs
│       │   │   ├── commands/     # Tauri IPC command handlers
│       │   │   ├── services/     # Business logic (agenda, briefing, etc.)
│       │   │   ├── db/           # SQLite migrations + repository
│       │   │   └── models/       # Shared Rust structs
│       │   └── icons/
│       ├── src/                  # React frontend
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── components/
│       │   ├── pages/
│       │   ├── stores/           # Zustand stores
│       │   ├── lib/              # Tauri invoke wrappers
│       │   └── types/
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.ts
├── docs/
│   └── architecture/
├── scripts/
│   └── dev.ps1                   # Windows dev helper script
└── README.md
```

### 8.3 WSL2 Installation (Ubuntu 24.04)

```bash
# Inside WSL2 Ubuntu 24.04
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential pkg-config libssl-dev curl git sqlite3

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# pnpm (fast, strict dependency resolution)
npm install -g pnpm

# Tauri CLI
cargo install tauri-cli --version '^2'

# Verify
rustc --version
node --version
pnpm --version
cargo tauri --version
```

### 8.4 Cargo Configuration for Windows Target

Create `.cargo/config.toml` in the project root:

```toml
[build]
target = "x86_64-pc-windows-msvc"
```

This ensures all `cargo` commands compile for Windows by default.

### 8.5 Recommended Development Workflow

| Activity | Run In | Notes |
|----------|--------|-------|
| Write and edit code | WSL2 | Linux filesystem for performance (VS Code Remote-WSL) |
| Run Rust unit tests | WSL2 | Tests that don't touch Windows GUI APIs |
| SQLite migration tests | WSL2 | Pure data layer tests |
| Frontend build checks | WSL2 | `pnpm build` to verify TS compilation |
| Linting and formatting | WSL2 | `cargo fmt`, `cargo clippy`, `pnpm lint` |
| GUI testing (tray, windows) | **Windows** | `pnpm tauri dev` launches native Windows window |
| Full app testing | **Windows** | Install from `\\wsl$\` path or mirrored checkout |

### 8.6 Tips for WSL2 ↔ Windows Filesystem

- **Avoid** running `cargo tauri dev` directly from the WSL2 filesystem (e.g., `/home/user/flowforge/`). File watchers and WebView2 load times are slow across the 9P filesystem bridge.
- **Recommended:** Keep a **mirrored checkout** on Windows (e.g., `C:\dev\flowforge`) and use Git from both environments to sync changes. Alternatively, clone on the Windows filesystem and access it from WSL2 via `/mnt/c/dev/flowforge`.
- **Vite config** must set `server.host: '0.0.0.0'` for HMR to work across WSL2 ↔ Windows.
- **Fonts:** Use web-safe fonts or bundle fonts in the frontend `public/` directory, since Linux fonts are not available in WebView2 on Windows.

---

## 9. Testing Plan

### 9.1 Automated Tests

| Layer | Tool | Coverage |
|-------|------|----------|
| Rust unit tests | `#[cfg(test)]` | Agenda service logic, intervention rules, date utilities |
| SQLite migration tests | rusqlite in-memory | All CREATE TABLE + INDEX statements, foreign keys, constraints |
| IPC contract tests | Shared types (TS + Rust) | Verify command signatures match between frontend and backend |
| Frontend component tests | Vitest + React Testing Library | Task creation form, status transitions, briefing flow |

### 9.2 Manual Windows Smoke Test

Use this checklist after every build:

- [ ] App installs without errors
- [ ] App launches from Start Menu
- [ ] Tray icon appears with context menu
- [ ] Main window opens from tray → "Open FlowForge"
- [ ] Main window closes to tray → "Close" (does not quit)
- [ ] App quits cleanly from tray → "Quit"
- [ ] Create a task with title, description, priority, and due date
- [ ] Task appears in the Today view
- [ ] Add 3 micro-tasks to the task
- [ ] Start a focus session on the task
- [ ] Complete a micro-task
- [ ] Click "Stuck" and select a reason
- [ ] Complete the task
- [ ] Run Morning Briefing
- [ ] Export data as JSON
- [ ] Quit and relaunch → all data persisted
- [ ] Purge all data → database is empty

---

## 10. Deliverables

| Deliverable | Description |
|-------------|-------------|
| Working Tauri v2 app | Launches on Windows, system tray, main window |
| Agenda Tracker | Full CRUD for tasks, projects, micro-tasks, tags, links |
| Morning Briefing MVP | Daily outcomes + prioritized agenda |
| Rule-Based Unstick Me | Deterministic intervention suggestions |
| SQLite persistence | All data in local database with migrations |
| Data export/import | JSON export and full purge capability |
| Settings page | Theme toggle, notification preferences |
| Phase 1 test suite | Unit tests + Windows smoke test checklist |

---

## 11. Exit Criteria

| Criteria | Validation |
|----------|------------|
| A Windows user can run FlowForge for a full day as a task and intent tracker | Manual end-to-end test |
| No data leaves the device | Network monitor shows zero outbound connections |
| All agenda data survives app restart | Create tasks → quit → relaunch → verify |
| The app builds from both WSL2 and native Windows | `cargo tauri dev` succeeds in both environments |
| All Phase 1 smoke tests pass | Checklist completed |
| SQLite schema supports Phase 2 additions | Foreign keys and indexes ready for calendar/activity tables |

---

## 12. What Comes Next (Phase 2 Preview)

Phase 2 adds the **context-awareness layer**:

- Google Calendar sync (read-only) via OAuth 2.0
- Active window / app tracking (background polling)
- Context Manager v1 (what should you be doing vs. what are you doing)
- Focus session overlays with gentle nudges
- Monitoring allow/deny privacy controls

The Agenda Tracker built in this phase becomes the **data backbone** that Phase 2's Context Manager reads from and writes to.