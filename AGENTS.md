# Repository Guidelines

## Project Structure & Module Organization
FlowForge is a Tauri desktop app with a React/TypeScript frontend and a Rust backend.

- `src/`: React UI, routes, components, stores, typed IPC client helpers.
- `src-tauri/`: Rust commands, services, repositories, models, and migrations.
- `docs/`: architecture notes, phase plans, and contributor-facing product docs.
- `tests/`: frontend integration helpers and cross-cutting test fixtures.
- `scripts/`: developer utilities such as Windows setup helpers.

Keep new docs under `docs/`. Keep feature code grouped by domain (`agenda`, `briefing`, `projects`, `settings`) instead of by page-only concerns.

## Build, Test, and Development Commands
- `npm install`: install frontend and Tauri JS dependencies.
- `npm run dev`: run the Vite frontend by itself.
- `npm run tauri dev`: run the desktop app in development mode.
- `npm run build`: build the frontend bundle.
- `npm run test`: run Vitest frontend tests.
- `cargo test --manifest-path src-tauri/Cargo.toml`: run Rust unit and migration tests.

Use the Tauri commands as the source of truth for frontend-backend integration; do not bypass them with ad hoc local storage.

## Coding Style & Naming Conventions
- Frontend: 2-space indentation, `PascalCase` for components, `camelCase` for functions, `kebab-case` for file names outside component files.
- Rust: `snake_case` modules/functions, `PascalCase` types, explicit request/response structs for Tauri commands.
- SQL: keep migrations idempotent, ordered, and readable.

Prefer small domain modules over large utility files. Add comments only where behavior is non-obvious.

## Testing Guidelines
Write frontend tests as `*.test.ts` or `*.test.tsx`. Keep Rust tests near the code they verify, and include migration coverage for schema changes. New behavior should cover happy path, validation failure, and persistence-sensitive flows.

## Commit & Pull Request Guidelines
Use conventional, imperative commits such as `feat: add task repository` or `docs: update phase 1 setup`. Keep commits focused and include a concise summary of what changed. Never commit `.env`, API keys, OAuth tokens, local databases, or export bundles.
