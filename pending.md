# Pending Tasks

Track work that could not be completed because of an external blocker, environment issue, or context limit.

| Date | Task | Blocker | Next Step |
|---|---|---|---|---|
| 2026-05-06 | Run native Windows smoke test for tray, window, and installer behavior. | Current environment is Linux; Phase 1 release target is Windows. | Verify `npm run tauri dev` and packaged app on Windows, then document findings in `README.md`. |
| 2026-05-06 | Active window tracking background service | Phase 2 requires platform-specific Win32 APIs (Windows) or equivalent for Linux/macOS | Implement Windows-only window tracking using `active-win-pos-rs` or Win32 APIs directly |
| 2026-05-06 | Calendar sync background scheduler | OAuth flow implemented, periodic sync scheduler not started | Add tokio interval task in `src-tauri/src/lib.rs` to sync every 5 minutes |
| 2026-05-06 | Context manager real-time evaluation | `derive_context_snapshot` exists but full intent comparison incomplete | Implement full evaluation: compare active focus block vs active window, detect procrastination patterns |
| 2026-05-06 | Focus slot suggestion algorithm | UI exists, backend `suggest_focus_slots` returns empty | Implement calendar-aware scheduling algorithm that considers existing events and energy levels |
| 2026-05-06 | Privacy rule evaluation engine | Database schema for monitoring rules exists, evaluation incomplete | Implement rule matching against active window/app name with allow/deny/redact actions |
| 2026-05-06 | Activity segment persistence | Database schema exists, no tracking service writing to it | Implement background service that records window/app changes to activity_segments table |

## Review Schedule

Review this file weekly to ensure pending tasks are unblocked or updated with new information.

## Last Review

**Date:** 2026-05-06
**Action:** Added Phase 2 background service blockers
