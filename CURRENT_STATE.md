# FlowForge Current State & Known Issues

**Date:** 2026-05-06  
**Status:** Phase 1 Foundation Complete, Phase 2 Partial, Phase 3 Backend Complete

---

## Working Features

### Core Task Management (Phase 1 - COMPLETE)
- ✅ Task creation with title, description, priority, due date, estimated minutes
- ✅ Task statuses: not_started, in_progress, stuck, blocked, done, archived
- ✅ Micro-task breakdown (manual)
- ✅ Project organization
- ✅ Daily outcomes definition
- ✅ Focus session tracking (START - now includes timer UI)
- ✅ Data export/purge tools
- ✅ Theme switching (system/light/dark)

### Agenda & Workflow (Phase 1 - COMPLETE)
- ✅ Today Dashboard with daily outcomes and tasks
- ✅ Inbox triage (tasks without due dates)
- ✅ Planned tasks view (tasks with due dates)
- ✅ Task scheduling and rescheduling
- ✅ Task detail panel with all editing capabilities
- ✅ Task archival

### AI Features (Phase 3 - BACKEND COMPLETE, FRONTEND COMPLETE)
- ✅ Task Decomposition (AI breaks tasks into micro-tasks)
- ✅ Goal Clarification (converts vague goals to SMART format)
- ✅ Coaching Chat (Socratic questioning interface)
- ✅ Stuck Intervention (contextual suggestions when stuck)
- ✅ Morning Briefing (AI-powered daily intent setter)
- ✅ Multi-provider support (OpenAI, Anthropic, DeepSeek, Z.AI, MiniMax, Mistral)

### UI/UX Improvements
- ✅ Dark mode with proper navigation visibility
- ✅ Form labels for clarity
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Command palette (Ctrl+K)
- ✅ Global keyboard shortcuts
- ✅ Onboarding wizard
- ✅ Empty states

---

## Recently Fixed Issues

1. **Dark mode tab visibility** - Active navigation now uses moss color (#2e5e4e) instead of dark ink
2. **Form labels** - TaskDetailPanel and TaskComposer now have proper field labels
3. **TypeScript compilation** - Fixed all camelCase/snake_case mismatches in AI components
4. **Database migration** - Made Phase 3 migration idempotent with IF NOT EXISTS
5. **Focus session timer** - start_focus_session now sets task.scheduledEndAt for timer UI

---

## Known Issues & Missing Features

### Critical (Blocks Anti-Procrastination Functionality)

1. **Active Window Tracking (PLACEHOLDER)**
   - Status: WindowTracker returns "unknown" for all fields
   - Impact: Context snapshot has no real data, activity logging doesn't work
   - Fix: Implement platform-specific APIs (GetForegroundWindow on Windows)
   - Location: `src-tauri/src/services/window_tracker.rs`

2. **Google Calendar Sync (PLACEHOLDER)**
   - Status: sync_google_calendar returns empty vec
   - Impact: No calendar events in morning briefing or time blocking
   - Fix: Implement OAuth token refresh and Google Calendar API calls
   - Location: `src-tauri/src/services/calendar_sync.rs`

3. **Context Snapshot Generation (BROKEN)**
   - Status: Returns placeholder data due to window tracking not working
   - Impact: All Phase 2 context-aware features are non-functional
   - Fix: Depends on fixing active window tracking

### Medium (Degrades User Experience)

4. **Focus Session Auto-End**
   - Status: When task marked done, active focus session stays open
   - Impact: Session remains "active" in database even after task completion
   - Fix: Add auto-end logic to setTaskStatus when status -> "done"

5. **Database Migration Idempotency**
   - Status: Fixed with IF NOT EXISTS, but existing users with partial migrations need manual DB deletion
   - Workaround: Delete flowforge.sqlite3 and restart app

6. **AI Request Logging (NOT INTEGRATED)**
   - Status: Database methods exist but aren't called by AI commands
   - Impact: No AI usage tracking, cost monitoring, or transparency
   - Fix: Add logging to decompose_task, clarify_goal, get_stuck_intervention, send_chat_message

### Low (Nice to Have)

7. **Global Hotkey for "Unstick Me"**
   - Status: Not implemented
   - Impact: Users must navigate to app to get unstuck
   - Fix: Use tauri-plugin-global-shortcut for system-wide hotkey

8. **Visual Roadmapper**
   - Status: Deferred per plan
   - Impact: Complex projects can't be visualized as flowcharts
   - Fix: Requires React Flow integration (planned for later phase)

---

## Data Flow Verification

### Task Creation Flow
```
User enters task in TaskComposer
  → createTask(input, date)
  → api.createTask(input)
  → Database INSERT
  → loadTasks() refreshes store
  → TaskCard appears in UI
```
**Status:** ✅ Working

### Focus Session Flow
```
User clicks "Start" on task
  → api.startFocusSession(taskId, minutes)
  → Database INSERT focus_sessions + UPDATE tasks (status, scheduled_end_at)
  → loadDashboard() refreshes store
  → TaskCard shows timer with "Active focus session"
```
**Status:** ✅ Working (fixed in this session)

### "Unstick Me" Flow
```
User clicks "Stuck" on task + selects reason
  → api.recordStuckEvent(taskId, reason)
  → stuck_suggestion() generates intervention (AI or fallback)
  → Store updates latestSuggestion
  → Dashboard shows suggestion card
```
**Status:** ✅ Working

---

## Phase Completion Status

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| Phase 1 | Foundation + Agenda MVP | ✅ COMPLETE | All core features working |
| Phase 2 | Context + Calendar | ⚠️ PARTIAL | Database schema ready, UI complete, backend services are placeholders |
| Phase 3 | AI Decomposition | ✅ COMPLETE | All AI features implemented and integrated |
| Phase 4 | Privacy + Screenshots | ❌ NOT STARTED | Local AI inference, screenshot capture, blur pipeline not implemented |

---

## Recommendations for Next Steps

### Priority 1: Fix Phase 2 Placeholders
1. Implement Windows active window tracking (GetForegroundWindow API)
2. Implement Google Calendar sync with OAuth
3. Test Context snapshot generation with real data

### Priority 2: Polish & Bug Fixes
1. Add auto-end focus session when task marked done
2. Integrate AI request logging for transparency
3. Add proper migration tracking system

### Priority 3: User Experience
1. Add global hotkey for quick "Unstick Me"
2. Implement visual roadmapper for complex projects
3. Add focus session completion animation/reward

---

## Development Notes

- **Current working directory:** `/home/amiagarw/code/flowforge`
- **Frontend build:** `npm run build` ✅
- **Backend build:** `cargo build --manifest-path src-tauri/Cargo.toml` ✅
- **Dev server:** `npm run tauri:dev`
- **Production build:** `npm run tauri:build`

### Key File Locations
- Frontend components: `src/components/`, `src/pages/`
- State management: `src/stores/useFlowForgeStore.ts`
- Type definitions: `src/types/domain.ts`
- Backend commands: `src-tauri/src/commands/mod.rs`
- Database layer: `src-tauri/src/db/mod.rs`
- AI services: `src-tauri/src/services/mod.rs`, `prompts.rs`, `llm_gateway.rs`

### Environment Variables Required
```
OPENAI_API_KEY=sk-...          # For OpenAI provider
ANTHROPIC_API_KEY=sk-...       # For Anthropic provider
FLOWFORGE_DEFAULT_AI_PROVIDER=openai
FLOWFORGE_DEFAULT_MODEL=gpt-4.1-mini
```

---

## Testing Checklist

Before considering the app "production ready" for anti-procrastination use:

- [ ] Create a task and see it appear in Dashboard
- [ ] Start a focus session and verify timer appears
- [ ] Mark task as done and verify session ends (TODO)
- [ ] Click "Stuck" and receive intervention suggestion
- [ ] Use AI task decomposition to break down a complex task
- [ ] Create a daily outcome and see morning briefing
- [ ] Test theme switching (light/dark)
- [ ] Export data and verify JSON format
- [ ] Test onboarding flow for new users
- [ ] Verify active window tracking shows real apps (TODO)
- [ ] Connect Google Calendar and see events (TODO)

---

**Last Updated:** 2026-05-06  
**Updated By:** Claude Code Session
