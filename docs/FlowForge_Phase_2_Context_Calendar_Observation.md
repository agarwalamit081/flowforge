# FlowForge Phase 2 — Context, Calendar & Activity Observation

> **Estimated Duration:** 3–4 weeks  
> **Milestone:** FlowForge becomes context-aware — it knows your calendar, tracks your active windows, and gently nudges you when your focus drifts.

---

## 1. Goal & Philosophy

Add the first **context-aware** layer to FlowForge. Where Phase 1 owned tasks, Phase 2 owns **context**. The app learns whether you are in a meeting, a focus block, a break, or unplanned time — and compares that against what you should be doing.

This phase intentionally **still avoids** screenshots, browser extensions, local LLMs, and heavy AI. The intelligence comes from simple rules, calendar data, and window-title metadata. The result should feel like an agenda app that *pays attention*.

### Why This Phase Second

Phase 1 built the data backbone (tasks, projects, sessions). Phase 2 adds the **situational awareness** that all future intervention logic depends on. Without knowing what meeting you are in, what app you are using, and whether you are in a planned focus block, the Intervention Engine (Phase 3) has nothing to reason about. Getting the Context Manager right here means Phase 3 can focus entirely on AI intelligence rather than plumbing.

---

## 2. Primary User Outcomes

| # | Outcome | Description |
|---|---------|-------------|
| 1 | Google Calendar connected | User authenticates with OAuth 2.0; events are synced locally. |
| 2 | Calendar visible | Today's meetings and available focus slots appear in the UI. |
| 3 | Focus blocks created | User creates time-bounded focus blocks from agenda tasks. |
| 4 | App/window tracked | Active window changes are logged locally every few seconds. |
| 5 | Transparent activity log | User can see what was tracked, when, and why. |
| 6 | Privacy controls | User configures allow/deny lists for which apps are monitored. |
| 7 | Gentle nudges | App detects focus drift and shows a non-intrusive reminder. |
| 8 | Meeting-aware | Task nudges are suppressed during calendar meetings. |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 React UI (Additions)                     │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │  Calendar   │ │ Time-Block   │ │  Activity         │  │
│  │  Panel      │ │  Assistant   │ │  Dashboard        │  │
│  └─────────────┘ └──────────────┘ └───────────────────┘  │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │  Focus      │ │  Monitoring  │ │  Nudge /          │  │
│  │  Overlay    │ │  Controls    │ │  Notification     │  │
│  └─────────────┘ └──────────────┘ └───────────────────┘  │
│                          │                                │
│                          │ Tauri IPC + Events             │
├──────────────────────────┼───────────────────────────────┤
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │               Rust Backend (Additions)             │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │           Context Manager (v1)                │  │  │
│  │  │  What should you do?  What are you doing?    │  │  │
│  │  │  Should I nudge?       What kind of nudge?   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │  │
│  │  │ Calendar │ │  Active  │ │  Intervention    │   │  │
│  │  │  Sync    │ │  Window  │ │  Engine (v1)     │   │  │
│  │  │  Service │ │  Service │ │  Rules only      │   │  │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │  │
│  │  │  Focus   │ │  Privacy │ │  Time-Block      │   │  │
│  │  │  Session │ │  Policy  │ │  Scheduler       │   │  │
│  │  │  Service │ │  Engine  │ │                  │   │  │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │     SQLite Repositories (Phase 1 + Phase 2)  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                                │
├──────────────────────────┼───────────────────────────────┤
│  SQLite + OS Keychain + Local Log Files                  │
└──────────────────────────────────────────────────────────┘
         ▲                              ▲
    ┌────┴────┐                   ┌──────┴──────┐
    │ Windows │                   │  Google API │
    │ OS APIs │                   │  (Calendar) │
    │ (Win32) │                   │  OAuth 2.0  │
    └─────────┘                   └─────────────┘
```

### What Changes from Phase 1

| Phase 1 | Phase 2 |
|---------|---------|
| Synchronous IPC only | IPC **+** Tauri event stream (backend pushes to frontend) |
| No background services | Multiple `tokio` background tasks running continuously |
| User-initiated actions | App-initiated observations and nudges |
| Single Context Manager question: none | Five Context Manager questions per evaluation cycle |
| No calendar awareness | Google Calendar integrated and cached locally |

---

## 4. Technical Stack

### 4.1 Carried Forward from Phase 1

| Technology | Purpose |
|-----------|---------|
| Tauri v2 | Desktop runtime, system tray, IPC |
| React 18 + TypeScript + Vite | Frontend framework and build tool |
| Tailwind CSS | Styling |
| Zustand | UI state management |
| Rust + Tokio + Serde + Chrono | Backend async runtime and serialization |
| SQLite via rusqlite | Local persistent storage |

### 4.2 New Additions in Phase 2

| Technology | Crate/Library | Purpose |
|-----------|---------------|---------|
| OAuth token storage | `keyring` | Store Google OAuth tokens in Windows Credential Manager |
| HTTP client | `reqwest` | Google Calendar API calls |
| OAuth 2.0 flow | `tauri-plugin-oauth` | Browser-based Google sign-in |
| Active window detection | `active-win-pos-rs` or Win32 API | Detect focused app name + window title |
| Global hotkeys | `tauri-plugin-global-shortcut` | "Unstick Me" keyboard shortcut (e.g., `Ctrl+Shift+U`) |
| System notifications | `tauri-plugin-notification` | Windows toast notifications for nudges |
| Date/time parsing | `icalendar` crate (optional) | Parse Google Calendar `.ics` data |
| Background scheduler | `tokio::time::interval` | Periodic polling for calendar sync and window tracking |

---

## 5. Google Calendar Sync

### 5.1 Scope

Only sync the metadata needed for scheduling and context awareness. **Avoid** storing full event descriptions, attendee lists, or attachment data unless the user explicitly opts in.

| Field | Synced? | Reason |
|-------|---------|--------|
| Event ID | Yes | Unique identifier and cache key |
| Title | Yes | Shown in calendar panel and Morning Briefing |
| Start/end time | Yes | Core scheduling data |
| Busy/free status | Yes | Determines available focus slots |
| Location | Yes (if provided) | Optional context for time-block suggestions |
| Meeting URL | Yes (if provided) | Quick-access link in UI |
| Full description | No | Privacy: may contain sensitive content |
| Attendees | No | Not needed for scheduling |

### 5.2 SQLite Schema Additions

```sql
-- =============================================
-- Calendar Accounts
-- =============================================
CREATE TABLE calendar_accounts (
  id            TEXT PRIMARY KEY,          -- UUID v4
  provider      TEXT NOT NULL,             -- 'google' (extensible to 'outlook', 'ical')
  email         TEXT NOT NULL,
  display_name  TEXT,
  sync_enabled  INTEGER NOT NULL DEFAULT 1,  -- 1 = active, 0 = paused
  last_synced_at TEXT,                     -- Timestamp of last successful sync
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- =============================================
-- Calendar Events (cached from provider)
-- =============================================
CREATE TABLE calendar_events (
  id                  TEXT PRIMARY KEY,
  provider_event_id   TEXT NOT NULL,       -- Google's event ID
  account_id          TEXT NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  starts_at           TEXT NOT NULL,       -- ISO 8601
  ends_at             TEXT NOT NULL,       -- ISO 8601
  busy_status         TEXT NOT NULL DEFAULT 'busy'
                       CHECK(busy_status IN ('busy', 'tentative', 'free', 'oof')),
  location            TEXT,
  meeting_url         TEXT,
  source_updated_at   TEXT,                -- Google's updated timestamp
  local_updated_at    TEXT NOT NULL,       -- When we last saved it
  UNIQUE(account_id, provider_event_id)
);

CREATE INDEX idx_cal_events_account ON calendar_events(account_id);
CREATE INDEX idx_cal_events_time ON calendar_events(starts_at, ends_at);

-- =============================================
-- Focus Blocks (user-created or suggested)
-- =============================================
CREATE TABLE focus_blocks (
  id                  TEXT PRIMARY KEY,    -- UUID v4
  task_id             TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  calendar_event_id   TEXT REFERENCES calendar_events(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,       -- "Deep work: Landing page"
  starts_at           TEXT NOT NULL,
  ends_at             TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'planned'
                       CHECK(status IN ('planned', 'active', 'completed', 'cancelled')),
  created_by          TEXT NOT NULL DEFAULT 'user'  -- 'user' | 'suggested'
                       CHECK(created_by IN ('user', 'suggested')),
  created_at          TEXT NOT NULL
);

CREATE INDEX idx_focus_blocks_time ON focus_blocks(starts_at, ends_at);
CREATE INDEX idx_focus_blocks_status ON focus_blocks(status);
```

### 5.3 OAuth 2.0 Flow

```
┌──────────┐     ┌──────────────┐     ┌───────────────┐     ┌────────────┐
│  FlowForge│────▶│  Google OAuth│────▶│  User Browser │────▶│  Callback  │
│  (Tauri)  │     │  Consent     │     │  Login Screen │     │  Redirect  │
└──────────┘     └──────────────┘     └───────────────┘     └──────┬─────┘
       ▲                                                             │
       │    ┌──────────────┐     ┌──────────────┐                    │
       └────│  Access +    │◀────│  Exchange    │◀───────────────────┘
            │  Refresh     │     │  Code Token  │
            │  Token       │     └──────────────┘
            └──────┬───────┘
                   │
            ┌──────▼───────┐
            │  keyring     │
            │  (Windows    │
            │  Credential  │
            │  Manager)    │
            └──────────────┘
```

**Implementation steps:**

1. Register a Google Cloud project with OAuth 2.0 Client ID (desktop app type).
2. Use `tauri-plugin-oauth` to open the browser consent screen.
3. Google redirects back to a local callback URL with an authorization code.
4. Exchange the code for access + refresh tokens via `reqwest`.
5. Store refresh token in `keyring` (Windows Credential Manager); access token in memory only.
6. Implement automatic token refresh when the access token expires (typically 1 hour).
7. Sync events periodically in a background `tokio` task (every 15 minutes).

### 5.4 Calendar Sync Background Task

```rust
// Simplified sync loop
async fn calendar_sync_loop(
    account: CalendarAccount,
    db: Arc<SQLiteRepo>,
    interval: Duration,
) {
    let mut timer = tokio::time::interval(interval);
    loop {
        timer.tick().await;
        if !account.sync_enabled { continue; }

        // Fetch events from last_synced_at to now + 7 days ahead
        let events = fetch_google_events(&account, &db.last_sync_time()).await;

        // Upsert into calendar_events table
        db.upsert_calendar_events(&account.id, &events).await;

        // Update last_synced_at
        db.update_account_sync_time(&account.id).await;
    }
}
```

---

## 6. Active Window Tracking

### 6.1 MVP Behavior

Log **metadata only** — no screenshots. Every 5 seconds (configurable), poll the OS for the currently focused window:

| Data Point | Source | Privacy Note |
|-----------|--------|-------------|
| App name | `active-win-pos-rs` | Always logged |
| Window title | `active-win-pos-rs` | Subject to monitoring rules |
| Process name | Win32 `GetForegroundWindow` + `GetWindowThreadProcessId` | Always logged |
| Start timestamp | System clock | Always logged |
| Duration | Computed (current - previous) | Always logged |
| Privacy state | Monitoring rules evaluation | `allowed`, `redacted_title`, `denied` |

**No screenshots are captured in Phase 2.** Screenshot capture is deferred to Phase 4 after the privacy pipeline is mature.

### 6.2 SQLite Schema Additions

```sql
-- =============================================
-- Activity Segments (app/window usage)
-- =============================================
CREATE TABLE activity_segments (
  id                          TEXT PRIMARY KEY,    -- UUID v4
  app_name                    TEXT NOT NULL,       -- "Visual Studio Code"
  process_name                TEXT,                -- "Code.exe"
  window_title                TEXT,                -- Raw title (before redaction)
  window_title_redacted       TEXT,                -- After applying monitoring rules
  domain                      TEXT,                -- From browser extension (Phase 4)
  started_at                  TEXT NOT NULL,       -- ISO 8601
  ended_at                    TEXT,                -- ISO 8601 (NULL if current)
  duration_seconds            INTEGER,             -- Computed when segment ends
  privacy_state               TEXT NOT NULL DEFAULT 'allowed'
                              CHECK(privacy_state IN ('allowed', 'redacted_title', 'denied')),
  linked_focus_session_id     TEXT REFERENCES focus_sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_time ON activity_segments(started_at, ended_at);
CREATE INDEX idx_activity_app ON activity_segments(app_name);
CREATE INDEX idx_activity_focus ON activity_segments(linked_focus_session_id);

-- =============================================
-- Monitoring Rules (privacy allow/deny lists)
-- =============================================
CREATE TABLE monitoring_rules (
  id          TEXT PRIMARY KEY,
  rule_type   TEXT NOT NULL,                 -- 'app_name', 'process_name', 'window_title_contains', 'domain'
  pattern     TEXT NOT NULL,                 -- Regex or exact match (e.g., ".*Bank.*")
  action      TEXT NOT NULL,                 -- 'allow', 'redact_title', 'deny'
  reason      TEXT,                          -- User-provided label (e.g., "Banking app")
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_monitoring_rules_type ON monitoring_rules(rule_type);
```

### 6.3 Window Tracking Service

```rust
struct ActiveWindowService {
    poll_interval: Duration,           // Default: 5 seconds
    privacy_engine: PrivacyPolicyEngine,
    db: Arc<SQLiteRepo>,
    current_segment: Option<ActivitySegment>,
}

impl ActiveWindowService {
    async fn poll_loop(&mut self) {
        let mut timer = tokio::time::interval(self.poll_interval);
        loop {
            timer.tick().await;

            let window = get_active_window().await; // OS-specific call

            // Apply monitoring rules
            let privacy_state = self.privacy_engine.evaluate(&window);

            if privacy_state == PrivacyState::Denied {
                continue; // Skip entirely
            }

            let redacted_title = match privacy_state {
                PrivacyState::Allowed => Some(window.title.clone()),
                PrivacyState::RedactedTitle => Some("[REDACTED]".to_string()),
                _ => None,
            };

            // Close previous segment, start new one if app changed
            self.update_segment(window, redacted_title).await;

            // Emit event to frontend
            emit_activity_update(&window, &privacy_state);
        }
    }
}
```

### 6.4 Default Monitoring Rules (Auto-Excluded)

Pre-populate the `monitoring_rules` table with common sensitive apps:

| Pattern | Type | Action | Reason |
|---------|------|--------|--------|
| `.*Bank.*` | `app_name` | `deny` | Banking application |
| `.*Wallet.*` | `app_name` | `deny` | Cryptocurrency / payment |
| `.*Password.*` | `app_name` | `deny` | Password manager |
| `.*1Password.*` | `app_name` | `deny` | 1Password |
| `.*Bitwarden.*` | `app_name` | `deny` | Bitwarden |
| `.*Health.*` | `app_name` | `deny` | Health/medical app |
| `.* Therapy.*` | `window_title_contains` | `deny` | Therapy / mental health |
| `.*doctor.*` | `window_title_contains` | `redact_title` | Medical |
| `.*ssn.*` | `window_title_contains` | `deny` | SSN / sensitive ID |
| `.*credit card.*` | `window_title_contains` | `deny` | Financial data |

Users can modify these rules at any time from the Monitoring Controls UI.

---

## 7. Context Manager (v1)

The Context Manager is the **central brain** that coordinates all services. It runs continuously in a background Tokio task, evaluating the user's situation every 5–15 seconds.

### 7.1 Data Model

```rust
struct ContextSnapshot {
    now: DateTime<Utc>,
    active_task_id: Option<String>,
    active_focus_block_id: Option<String>,
    active_calendar_event_id: Option<String>,
    active_app: Option<AppActivity>,
    monitoring_allowed: bool,
    intent_state: IntentState,
}

#[derive(Debug, Clone)]
struct AppActivity {
    app_name: String,
    process_name: Option<String>,
    window_title: Option<String>,
    domain: Option<String>,  // Populated by browser extension in Phase 4
    duration_seconds: u64,
}

#[derive(Debug, Clone, PartialEq)]
enum IntentState {
    NoPlan,           // No focus block, no meeting, no task selected
    InMeeting,        // Calendar event with busy=true is current
    InFocusBlock,     // User-created focus block is active
    BreakTime,        // Between focus blocks or after a session
    OverdueTask,      // Highest-priority task is past due
}
```

### 7.2 Evaluation Loop

```
Every 5–15 seconds:
  │
  ├─ Load current focus block (if any)
  │    └─ If focus_block.status == 'active' → IntentState::InFocusBlock
  │
  ├─ Load current calendar event (if any overlaps with 'now')
  │    └─ If event.busy_status == 'busy' → IntentState::InMeeting
  │
  ├─ Load top-priority incomplete task
  │    └─ If task.due_at < now → IntentState::OverdueTask
  │
  ├─ Load active window from Activity Service
  │    └─ Apply monitoring rules → set monitoring_allowed
  │
  ├─ Determine IntentState
  │    └─ Fallback: IntentState::NoPlan
  │
  ├─ Compare: intended context vs. actual context
  │    ├─ Focus block active + on-task → no action
  │    ├─ Focus block active + off-task → possible drift nudge
  │    ├─ In meeting → suppress task nudges
  │    └─ No plan + work hours → suggest planning
  │
  ├─ Emit ContextSnapshot to frontend via Tauri event
  │
  └─ If intervention needed → query Intervention Engine
       └─ Intervention Engine returns nudge → emit to frontend
```

### 7.3 Frontend Event Subscription

```typescript
// React component subscribing to context updates
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten = listen<ContextSnapshot>('context-update', (event) => {
    setContext(event.payload);
  });
  return () => { unlisten.then(fn => fn()); };
}, []);
```

---

## 8. Time-Block Assistant

### 8.1 Inputs

The time-block assistant suggests optimal focus slots based on:

| Input | Source |
|-------|--------|
| Task estimate | `tasks.estimated_minutes` |
| Task due date | `tasks.due_at` |
| Task energy level | `tasks.energy_level` |
| Calendar busy blocks | `calendar_events` |
| User working hours | `settings.working_hours_start/end` |
| Existing focus blocks | `focus_blocks` |
| Historical focus patterns | `focus_sessions` (average completion rate) |

### 8.2 Scheduling Algorithm (Simple Bin-Packing)

```
1. Define the scheduling window (e.g., today 09:00 – 17:00).
2. Subtract calendar busy blocks → produces "free windows".
3. Subtract existing FlowForge focus blocks → produces "available windows".
4. For each task that needs scheduling:
   a. Find all available windows >= task.estimated_minutes.
   b. Score each window:
      - Higher score if window is before the task's due date.
      - Higher score if window matches task's energy_level preference.
      - Higher score if window is in the user's historical peak hours.
      - Lower score if window is adjacent to a meeting (context-switch cost).
   c. Return top 3 scored windows to the user.
5. User selects a window → create a `focus_block` record.
```

### 8.3 New IPC Commands

| Command | Signature | Description |
|---------|-----------|-------------|
| `connect_calendar` | `(provider: String) -> CalendarAccount` | Initiate OAuth flow |
| `disconnect_calendar` | `(account_id: String) -> ()` | Remove account and purge cached events |
| `list_calendar_events` | `(start: String, end: String) -> Vec<CalendarEvent>` | Fetch cached events for a date range |
| `suggest_focus_slots` | `(task_id: String) -> Vec<FocusSlotSuggestion>` | Get time-block suggestions |
| `create_focus_block` | `(input: CreateFocusBlockRequest) -> FocusBlock` | Create a planned focus block |
| `cancel_focus_block` | `(id: String) -> ()` | Cancel a planned focus block |
| `start_focus_block` | `(id: String) -> FocusBlock` | Transition to active |
| `end_focus_block` | `(id: String, outcome: String) -> FocusBlock` | Complete a focus block |
| `list_monitoring_rules` | `() -> Vec<MonitoringRule>` | Get all privacy rules |
| `create_monitoring_rule` | `(input: CreateRuleRequest) -> MonitoringRule` | Add a privacy rule |
| `delete_monitoring_rule` | `(id: String) -> ()` | Remove a rule |
| `get_activity_log` | `(start: String, end: String, limit: i32) -> Vec<ActivitySegment>` | Browse activity history |

---

## 9. Intervention Engine (v1 — Rules Only)

Phase 2's Intervention Engine uses **deterministic rules only**. AI-powered interventions are added in Phase 3.

### 9.1 Intervention Priority Order

| Priority | Condition | Intervention |
|----------|-----------|--------------|
| 1 (highest) | Privacy rule denies monitoring | **Suppress all nudges** for this app/window |
| 2 | Calendar event with `busy=true` is current | **Suppress all task nudges** (user is in a meeting) |
| 3 | User is actively working on their focus task | **No nudge** (positive reinforcement — do not interrupt flow) |
| 4 | Focus block active + user switched to a non-work app for > grace period | **Gentle redirect**: "Still working on [task]? You have [X] minutes left in your focus block." |
| 5 | Focus block active + user idle for > 15 minutes | **Idle nudge**: "Your focus block is running. Want to continue, pause, or end it?" |
| 6 | No focus block + no meeting + work hours + incomplete tasks | **Suggest planning**: "You have [X] tasks to do. Want to schedule a focus block?" |
| 7 | Task status = `stuck` for > 30 minutes | **Stuck follow-up**: Use Phase 1 stuck workflow, now with context (which app they were using when they got stuck) |
| 8 | User clicks "Unstick Me" global hotkey | **Manual intervention**: Show the lowest-friction next action for their top task |

### 9.2 Nudge Delivery

| Method | When | Example |
|--------|------|---------|
| Windows toast notification | Low urgency (priority 6, 8) | "You have 3 tasks to do today" |
| In-app overlay | Medium urgency (priority 4, 5, 7) | "Still working on the landing page?" |
| System tray tooltip | Minimal interruption | Tray icon changes color / shows badge |

### 9.3 Grace Period

When a user switches away from a focus task, do **not** nudge immediately. Wait a configurable grace period (default: 2 minutes). This prevents false positives when the user briefly switches to look up documentation or check email.

```rust
struct DriftDetector {
    grace_period: Duration,        // Default: 2 minutes
    drift_threshold: Duration,     // Default: 5 minutes (for escalating nudge)
    off_task_since: Option<Instant>,
}
```

---

## 10. UI Additions

### 10.1 Calendar Panel

```
┌─────────────────────────────────────────────────────┐
│  📅 Today — May 6, 2026                             │
│                                                      │
│  09:00 – 09:30  ☕  Morning Briefing                  │
│  09:30 – 11:00  🔴 Team Standup                      │
│  11:00 – 12:30  🟢 Focus: Landing page redesign      │
│                 └ Task: Ship landing page             │
│  12:30 – 13:30  🍽 Lunch                              │
│  13:30 – 15:00  🟢 Focus: Weekly report               │
│                 └ Task: Write team update             │
│  15:00 – 16:00  🔵 1:1 with Manager                  │
│  16:00 – 17:00  ⬜ Available (suggest focus block)    │
│                                                      │
│  [+ Suggest Focus Blocks]                             │
└──────────────────────────────────────────────────────┘
```

### 10.2 Activity Dashboard

```
┌─────────────────────────────────────────────────────┐
│  📊 Activity — Today                                 │
│                                                      │
│  Focus Time:     2h 15m / 3h 30m planned            │
│  Meeting Time:   1h 30m                             │
│  Break Time:     45m                                │
│  Distracted:     20m  (Social media, News)           │
│                                                      │
│  Top Apps:                                           │
│  ████████████████████  VS Code        2h 10m        │
│  ██████                Chrome         45m            │
│  ███                   Slack          20m            │
│  ██                    File Explorer  10m            │
│                                                      │
│  [View Full Log] [Configure Monitoring]              │
└──────────────────────────────────────────────────────┘
```

### 10.3 Monitoring Controls

```
┌─────────────────────────────────────────────────────┐
│  🔒 Privacy & Monitoring                            │
│                                                      │
│  Active Tracking: [ON / OFF]                         │
│  Poll Interval:  [5 sec ▾]                           │
│                                                      │
│  Auto-Excluded (default):                            │
│  ❌ Banking apps                                      │
│  ❌ Password managers                                │
│  ❌ Health/medical apps                               │
│                                                      │
│  Custom Rules:                                       │
│  ❌ "Spotify" — app_name — deny                      │
│  🟡 ".*[Pp]assword.*" — title — redact_title         │
│  ✅ "VS Code" — app_name — allow                     │
│                                                      │
│  [+ Add Rule]                                        │
│                                                      │
│  [Export Activity Log] [Purge Activity Data]         │
└──────────────────────────────────────────────────────┘
```

---

## 11. Windows Testing Notes

### 11.1 Must-Verify on Windows (Native)

| Test | Why It Matters |
|------|---------------|
| Tray icon persists after minimize-to-tray | Core always-on behavior |
| Notifications appear and are not suppressed | Windows notification settings can be aggressive |
| Active window tracking returns accurate app names and titles | Win32 API behavior varies across Windows versions |
| Privacy deny rules prevent titles from being stored | Security requirement |
| Google OAuth redirect completes successfully | WebView2 + OAuth redirect chain |
| Tokens are stored in Windows Credential Manager via `keyring` | Verify secure storage |
| App restarts without losing calendar sync state | Offline resilience |
| Global hotkey (`Ctrl+Shift+U`) triggers "Unstick Me" | System-wide keyboard hook |

### 11.2 WSL2 Limitations for Phase 2

| Feature | WSL2 | Native Windows |
|---------|------|----------------|
| Active window tracking | ❌ No Win32 API access | ✅ Required |
| System tray | ❌ No Linux desktop integration | ✅ Required |
| Toast notifications | ❌ No native notification API | ✅ Required |
| OAuth redirect | ⚠️ Possible but unreliable | ✅ Required |
| Rust unit tests (non-GUI) | ✅ | ✅ |
| Frontend build checks | ✅ | ✅ |
| SQLite migration tests | ✅ | ✅ |

---

## 12. Deliverables

| Deliverable | Description |
|-------------|-------------|
| Google Calendar connection | OAuth 2.0 flow, token storage, periodic sync |
| Local calendar cache | Calendar events stored in SQLite for offline use |
| Time-block assistant | Suggests optimal focus slots based on calendar gaps |
| Active app/window tracking | Background service logging metadata every 5 seconds |
| Context Manager v1 | Continuously evaluates intent state vs. actual activity |
| Monitoring allow/deny controls | UI for configuring which apps are tracked |
| Focus session overlay | In-app overlay when a focus block starts |
| Nudge system | Gentle notifications when focus drifts or planning is needed |
| Activity dashboard | Visual breakdown of how time was spent |
| Global hotkey | `Ctrl+Shift+U` triggers "Unstick Me" from anywhere |

---

## 13. Exit Criteria

| Criteria | Validation |
|----------|------------|
| FlowForge identifies whether the user is in a meeting, focus block, break, or unplanned time | Context Manager unit tests + manual observation |
| The app compares active focus task against active app/window metadata | Drift detection test: start focus block, switch to social media, verify nudge appears after grace period |
| Privacy controls can redact or block sensitive app/window data before persistence | Create a deny rule, verify no data stored for that app |
| Windows runtime testing passes for tray, OAuth, notifications, and active-window monitoring | Manual test checklist completed |
| Calendar events sync and remain available offline | Disconnect network, verify cached events still display |
| All Phase 1 features continue to work | Regression test: task CRUD, Morning Briefing, Unstick Me |