-- =============================================
-- FlowForge Phase 3: AI Task Decomposition & Intervention
-- =============================================
-- This migration adds database support for AI-powered features:
-- - Task decomposition with AI-generated micro-tasks
-- - Goal clarification (SMART goals)
-- - Contextual interventions based on stuck reasons
-- - Socratic coaching chat
-- - AI request logging and transparency
-- - Task templates for recurring workflows

-- =============================================
-- AI Request Log (transparency)
-- =============================================
-- Tracks all AI API calls for cost tracking, debugging, and privacy
CREATE TABLE ai_requests (
  id                    TEXT PRIMARY KEY,    -- UUID v4
  provider              TEXT NOT NULL,       -- 'openai', 'anthropic', 'deepseek', etc.
  model                 TEXT NOT NULL,       -- 'gpt-4.1-mini', 'claude-haiku-4.5', etc.
  task_id               TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  request_type          TEXT NOT NULL CHECK(request_type IN ('decompose', 'clarify_goal', 'unstick', 'chat', 'roadmap')),
  prompt_hash           TEXT NOT NULL,       -- SHA-256 for deduplication
  prompt_template_id    TEXT NOT NULL,       -- Template identifier
  status                TEXT NOT NULL CHECK(status IN ('pending', 'success', 'failed', 'cancelled')),
  input_tokens          INTEGER,
  output_tokens         INTEGER,
  cost_estimate_cents   INTEGER,            -- Estimated cost in US cents
  error_message         TEXT,
  latency_ms            INTEGER,            -- Round-trip time in milliseconds
  created_at            TEXT NOT NULL
);

CREATE INDEX idx_ai_requests_task ON ai_requests(task_id);
CREATE INDEX idx_ai_requests_time ON ai_requests(created_at DESC);
CREATE INDEX idx_ai_requests_status ON ai_requests(status);

-- =============================================
-- AI Outputs (validated results)
-- =============================================
-- Stores validated JSON responses from AI providers
CREATE TABLE ai_outputs (
  id                TEXT PRIMARY KEY,       -- UUID v4
  ai_request_id     TEXT NOT NULL REFERENCES ai_requests(id) ON DELETE CASCADE,
  output_type       TEXT NOT NULL CHECK(output_type IN ('task_decomposition', 'smart_goal', 'intervention', 'roadmap', 'chat_response')),
  output_json       TEXT NOT NULL,          -- Validated JSON output
  accepted_by_user  INTEGER DEFAULT 0,      -- 1 = user accepted, 0 = pending/rejected
  accepted_at       TEXT,                  -- When user accepted (ISO 8601)
  created_at        TEXT NOT NULL
);

CREATE INDEX idx_ai_outputs_request ON ai_outputs(ai_request_id);
CREATE INDEX idx_ai_outputs_accepted ON ai_outputs(accepted_by_user);
CREATE INDEX idx_ai_outputs_type ON ai_outputs(output_type);

-- =============================================
-- Intervention Events (audit trail)
-- =============================================
-- Tracks when and why interventions were triggered
CREATE TABLE intervention_events (
  id                    TEXT PRIMARY KEY,    -- UUID v4
  trigger_type          TEXT NOT NULL CHECK(trigger_type IN ('drift', 'stuck', 'idle', 'overdue', 'manual')),
  task_id               TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  focus_session_id      TEXT REFERENCES focus_sessions(id) ON DELETE SET NULL,
  context_snapshot_json TEXT,                 -- Full context at trigger time (JSON)
  intervention_type     TEXT NOT NULL,       -- 'five_minute_rule', 'unstick', 'goal_clarify', 'decompose', 'breathe', 'chat'
  intervention_source   TEXT NOT NULL CHECK(intervention_source IN ('rule', 'ai')),
  user_response         TEXT,                 -- 'accepted', 'dismissed', 'snoozed'
  created_at            TEXT NOT NULL
);

CREATE INDEX idx_interventions_task ON intervention_events(task_id);
CREATE INDEX idx_interventions_time ON intervention_events(created_at DESC);
CREATE INDEX idx_interventions_source ON intervention_events(intervention_source);

-- =============================================
-- Chat Messages (coaching history)
-- =============================================
-- Stores Socratic coaching chat conversations
CREATE TABLE chat_messages (
  id          TEXT PRIMARY KEY,         -- UUID v4
  task_id     TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_chat_task ON chat_messages(task_id);
CREATE INDEX idx_chat_time ON chat_messages(created_at DESC);

-- =============================================
-- Task Templates (recurring workflows)
-- =============================================
-- Pre-built templates for common task patterns
CREATE TABLE task_templates (
  id               TEXT PRIMARY KEY,      -- UUID v4
  name             TEXT NOT NULL,          -- "Weekly Report", "Email Triage"
  description      TEXT,
  category         TEXT,                  -- 'admin', 'coding', 'research', etc.
  template_json    TEXT NOT NULL,         -- Default task + micro-tasks as JSON
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE INDEX idx_templates_category ON task_templates(category);

-- =============================================
-- Enhance existing tables for Phase 3
-- =============================================

-- Add AI tracking to micro_tasks
ALTER TABLE micro_tasks ADD COLUMN ai_generated INTEGER DEFAULT 0;           -- BOOLEAN: 1 if AI-suggested
ALTER TABLE micro_tasks ADD COLUMN source_ai_request_id TEXT REFERENCES ai_requests(id) ON DELETE SET NULL;
ALTER TABLE micro_tasks ADD COLUMN accepted_at TEXT;                           -- When user accepted AI suggestion

-- Add AI enhancement tracking to tasks
ALTER TABLE tasks ADD COLUMN last_decomposed_at TEXT;                          -- Last time AI broke down this task
ALTER TABLE tasks ADD COLUMN clarified_at TEXT;                                -- Last time AI clarified goal

-- =============================================
-- Views for common queries
-- =============================================

-- AI usage statistics summary
CREATE VIEW ai_usage_summary AS
SELECT
  provider,
  model,
  COUNT(*) as request_count,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_estimate_cents) as total_cost_cents,
  AVG(latency_ms) as avg_latency_ms
FROM ai_requests
WHERE status = 'success'
GROUP BY provider, model;

-- Pending AI suggestions (not yet accepted by user)
CREATE VIEW pending_ai_suggestions AS
SELECT
  ao.id,
  ao.output_type,
  ao.output_json,
  ar.task_id,
  t.title as task_title,
  ar.created_at as suggested_at
FROM ai_outputs ao
JOIN ai_requests ar ON ao.ai_request_id = ar.id
LEFT JOIN tasks t ON ar.task_id = t.id
WHERE ao.accepted_by_user = 0
ORDER BY ao.created_at DESC;
