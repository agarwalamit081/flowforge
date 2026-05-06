# Pending Tasks

Track work that could not be completed because of an external blocker, environment issue, or context limit.

| Date | Task | Blocker | Next Step |
|---|---|---|---|---|
| 2026-05-06 | Run native Windows smoke test for tray, window, and installer behavior. | Current environment is Linux; Phase 1 release target is Windows. | Verify `npm run tauri dev` and packaged app on Windows. Use `TESTING.md` checklist. Document findings in `README.md`. |
| 2026-05-06 | Complete Windows-specific active window tracking. | Phase 2 requires platform-specific Win32 APIs. | Implement Windows-only window tracking using GetForegroundWindow/GetWindowText APIs. See `TESTING.md` for testing procedures. |

## Completed Items

| Date | Task | Resolution |
|---|---|---|
| 2026-05-06 | Calendar sync background scheduler | COMPLETED - Added to `src-tauri/src/lib.rs`, syncs every 5 minutes |
| 2026-05-06 | Context manager real-time evaluation | COMPLETED - Enhanced `derive_context_snapshot` with time-aware context |
| 2026-05-06 | Focus slot suggestion algorithm | COMPLETED - Enhanced with energy level awareness and better reasoning |
| 2026-05-06 | Privacy rule evaluation engine | COMPLETED - Implemented in `window_tracker.rs` with pattern matching |
| 2026-05-06 | Activity segment persistence | COMPLETED - Added `record_activity_segment` to database |
| 2026-05-06 | Focus session timer UI | COMPLETED - Added countdown timer to TaskCard |
| 2026-05-06 | Activity monitoring visualization | COMPLETED - Enhanced with privacy indicators |
| 2026-05-06 | Enhanced empty states | COMPLETED - Created EmptyState component and applied to pages |
| 2026-05-06 | Toast notifications | COMPLETED - Created ToastContext and integrated across app |
| 2026-05-06 | Global keyboard shortcuts | COMPLETED - Implemented Ctrl+N, Ctrl+D, Ctrl+A, Escape |
| 2026-05-06 | Onboarding flow | COMPLETED - Created OnboardingWizard with 5-step tour |
| 2026-05-06 | Testing documentation | COMPLETED - Created `TESTING.md` with comprehensive checklist |
| 2026-05-06 | Phase 1 runtime bugs and UI feedback | COMPLETED - Added error display and loading indicators to BriefingPage, ContextPage, AgendaPage; buttons now show loading states and errors |
| 2026-05-06 | Command Palette (Ctrl+K) | COMPLETED - Created searchable command palette with navigation, actions, and task commands; keyboard navigation support |

## Review Schedule

Review this file weekly to ensure pending tasks are unblocked or updated with new information.

## Last Review

**Date:** 2026-05-06
**Action:** Updated with completed items and testing documentation
