# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. API Keys & Security (CRITICAL)

### Required API Keys for Development

FlowForge supports multiple AI providers for morning briefings and task interventions. Configure these in your `.env` file:

| Environment Variable | Provider | Purpose | Status |
|---|---|---|---|
| `OPENAI_API_KEY` | OpenAI | GPT models for briefing/intervention | Primary |
| `ANTHROPIC_API_KEY` | Anthropic | Claude models for briefing/intervention | Primary |
| `DEEPSEEK_API_KEY` | DeepSeek | DeepSeek models | Optional |
| `GLM_API_KEY` | Z.AI | GLM models | Optional |
| `MOONSHOT_API_KEY` | Moonshot AI | Moonshot models | Optional |
| `MINIMAX_API_KEY` | MiniMax | MiniMax models | Optional |
| `MISTRAL_API_KEY` | Mistral AI | Mistral models | Optional |
| `COHERE_API_KEY` | Cohere | Cohere models | Optional |
| `VOYAGE_API_KEY` | Voyage AI | Voyage models | Optional |
| `JINA_API_KEY` | Jina AI | Jina models | Optional |
| `HUGGING_FACE_API_KEY` | Hugging Face | Hugging Face models | Optional |
| `LANGSMITH_API_KEY` | LangSmith | LangSmith tracing/debugging | Optional |

### Provider Configuration

The app uses these environment variables for AI provider selection:
- `FLOWFORGE_DEFAULT_AI_PROVIDER` - Default: `openai`
- `FLOWFORGE_DEFAULT_MODEL` - Default: `gpt-4.1-mini`

### Security Rules (MANDATORY)

**NEVER:**
- Commit `.env` files to git
- Include API keys in code or comments
- Log API keys or tokens in any output
- Share API keys in issues, discussions, or PRs

**ALWAYS:**
- Use `.env.example` as a template (contains no actual keys)
- Verify `.gitignore` includes `.env` patterns
- Rotate API keys if accidentally exposed
- Use deterministic fallback when no keys are configured

### .gitignore Verification

Ensure these patterns exist in `.gitignore`:
```
.env
.env.*
!.env.example
*.db
*.db-shm
*.db-wal
exports/
*.log
```

---

## 2. Development Environment Setup

**Prerequisites:**
- Node.js 18+ and npm
- Rust and Cargo
- Tauri CLI

**Setup:**
1. Copy `.env.example` to `.env` and populate API keys
2. Run `npm install` for frontend dependencies
3. Run `cargo build --manifest-path src-tauri/Cargo.toml` for Rust dependencies

---

## 3. Development Commands

**Frontend (Vite + React):**
- `npm run dev` - Start Vite dev server on port 1420
- `npm run build` - Build production bundle (TypeScript + Vite)
- `npm run test` - Run Vitest tests (jsdom environment, globals enabled)
- `npm run test:watch` - Run tests in watch mode

**Desktop App (Tauri):**
- `npm run tauri:dev` - Run desktop app in development mode
- `npm run tauri:build` - Build production desktop app
- `cargo test --manifest-path src-tauri/Cargo.toml` - Run Rust backend tests

---

## 4. Architecture Overview

FlowForge is a Tauri v2 desktop application with a React frontend and Rust backend. The app manages tasks, projects, daily outcomes, calendar events, and provides AI-powered morning briefings and task interventions.

**Frontend (`src/`):**
- `pages/` - Route-level components (Dashboard, Briefing, Context, Agenda)
- `components/` - Reusable UI components (TaskCard, TaskComposer, TaskDetailPanel)
- `stores/` - Zustand state management (`useFlowForgeStore` is the single source of truth)
- `lib/tauri.ts` - Type-safe IPC client wrappers invoking Tauri commands
- `types/domain.ts` - Shared TypeScript types (must match Rust models)

**Backend (`src-tauri/src/`):**
- `commands/` - Tauri command handlers (thin wrappers over Database methods)
- `db/` - SQLite database layer with migrations and business logic
- `services/` - AI providers (OpenAI, Anthropic) and Google Calendar OAuth
- `models/` - Request/response types shared with frontend
- `lib.rs` - App setup, tray icon, window management, background context snapshot thread

**Data Flow:**
1. Frontend calls Tauri command via `api.*` wrappers
2. Rust command handler in `commands/` calls Database method
3. Database returns domain models to frontend
4. Zustand store updates, React components re-render
5. Background thread emits `context-update` events every 15 seconds

**Key Patterns:**
- All frontend-backend communication goes through Tauri commands (no direct local storage)
- Store actions use `guard()` wrapper for consistent error handling and loading state
- Domain types are defined in `src/types/domain.ts` and `src-tauri/src/models/mod.rs` - keep them in sync
- Database migrations in `src-tauri/src/db/migrations/` are ordered and idempotent

---

## 5. Project Structure & Conventions

```
src/
├── components/     # Reusable UI components
├── pages/         # Route-level page components
├── stores/        # Zustand state management
├── lib/           # Utilities and IPC helpers
├── types/         # TypeScript type definitions
├── hooks/         # Custom React hooks
├── test/          # Test setup and utilities
└── styles.css     # Global styles and Tailwind imports

src-tauri/src/
├── commands/      # Tauri command handlers
├── db/            # Database layer and migrations
├── services/      # AI providers, calendar sync
├── models/        # Request/response types
└── lib.rs         # App setup and background services

docs/              # Product and architecture documentation
tests/             # Integration test fixtures
scripts/           # Development utilities
```

**Naming Conventions:**
- Frontend: 2-space indentation, `PascalCase` for components, `camelCase` for functions, `kebab-case` for file names
- Rust: `snake_case` modules/functions, `PascalCase` types, explicit request/response structs for Tauri commands
- SQL: keep migrations idempotent, ordered, and readable

---

## 6. Important Constraints

### AI Integration
- Morning briefings and "Unstick Me" interventions call hosted AI (OpenAI/Anthropic) when API keys are configured
- Falls back gracefully to deterministic local text generation
- Never expose API keys in logs or commits

### Privacy-First Design
- SQLite database at app data dir (`flowforge.sqlite3`)
- Export and purge tools in Settings page
- Calendar tokens stored securely via keyring
- All user data remains local

### Task Status Workflow
- Tasks flow through statuses: `not_started` → `in_progress` → `done` (or `stuck`/`blocked`)
- `archived` is terminal
- Agenda page shows inbox triage, rescheduling, and "back to inbox" workflow

### Window Management
- Window close-to-tray is handled in Rust (`src-tauri/src/lib.rs`)
- Do NOT add `onCloseRequested` handlers in React - this causes duplicate event handling
- Window minimizes to tray and can be restored via tray menu

### Theme Handling
- Theme changes persist to localStorage as fallback
- System preference is default
- Prevents flicker on initial load by checking localStorage first

---

## 7. Testing Guidelines

**Frontend Tests:**
- Write tests as `*.test.ts` or `*.test.tsx`
- Use Vitest with jsdom environment
- Test setup in `src/test/setup.ts`
- Cover happy path, validation failure, and persistence-sensitive flows

**Rust Tests:**
- Write tests near the code they verify
- Include migration coverage for schema changes
- Run with `cargo test --manifest-path src-tauri/Cargo.toml`

---

## 8. Build & Deployment

**Development:**
- `npm run tauri:dev` - Full stack development mode
- `npm run dev` - Frontend only (for UI work)

**Production:**
- `npm run tauri:build` - Creates platform-specific installers
- Windows: `.msi` / `.nsis` installer
- macOS: `.dmg` (requires code signing)
- Linux: `.deb`, `.AppImage`, or `.rpm`

---

## 9. Documentation Files

**Maintain these files:**
- `CLAUDE.md` - This file (development guide)
- `README.md` - Project overview and setup
- `placeholders.md` - Track incomplete implementations and stubs
- `pending.md` - Track work blocked by external issues
- `docs/` - Product and architecture documentation

**Keep docs current:**
- Update phase docs when features are implemented
- Sync README.md with actual feature state
- Review placeholders.md periodically to complete stubs

---

## 10. Phase-Specific Implementation Notes

### Phase 1 (Foundation - COMPLETE)
- Task management with CRUD operations
- Daily outcomes and morning briefing
- Agenda/inbox workflow with rescheduling
- Focus blocks and monitoring rules
- Task detail panel with micro-task breakdown
- Export/purge tools and theme switching

### Phase 2 (Context Layer - PARTIAL)
- Database schema: COMPLETE
- Backend commands: COMPLETE
- Frontend UI: PARTIAL
- Background services: MISSING
  - Active window tracking (platform-specific)
  - Calendar sync scheduler
  - Context manager evaluation loop

### Phase 3 (AI Decomposition - PLANNED)
- Task deconstruction with AI
- Micro-task generation
- Visual roadmapper

### Phase 4 (Privacy & Screenshots - PLANNED)
- Screenshot capture with blur
- Activity monitoring
- Local AI inference

---

## 11. Troubleshooting

**Common Issues:**

1. **Window doesn't close to tray**
   - Check that `onCloseRequested` is only in Rust, not React
   - Verify tray icon is showing

2. **Tasks don't appear after creation**
   - Check console for errors
   - Verify database is being updated
   - Try refreshing the dashboard

3. **AI features don't work**
   - Verify API keys are in `.env`
   - Check `FLOWFORGE_DEFAULT_AI_PROVIDER` setting
   - App should fallback to deterministic generation

4. **Theme flickers on startup**
   - Verify localStorage theme persistence is working
   - Check that theme is applied before first render

---

## 12. Contributing Guidelines

**Commit Messages:**
- Use conventional commits: `type(scope): subject`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Scopes: `task`, `agenda`, `briefing`, `calendar`, `context`, `ui`, `db`, `api`
- Example: `feat(task): add micro-task creation and completion`

**Before Committing:**
1. Run tests: `npm run test` and `cargo test --manifest-path src-tauri/Cargo.toml`
2. Verify .gitignore protects sensitive files
3. Check that API keys are not in code or logs
4. Update relevant documentation

**Code Review:**
- All changes should maintain type safety
- UI changes should be tested in both light and dark themes
- Backend changes should include database migration tests
