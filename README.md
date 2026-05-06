# FlowForge

FlowForge is a Windows-first Tauri desktop application for agenda management, daily intent setting, and anti-procrastination coaching. This repository currently implements the Phase 1 foundation: local task management, morning briefing flows, and privacy-first local persistence.

## Stack
- Tauri v2
- Rust + `rusqlite`
- React + TypeScript + Vite
- Tailwind CSS
- Zustand

## Repository Layout
- `docs/`: product vision and phase plans
- `src/`: frontend application
- `src-tauri/`: Rust backend
- `tests/`: shared test fixtures and integration helpers
- `scripts/`: development utilities

## Development
1. Copy `.env.example` to `.env` and populate API keys as needed.
2. Install dependencies with `npm install`.
3. Run `npm run tauri dev` for the desktop app or `npm run dev` for the frontend alone.
4. Run `npm run test` and `cargo test --manifest-path src-tauri/Cargo.toml`.

## Documentation
- [Architecture vision](docs/architecture/flowforge_v2.md)
- [Phase 1 MVP](docs/FlowForge_Phase_1_Foundation_Agenda_MVP.md)
- [Phase 2 context layer](docs/FlowForge_Phase_2_Context_Calendar_Observation.md)
- [Contributor guide](AGENTS.md)

