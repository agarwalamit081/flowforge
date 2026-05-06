# FlowForge Phase 3 — AI Task Decomposition & Intervention Engine

> **Estimated Duration:** 4–5 weeks  
> **Milestone:** FlowForge transforms from a context-aware agenda app into an intelligent anti-procrastination coach powered by AI.

---

## 1. Goal & Philosophy

Turn FlowForge from a context-aware agenda app into a **useful anti-procrastination coach**. Add structured AI workflows for task decomposition, goal clarification, coaching prompts, and visual roadmaps. The app now diagnoses *why* you are stuck and applies targeted behavioral interventions.

### Key Strategic Decision: API-First, Local-Ready

The original vision emphasizes local-first AI, but local LLM integration adds significant build complexity (model download, packaging, memory management). Use a **two-tier strategy** for rapid delivery:

| Tier | When | How |
|------|------|-----|
| **Phase 3 default** | Now | External LLM APIs (user opt-in, explicit consent) |
| **Phase 4 upgrade** | Later | Local inference adapter behind the same `LlmProvider` trait |

This means Phase 3 delivers a working, intelligent app quickly while Phase 4 adds the privacy-hardened local model path. The backend abstraction ensures zero code changes to the intervention logic when switching providers.

### Privacy Guarantees for API Mode

- **Never** send screenshots to any API.
- **Never** send raw activity logs or window titles (unless user explicitly enables richer context).
- Send **only**: task title, task description, stuck reason, daily outcome, and minimal calendar context.
- Redact app/window names unless the user enables richer context in settings.
- Log every API request (provider, model, tokens, cost) for full transparency.

---

## 2. Primary User Outcomes

| # | Outcome | Description |
|---|---------|-------------|
| 1 | SMART goals | Convert vague intentions ("work on report") into specific, measurable outcomes. |
| 2 | Task decomposition | Break large tasks into 5–15 minute micro-tasks with a "Start Here" action. |
| 3 | Visual roadmap | See a project as an interactive flowchart with collapsible nodes. |
| 4 | Contextual interventions | Get targeted help based on why you are stuck, not just that you are stuck. |
| 5 | Coaching chat | Use a Socratic AI chat panel grounded in your current task and history. |
| 6 | AI transparency | View what was sent to the API, what it cost, and delete AI-generated content. |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 React UI (Additions)                     │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │   Task      │ │   Goal       │ │   Visual         │  │
│  │   Deconstr. │ │   Clarifier  │ │   Roadmapper     │  │
│  └─────────────┘ └──────────────┘ └───────────────────┘  │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │Intervention │ │   Coaching   │ │  AI Debug /      │  │
│  │   Cards     │ │   Chat       │ │  Privacy Panel   │  │
│  └─────────────┘ └──────────────┘ └───────────────────┘  │
│                          │                                │
│                          │ Tauri IPC                      │
├──────────────────────────┼───────────────────────────────┤
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │               Rust Backend (Additions)             │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │           LLM Gateway                        │  │  │
│  │  │  ┌─────────────┐  ┌────────────────────────┐ │  │  │
│  │  │  │  Provider   │  │  Prompt Registry       │ │  │  │
│  │  │  │  Abstraction│  │  (templates per module)│ │  │  │
│  │  │  └──────┬──────┘  └────────────────────────┘ │  │  │
│  │  │         │                                       │  │  │
│  │  │  ┌──────▼──────────────────────────────────┐ │  │  │
│  │  │  │  Structured Output Validator             │ │  │  │
│  │  │  │  (JSON Schema in Rust, Zod on frontend)  │ │  │  │
│  │  │  └──────────────────────────────────────────┘ │  │  │
│  │  │  ┌──────────────────────────────────────────┐ │  │  │
│  │  │  │  Cost Logger + Prompt/Result Cache       │ │  │  │
│  │  │  └──────────────────────────────────────────┘ │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │     Intervention Engine (v2)                 │  │  │
│  │  │     Rules first → AI second                  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │     Context Manager (v2) — enriched with AI  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌───────────┐   │  │
│  │  │  Agenda Svc │ │  Calendar Svc│ │ Activity  │   │  │
│  │  │  (Phase 1)  │ │  (Phase 2)   │ │  Svc (P2) │   │  │
│  │  └─────────────┘ └──────────────┘ └───────────┘   │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                                │
├──────────────────────────┼───────────────────────────────┤
│  SQLite + Provider APIs + OS Keychain                    │
└──────────────────────────────────────────────────────────┘
         ▲               ▲               ▲
    ┌────┴────┐   ┌──────┴──────┐  ┌────┴──────┐
    │ Phase 2 │   │  LLM API    │  │  Phase 4  │
    │ Services│   │  Providers  │  │  Local AI │
    │         │   │  (opt-in)   │  │  (future) │
    └─────────┘   └─────────────┘  └───────────┘
```

---

## 4. Technical Stack

### 4.1 Carried Forward from Phases 1 & 2

| Technology | Purpose |
|-----------|---------|
| Tauri v2 | Desktop runtime, system tray, IPC, events |
| React 18 + TypeScript + Vite | Frontend framework |
| Tailwind CSS | Styling |
| Zustand | UI state management |
| Rust + Tokio + Serde + Chrono | Backend async runtime |
| SQLite via rusqlite | Local persistent storage |
| `reqwest` | HTTP client (already used for calendar) |
| `keyring` | Secure credential storage |

### 4.2 New Additions in Phase 3

| Technology | Crate/Library | Purpose |
|-----------|---------------|---------|
| LLM provider trait | Custom Rust trait | Abstract over different AI providers |
| Structured output validation | `schemars` + JSON Schema | Validate AI responses before storing |
| Frontend validation | Zod | Mirror Rust validation on the frontend |
| Visual roadmapping | React Flow | Interactive flowchart for project decomposition |
| API key security | `secrecy` crate | Zero-copy secret handling in memory |
| Prompt/result cache | SQLite table | Cache deterministic prompt outputs to reduce cost |
| Prompt templates | Tera or Handlebars (Rust) | Parameterized prompt construction |

---

## 5. LLM Gateway

### 5.1 Provider Abstraction

The LLM Gateway is the single point through which all AI features communicate with language models. It abstracts provider differences behind a common trait.

```rust
#[async_trait]
pub trait LlmProvider: Send + Sync {
    /// Complete a prompt and return structured output
    async fn complete_structured<T: DeserializeOwned>(
        &self,
        request: LlmRequest,
    ) -> Result<T, LlmError>;

    /// Stream a response (for chat)
    async fn stream_completion(
        &self,
        request: LlmRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<String, LlmError>> + Send>>, LlmError>;

    /// Provider display name
    fn provider_name(&self) -> &str;
}

pub struct LlmRequest {
    pub prompt_template_id: String,
    pub variables: HashMap<String, String>,
    pub system_prompt: String,
    pub max_tokens: u32,
    pub temperature: f32,
}

pub struct LlmError {
    pub kind: LlmErrorKind,
    pub message: String,
    pub retryable: bool,
}
```

### 5.2 Supported Providers

| Provider | Model | `base_url` | Notes |
|----------|-------|-----------|-------|
| OpenAI | `gpt-4.1-mini` | `https://api.openai.com/v1` | Cost-effective, fast |
| Anthropic | `claude-haiku-4.5` | `https://api.anthropic.com` | Strong reasoning, low cost |
| Anthropic | `claude-sonnet-4.6` | `https://api.anthropic.com` | Best quality, higher cost |
| DeepSeek | `deepseek-chat` | `https://api.deepseek.com` | Cost-effective alternative |
| Z.AI | `GLM-4.7-Flash` | `https://api.z.ai/api/paas/v4` | Fast, affordable |
| MiniMax | `MiniMax-M2.5-highspeed` | `https://api.minimax.io/v1` | High speed, Anthropic-compatible API |
| Mistral | `mistral-large-latest` | `https://api.mistral.ai/v1` | European provider, good multilingual |

### 5.3 LLM Gateway Responsibilities

| Responsibility | Implementation |
|---------------|----------------|
| **Provider selection** | User chooses provider + model in Settings. Stored in `settings` table. |
| **API key lookup** | Retrieved from OS keychain via `keyring` crate. Never stored in plaintext. |
| **Prompt template loading** | From the Prompt Registry (parameterized templates stored in code or SQLite). |
| **Structured output validation** | Parse JSON response against JSON Schema. Reject malformed output. |
| **Retry and timeout** | Exponential backoff (3 retries, 30-second timeout). Circuit breaker after 5 consecutive failures. |
| **Cost logging** | Log token counts and estimated cost per request. Never log prompt content by default. |
| **Prompt/result cache** | Deterministic flows (same task + same template = same output) are cached in SQLite. |

### 5.4 SQLite Schema Additions

```sql
-- =============================================
-- AI Request Log (transparency)
-- =============================================
CREATE TABLE ai_requests (
  id                    TEXT PRIMARY KEY,    -- UUID v4
  provider              TEXT NOT NULL,       -- 'openai', 'anthropic', etc.
  model                 TEXT NOT NULL,       -- 'gpt-4.1-mini', etc.
  task_id               TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  request_type          TEXT NOT NULL,       -- 'decompose', 'clarify_goal', 'unstick', 'chat', 'roadmap'
  prompt_hash           TEXT NOT NULL,       -- SHA-256 of the rendered prompt (for dedup)
  prompt_template_id    TEXT NOT NULL,
  status                TEXT NOT NULL        -- 'pending', 'success', 'failed', 'cancelled'
                        CHECK(status IN ('pending', 'success', 'failed', 'cancelled')),
  input_tokens          INTEGER,
  output_tokens         INTEGER,
  cost_estimate_cents   INTEGER,            -- Estimated cost in US cents
  error_message         TEXT,               -- If failed
  latency_ms            INTEGER,            -- Round-trip time
  created_at            TEXT NOT NULL
);

CREATE INDEX idx_ai_requests_task ON ai_requests(task_id);
CREATE INDEX idx_ai_requests_time ON ai_requests(created_at);

-- =============================================
-- AI Outputs (validated results)
-- =============================================
CREATE TABLE ai_outputs (
  id                TEXT PRIMARY KEY,
  ai_request_id     TEXT NOT NULL REFERENCES ai_requests(id) ON DELETE CASCADE,
  output_type       TEXT NOT NULL,          -- 'task_decomposition', 'smart_goal', 'intervention', 'roadmap'
  output_json       TEXT NOT NULL,          -- The validated JSON output
  accepted_by_user  INTEGER DEFAULT 0,      -- 1 = user accepted, 0 = pending/rejected
  accepted_at       TEXT,
  created_at        TEXT NOT NULL
);

CREATE INDEX idx_ai_outputs_request ON ai_outputs(ai_request_id);
CREATE INDEX idx_ai_outputs_accepted ON ai_outputs(accepted_by_user);

-- =============================================
-- Intervention Events (audit trail)
-- =============================================
CREATE TABLE intervention_events (
  id                  TEXT PRIMARY KEY,
  trigger_type        TEXT NOT NULL,        -- 'drift', 'stuck', 'idle', 'overdue', 'manual'
  task_id             TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  focus_session_id    TEXT REFERENCES focus_sessions(id) ON DELETE SET NULL,
  context_snapshot_json TEXT,               -- Full context at trigger time
  intervention_type   TEXT NOT NULL,        -- 'five_minute_rule', 'unstick', 'goal_clarify', 'decompose', 'breathe'
  intervention_source TEXT NOT NULL,        -- 'rule' | 'ai'
  user_response       TEXT,                 -- 'accepted', 'dismissed', 'snoozed'
  created_at          TEXT NOT NULL
);

CREATE INDEX idx_interventions_task ON intervention_events(task_id);
CREATE INDEX idx_interventions_time ON intervention_events(created_at);

-- =============================================
-- Chat Messages (coaching history)
-- =============================================
CREATE TABLE chat_messages (
  id          TEXT PRIMARY KEY,         -- UUID v4
  task_id     TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,             -- 'user' | 'assistant' | 'system'
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_chat_task ON chat_messages(task_id);

-- =============================================
-- Task Templates (recurring workflows)
-- =============================================
CREATE TABLE task_templates (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,           -- "Weekly Report", "Email Triage"
  description      TEXT,
  category         TEXT,                    -- 'admin', 'coding', 'research', 'communication'
  template_json    TEXT NOT NULL,           -- Default task + micro-tasks as JSON
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
```

---

## 6. Structured AI Outputs

Every AI feature returns **validated JSON** that maps directly to UI components. This prevents garbage-in-garbage-out and ensures the frontend can render results without fragile string parsing.

### 6.1 Task Decomposition Output

```json
{
  "task_title": "string",
  "good_enough_definition": "string",
  "start_here": {
    "title": "string",
    "description": "string",
    "estimated_minutes": 5
  },
  "micro_tasks": [
    {
      "title": "string",
      "description": "string",
      "estimated_minutes": 10,
      "success_criteria": "string",
      "friction_level": "low | medium | high"
    }
  ],
  "risks": [
    {
      "risk": "string",
      "countermeasure": "string"
    }
  ]
}
```

### 6.2 Goal Clarifier Output

```json
{
  "original_intention": "string",
  "smart_goal": "string",
  "done_looks_like": "string",
  "minimum_viable_outcome": "string",
  "first_measurable_step": "string",
  "suggested_timebox_minutes": 25
}
```

### 6.3 Stuck Intervention Output

```json
{
  "stuck_reason": "unclear | too_big | boring | anxious | perfectionism | waiting | tired",
  "tone": "compassionate",
  "message": "string",
  "recommended_action": "string",
  "duration_minutes": 5,
  "follow_up_question": "string"
}
```

### 6.4 Coaching Chat Output

```json
{
  "response": "string",
  "suggested_actions": [
    {
      "label": "string",
      "action_type": "decompose | clarify | focus | break"
    }
  ],
  "mood_assessment": "curious | frustrated | anxious | bored | determined | overwhelmed"
}
```

---

## 7. AI-Powered Modules

### 7.1 Task Deconstructor + Micro-Task Breaker

**Trigger:** User clicks "Break Down" on a task, or Phase 1's rule-based system detects a vague/heavy task.

**Prompt Template:**

```
You are FlowForge's task decomposition engine. Your job is to break a vague or
overwhelming task into concrete, actionable micro-tasks.

TASK: {{task_title}}
DESCRIPTION: {{task_description}}
DUE DATE: {{due_date}}
USER'S STUCK REASON (if any): {{stuck_reason}}

RULES:
- Each micro-task must be completable in 5–15 minutes.
- The first micro-task must be the absolute easiest physical action.
- Specify a "good enough" definition — the minimum viable outcome.
- Identify the single best "start here" action.
- Keep language concrete and action-oriented (verbs first).
- Do not use shame or guilt language.

Return a valid JSON object matching the TaskDecomposition schema.
```

**User flow:**

```
User clicks "Break Down"
  │
  ▼
Show loading state with "Analyzing your task..."
  │
  ▼
LLM Gateway sends request to selected provider
  │
  ▼
Validate JSON response against schema
  │
  ├─ Valid → Show results as interactive cards
  │          ├─ "Start Here" highlighted with glow effect
  │          ├─ Micro-tasks listed in order
  │          ├─ User can edit, reorder, delete any suggestion
  │          └─ [Accept All] [Accept Selected] [Reject All]
  │
  └─ Invalid → Show fallback: "Couldn't break this down automatically.
               Try adding more detail to the task description."
               (Phase 1 rule-based fallback: suggest 3 steps manually)
```

### 7.2 Goal Clarifier + Daily Intent Setter

**Trigger:** Morning Briefing or user clicks "Clarify Goal" on a task.

**Prompt Template:**

```
You are FlowForge's goal clarification engine. Convert vague intentions into
specific, measurable goals.

INTENTION: {{task_title}}
CONTEXT: {{task_description}}
TIME AVAILABLE: {{available_minutes}} minutes today

Apply the SMART framework:
- Specific: What exactly needs to be done?
- Measurable: How will you know it's done?
- Achievable: Is this realistic in the time available?
- Relevant: Why does this matter today?
- Time-bound: When exactly should this be finished?

Define "done looks like" in one sentence.
Define the "minimum viable outcome" — the version that is good enough.
Return a valid JSON object matching the GoalClarification schema.
```

**Integration with Morning Briefing:**

After the user types their daily outcomes, the Goal Clarifier can optionally refine each one:

```
User types: "Ship the landing page"
  │
  ▼
[Clarify with AI] button (optional)
  │
  ▼
AI returns SMART version:
  "Deploy the landing page with responsive hero, CTA button, and
   3 feature sections to staging. Done = staging URL loads correctly
   on mobile and desktop. Minimum viable = hero + CTA only."
```

### 7.3 Anti-Procrastination Chatbot (Socratic)

**Trigger:** User opens the coaching chat panel, or the Intervention Engine routes to chat for nuanced stuck situations.

**Behavior:**

The chatbot uses a **Socratic questioning** approach. It does not give advice immediately — it asks gentle questions that help the user arrive at their own insight.

**System Prompt:**

```
You are FlowForge's anti-procrastination coach. You use Socratic questioning
to help users understand why they are avoiding a task and find their own
path forward.

CURRENT TASK: {{task_title}}
TASK DESCRIPTION: {{task_description}}
STUCK REASON (if known): {{stuck_reason}}
TIME OF DAY: {{time_of_day}}
DAILY OUTCOME: {{daily_outcome}}

BEHAVIORAL RULES:
- Ask one question at a time.
- Start with understanding, not advice.
- Prefer "What would need to be true..." questions.
- If the user expresses anxiety, normalize it before offering strategies.
- If the user says they don't know, offer 2–3 specific options.
- Never diagnose mental health conditions.
- Never shame or guilt-trip.
- Keep responses under 100 words unless the user writes a long message.
- When appropriate, suggest a specific 5-minute action.
```

**Chat persistence:**

Chat messages are stored locally in SQLite (see `chat_messages` table in §5.4).

### 7.4 Visual Roadmapper

**Trigger:** User clicks "Roadmap" on a project.

**Scope:** Display project tasks and micro-tasks as an interactive flowchart using React Flow.

**Node Types:**

| Node | Description | Visual |
|------|-------------|--------|
| Project Root | The project itself | Blue rounded rectangle |
| Milestone | A named group of tasks | Green hexagon |
| Task | A unit of work | Yellow rectangle |
| Micro-Task | A 5–15 minute step | Small white rounded pill |
| Blocker | A dependency or blocker | Red diamond |

**AI Integration:**

When the user first generates a roadmap for a project, the LLM can suggest dependencies and groupings:

```json
{
  "nodes": [
    { "id": "task-1", "type": "task", "label": "Design mockups" },
    { "id": "task-2", "type": "task", "label": "Implement hero" },
    { "id": "task-3", "type": "micro", "label": "Set up CSS grid" }
  ],
  "edges": [
    { "from": "task-1", "to": "task-2", "reason": "Implementation requires design" },
    { "from": "task-2", "to": "task-3", "reason": "Grid setup before hero layout" }
  ]
}
```

**Layout approach:**

Start with a simple hierarchical layout (top-to-bottom). Use Dagre for automatic node positioning. Allow users to collapse completed nodes. Do **not** build drag-and-drop persistence until users validate the experience.

---

## 8. Intervention Engine (v2)

### 8.1 Selection Model: Rules First, AI Second

```
Context Snapshot + Task State + Stuck Reason
        │
        ▼
Rule Matcher (Phase 2 rules + new Phase 3 rules)
        │
        ├─ High-confidence rule match? ──▶ Deterministic intervention
        │                                    (instant, no API call, no cost)
        │
        └─ Unclear / nuanced situation? ──▶ LLM-generated intervention
                                          (takes 1–3 seconds, costs tokens)
```

### 8.2 Full Intervention Priority Order

| Priority | Condition | Source | Intervention |
|----------|-----------|--------|--------------|
| 1 | Privacy rule active | Rule | Suppress all |
| 2 | In meeting | Rule | Suppress task nudges |
| 3 | Making progress | Rule | No nudge |
| 4 | Task estimate <= 5 min | Rule | Five-Minute Rule nudge |
| 5 | Focus drift (off-task > grace period) | Rule | Gentle redirect |
| 6 | Task title is vague | Rule | Goal Clarifier prompt |
| 7 | Task too large (no micro-tasks, estimate > 30 min) | Rule | Suggest breakdown |
| 8 | Stuck with known reason | **AI** | Tailored intervention by stuck reason |
| 9 | Stuck with unknown reason | **AI** | Socratic chat prompt |
| 10 | Idle during focus block | Rule | Idle check-in |
| 11 | Manual "Unstick Me" | **AI** | Lowest-friction next action |
| 12 | Emotional avoidance detected | **AI** | Compassionate Prompter |

### 8.3 Stuck-Reason Routing (AI)

| Stuck Reason | AI Strategy | Example Response |
|-------------|-------------|-----------------|
| `unclear` | Goal Clarifier | "Let's figure out what 'done' looks like. What's the smallest outcome that would be useful?" |
| `too_big` | Task Deconstructor | "This feels heavy. Let me break it into small pieces you can tackle one by one." |
| `boring` | Pair-Task Matcher | "I hear you. What if you paired this with your favorite playlist? Sometimes background rhythm helps." |
| `anxious` | Compassionate Prompter | "Anxiety often means the task matters to you. That's actually a good sign. What's the scariest part?" |
| `perfectionism` | "Good Enough" Coach | "What if we aimed for 'useful' instead of 'perfect'? What does the minimum viable version look like?" |
| `waiting` | Unblocker | "What are you waiting on? Can you proceed with anything else in the meantime?" |
| `tired` | Energy-aware suggestion | "Low energy is real. Is there a 5-minute version of this you could do right now, then pick up the rest tomorrow?" |

### 8.4 Prompting Guidelines

**System behavior rules:**

- Compassionate but direct. No toxic positivity.
- No shame, guilt, or "should" language.
- Prefer physical first actions ("Open the document" not "Think about the document").
- Prefer actions under 15 minutes.
- Ask "what's good enough?" before "what's perfect?"
- Never make medical or mental health diagnoses.
- Keep responses concise (under 100 words for nudges).

**Prompt input minimization:**

Send the smallest useful context to the API:

| Field | Always Sent | Only with Rich Context enabled |
|-------|-------------|-------------------------------|
| Task title | ✅ | ✅ |
| Task description | ✅ | ✅ |
| Stuck reason | ✅ | ✅ |
| Daily outcome | ✅ | ✅ |
| Calendar state (before_meeting, open_time, etc.) | ✅ | ✅ |
| Active app name | ❌ | ✅ |
| Window title | ❌ | ✅ |
| Activity log history | ❌ | ✅ (last 30 min) |

---

## 9. Agenda Tracker Upgrades

### 9.1 AI-Assisted Fields

The Phase 1 agenda schema is extended to track AI-generated content:

| Table | New Column | Purpose |
|-------|-----------|---------|
| `micro_tasks` | `ai_generated` (BOOLEAN) | Distinguish AI-suggested from user-created micro-tasks |
| `micro_tasks` | `source_ai_request_id` (FK) | Link back to the AI request that generated this |
| `micro_tasks` | `accepted_at` (TEXT) | When the user accepted this suggestion |
| `tasks` | `last_decomposed_at` (TEXT) | When the task was last broken down by AI |
| `tasks` | `clarified_at` (TEXT) | When the goal was last clarified by AI |

### 9.2 Task Templates

Pre-built templates for recurring work patterns. Stored locally, fully editable.

| Template | Default Micro-Tasks |
|----------|-------------------|
| Email Triage | 1. Open inbox → 2. Delete spam → 3. Reply to urgent → 4. Flag follow-ups |
| Weekly Report | 1. Gather metrics → 2. Write summary → 3. Add action items → 4. Proofread |
| Coding Task | 1. Read existing code → 2. Write tests → 3. Implement → 4. Run tests → 5. PR |
| Research Task | 1. Define question → 2. Search sources → 3. Take notes → 4. Synthesize findings |
| Meeting Prep | 1. Review agenda → 2. Gather data → 3. Draft talking points → 4. Print/export |
| Admin Chore | 1. Open relevant tool → 2. Complete forms → 3. Verify submission |

---

## 10. New IPC Commands

| Command | Signature | Description |
|---------|-----------|-------------|
| `decompose_task` | `(task_id: String) -> TaskDecompositionResult` | AI-powered task breakdown |
| `clarify_goal` | `(task_id: String) -> GoalClarificationResult` | Convert vague goal to SMART |
| `get_stuck_intervention` | `(task_id: String, reason: String) -> InterventionResult` | AI-powered unstick |
| `send_chat_message` | `(task_id: String, message: String) -> ChatResponse` | Coaching chat turn |
| `generate_roadmap` | `(project_id: String) -> RoadmapResult` | AI-generated project flowchart |
| `get_ai_usage_stats` | `(start: String, end: String) -> AiUsageStats` | Token usage and cost report |
| `delete_ai_data` | `() -> ()` | Purge all AI request logs and outputs |
| `set_ai_provider` | `(provider: String, model: String, api_key: String) -> ()` | Configure AI provider |
| `test_ai_connection` | `() -> ConnectionTestResult` | Verify API key works |
| `apply_task_template` | `(template_id: String, task_id: String) -> Vec<MicroTask>` | Apply template to a task |

---

## 11. AI Settings UI

```
┌─────────────────────────────────────────────────────┐
│  🤖 AI & Intelligence                               │
│                                                      │
│  AI Provider:  [Anthropic ▾]                         │
│  Model:        [claude-haiku-4.5 ▾]                  │
│  API Key:      [••••••••••••]  [Update] [Test]       │
│                                                      │
│  ☑ Enable AI-powered features                        │
│  ☐ Send app/window names for richer context          │
│  ☐ Include activity history in prompts               │
│                                                      │
│  Usage This Month:                                   │
│  Requests: 147    Tokens: 23,400                     │
│  Est. Cost: $0.12                                     │
│                                                      │
│  [View Detailed Log] [Delete All AI Data]             │
│                                                      │
│  ⚠ Privacy: Task titles and descriptions are sent    │
│  to the selected AI provider. Screenshots and        │
│  activity logs are never sent.                       │
└──────────────────────────────────────────────────────┘
```

---

## 12. Windows Testing Notes

### 12.1 Manual Test Cases

| Test | Steps | Expected |
|------|-------|----------|
| Decompose vague task | Click "Break Down" on "Handle the client thing" | Micro-tasks appear within 5 seconds |
| Accept AI suggestions | Click "Accept All" | Micro-tasks saved to database with `ai_generated=true` |
| Reject AI suggestions | Click "Reject All" | No changes to task |
| Goal clarification | Click "Clarify Goal" on daily outcome | SMART version displayed |
| Unstick Me (AI) | Click "Unstick Me" → select "anxious" | Compassionate response with actionable suggestion |
| Chat session | Open chat, type "I don't know where to start" | Socratic question back |
| Roadmap generation | Click "Roadmap" on a project | Flowchart rendered with nodes and edges |
| Provider switch | Change provider from OpenAI to Anthropic | Next request uses new provider |
| Disable AI | Turn off "Enable AI-powered features" | All AI buttons greyed out, rule-based fallbacks active |

### 12.2 Failure Mode Tests

| Failure | Expected Behavior |
|---------|------------------|
| Invalid API key | Error toast: "API key rejected. Check your settings." |
| No network | Queue request, retry when online. Show "Offline" badge. |
| Provider timeout (>30s) | Retry once, then show: "AI is taking too long. Try again or use manual mode." |
| Malformed JSON response | Log error, show fallback: "Couldn't process AI response." |
| User cancels mid-generation | Abort request, no partial data stored |
| App restart during generation | Request marked as `cancelled` in `ai_requests` log |
| Provider rate limit | Back off exponentially, show: "Rate limited. Retrying in 30 seconds." |

### 12.3 Regression: AI Disabled

Verify that **all Phase 1 and Phase 2 features work with AI completely disabled:**

- Task CRUD ✅
- Morning Briefing (without goal clarification) ✅
- Rule-based Unstick Me ✅
- Calendar sync ✅
- Activity tracking ✅
- Focus sessions ✅

---

## 13. Deliverables

| Deliverable | Description |
|-------------|-------------|
| LLM Gateway | Provider abstraction with at least 2 working providers |
| Task Deconstructor | AI-powered breakdown into 5–15 min micro-tasks |
| Goal Clarifier | SMART goal conversion with "done looks like" definition |
| AI-assisted Unstick Me | Contextual intervention based on stuck reason |
| Anti-Procrastination Chatbot | Socratic coaching grounded in current task |
| Visual Roadmapper MVP | Interactive flowchart for project decomposition |
| Intervention Engine v2 | Rules + AI hybrid intervention selection |
| Prompt Registry | Versioned, parameterized prompt templates |
| AI Privacy Settings | Provider config, context sharing controls, usage stats |
| AI Transparency Log | Request log with tokens, cost, and deletion capability |
| Task Templates | Pre-built templates for recurring workflows |

---

## 14. Exit Criteria

| Criteria | Validation |
|----------|------------|
| A user can turn a vague task into a clear plan in under 60 seconds | Time a test: "work on the report" → SMART goal + micro-tasks |
| AI outputs are validated before reaching the database | Structured output validator rejects malformed responses |
| No sensitive activity/screenshot data is sent to external APIs | Network monitor shows only task data in API payloads |
| App remains fully functional with AI disabled | Complete Phase 1 + Phase 2 feature test with AI off |
| Cost transparency: user can see total API usage and cost | AI settings page shows accurate token/cost totals |
| Provider switching works without data loss | Switch from OpenAI to Anthropic, verify existing data intact |
| All Phase 1 and Phase 2 features continue working | Full regression test pass |

---

## 15. What Comes Next (Phase 4 Preview)

Phase 4 completes the original vision:

- Privacy-safe screenshot capture with on-device blurring
- Browser extension for accurate URL tracking
- Procrastination Pattern Detector (learns your avoidance patterns)
- Local LLM integration (llama.cpp sidecar)
- Progress Timelapse (end-of-day video recap)
- Encrypted local storage option
- Production Windows installer with auto-update
