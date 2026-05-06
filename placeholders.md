# Placeholders & Incomplete Implementations

Track code that is stubbed, incomplete, or needs further implementation.

| File | Placeholder | Reason | Exit Condition | Priority |
|---|---|---|---|---|
| `src-tauri/src/lib.rs` | Background calendar sync thread | OAuth flow complete, sync scheduler not started | Add tokio-based periodic calendar sync | High |
| `src-tauri/src/services/mod.rs` | Deterministic AI fallback | Used when no API keys configured | Replace with full AI integration after testing | Low |
| `src-tauri/src/lib.rs` | Active window tracking service | Phase 2 requires platform-specific Win32 APIs | Implement Windows-only window tracking | High |
| `src-tauri/src/services/mod.rs` | Context manager evaluation loop | Schema exists, evaluation logic incomplete | Implement full derive_context_snapshot with intent evaluation | High |
| `src/components/TaskCard.tsx` | Focus session timer UI | Backend supports sessions, UI incomplete | Add active session indicator and timer | Medium |
| `src/pages/ContextPage.tsx` | Activity monitoring visualization | Database schema ready, UI incomplete | Add activity log and privacy controls | Medium |
| `src/App.tsx` | Global keyboard shortcuts | Not implemented | Add Ctrl+N, Ctrl+K, Ctrl+D, Escape handlers | Low |
| `src/components/TaskComposer.tsx` | Onboarding tooltip | First-run experience incomplete | Add feature tour for new users | Low |

## Review Schedule

Review this file weekly to ensure placeholders are either implemented or documented as intentional long-term stubs.

## Last Review

**Date:** 2026-05-06
**Action:** Updated placeholders.md with Phase 2 incomplete implementations
