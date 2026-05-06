CREATE TABLE IF NOT EXISTS calendar_accounts (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  sync_enabled INTEGER NOT NULL DEFAULT 1,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  provider_event_id TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  busy_status TEXT NOT NULL CHECK(busy_status IN ('busy','tentative','free','out_of_office')),
  location TEXT,
  meeting_url TEXT,
  source_updated_at TEXT,
  local_updated_at TEXT NOT NULL,
  UNIQUE(account_id, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_cal_events_account ON calendar_events(account_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_time ON calendar_events(starts_at, ends_at);

CREATE TABLE IF NOT EXISTS focus_blocks (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  calendar_event_id TEXT REFERENCES calendar_events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('planned','active','completed','cancelled')),
  created_by TEXT NOT NULL CHECK(created_by IN ('user','suggested')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_focus_blocks_time ON focus_blocks(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_status ON focus_blocks(status);

CREATE TABLE IF NOT EXISTS activity_segments (
  id TEXT PRIMARY KEY,
  app_name TEXT,
  process_name TEXT,
  window_title_redacted TEXT,
  domain TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  privacy_state TEXT NOT NULL CHECK(privacy_state IN ('allowed','redacted_title','denied')),
  linked_focus_session_id TEXT REFERENCES focus_sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_segments(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_activity_app ON activity_segments(app_name);
CREATE INDEX IF NOT EXISTS idx_activity_focus ON activity_segments(linked_focus_session_id);

CREATE TABLE IF NOT EXISTS monitoring_rules (
  id TEXT PRIMARY KEY,
  rule_type TEXT NOT NULL,
  pattern TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('allow','redact_title','deny')),
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monitoring_rules_type ON monitoring_rules(rule_type);
