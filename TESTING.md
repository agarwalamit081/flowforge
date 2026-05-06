# FlowForge Testing Guide

## Development Environment Testing

### Frontend Tests
```bash
npm run test              # Run all frontend tests
npm run test:watch       # Run tests in watch mode
```

### Backend Tests
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### Full Stack Development
```bash
npm run tauri:dev         # Run desktop app in development mode
```

---

## Windows Testing Checklist

### Prerequisites
1. Windows 10/11 with latest updates
2. Node.js 18+ installed
3. Rust and Cargo installed
4. Visual Studio Build Tools (for Rust compilation)

### Build Verification
```powershell
# Navigate to project directory
cd C:\path\to\flowforge

# Install dependencies
npm install

# Build production app
npm run tauri:build

# Verify installer created
# Check: src-tauri/target/release/bundle/
```

### Expected Installer Output
- Windows: `flowforge_0.1.0_x64-setup.exe` (NSIS installer)
- Alternative: `flowforge_0.1.0_x64_en-US.msix` (MSIX package)

### Feature Testing Checklist

#### Phase 1 Core Features
- [ ] **App launches from Start Menu** after installation
- [ ] **Tray icon appears** with context menu
- [ ] **Window opens** from tray → "Open FlowForge"
- [ ] **Window minimizes to tray** on close (doesn't quit)
- [ ] **App quits cleanly** from tray → "Quit"
- [ ] **Create task** with title, description, priority, due date
- [ ] **Task appears** in Today view immediately after creation
- [ ] **Add micro-tasks** to a task
- [ ] **Start focus session** on a task (status changes to in_progress)
- [ ] **Complete micro-task** (status updates)
- [ ] **Click "Stuck"** and select reason
- [ ] **Complete task** (status changes to done)
- [ ] **Run Morning Briefing** (briefing generates)
- [ ] **Export data** as JSON (file downloads)
- [ ] **Quit and relaunch** → all data persisted
- [ ] **Purge data** → database is empty

#### Window Management
- [ ] Window close hides to tray
- [ ] Window restores from tray menu
- [ ] Window minimizes correctly
- [ ] No duplicate window handles

#### Theme Persistence
- [ ] Theme changes persist across restarts
- [ ] No theme flicker on startup
- [ ] System theme preference respected

#### Task Creation Feedback
- [ ] Loading spinner shows during creation
- [ ] Success notification appears
- [ ] Error messages are actionable

#### Keyboard Shortcuts
- [ ] Ctrl+N: Focus task creation
- [ ] Ctrl+K: Command palette (when implemented)
- [ ] Ctrl+D: Navigate to dashboard
- [ ] Ctrl+A: Navigate to agenda
- [ ] Escape: Close panels

#### Toast Notifications
- [ ] Success toasts appear for actions
- [ ] Error toasts show for failures
- [ ] Toasts auto-dismiss after duration

#### Onboarding Flow
- [ ] First launch shows onboarding wizard
- [ ] Can skip onboarding
- [ ] Onboarding progress saves
- [ ] Onboarding completion stored

---

## Known Issues & Workarounds

### Linux Environment
- **Issue**: Current development environment is Linux
- **Impact**: Cannot test Windows-specific features (Win32 APIs)
- **Workaround**: Document Windows testing procedures for when Windows environment is available

### Active Window Tracking
- **Status**: Stubbed with platform detection
- **Windows**: Needs Win32 API implementation (GetForegroundWindow, GetWindowText)
- **Linux**: Needs X11/Wayland implementation
- **macOS**: Needs NSWorkspace implementation

### Calendar Sync
- **Status**: OAuth flow implemented, sync service created
- **Testing**: Requires valid Google Client ID/Secret
- **Verification**: Check events appear in Context page after sync

---

## Test Data Setup

### Sample Tasks for Testing
```
1. "Complete project documentation" (High priority, 30 min)
2. "Review pull requests" (Medium priority, 45 min)
3. "Team standup meeting" (Low priority, 15 min)
```

### Sample Daily Outcomes
```
1. "Finish project README"
2. "Review 2 PRs"
3. "Plan sprint tasks"
```

---

## Performance Testing

### Startup Time
- Target: App loads in < 3 seconds
- Measure: From double-click to usable state

### Task Creation
- Target: Task appears in < 1 second
- Measure: From form submit to display update

### Database Operations
- Target: All operations complete in < 500ms
- Critical paths: Task creation, status updates, data export

---

## Bug Report Template

When testing on Windows, use this format:

```markdown
**Environment**: Windows 11, Node.js 18.x, Rust 1.x

**Steps to Reproduce**:
1. Action 1
2. Action 2
3. Action 3

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Console Errors**: Any errors in dev tools

**Screenshots**: If applicable
```

---

## Continuous Testing

### Before Each Commit
```bash
npm run test                           # Frontend tests
cargo test --manifest-path src-tauri/Cargo.toml  # Backend tests
```

### Before Release
1. Full Windows testing checklist
2. Test data export/import
3. Test data purge
4. Verify all API integrations
5. Check memory usage during extended use

---

## Test Coverage Goals

### Frontend
- Target: 80%+ coverage
- Critical paths: 100% coverage
- Components: All major components tested

### Backend
- Target: 70%+ coverage
- Database operations: 100% coverage
- API endpoints: All paths tested

### Integration
- Target: All user flows tested end-to-end
- Critical flows: Task creation, focus sessions, data export/purge

---

## Next Steps for Windows Testing

1. **Set up Windows VM or access Windows machine**
2. **Install development dependencies** (Node.js, Rust, VS Build Tools)
3. **Run full build and installation test**
4. **Execute feature testing checklist**
5. **Document any issues found**
6. **Verify installer works correctly**
7. **Test uninstall process**

**Current Blocker**: Development environment is Linux; need Windows environment for full testing.
