# FlowForge Phase 4 — Privacy Screenshots, Local AI, Pattern Learning & Product Polish

> **Estimated Duration:** 5–6 weeks  
> **Milestone:** Complete the original FlowForge vision with privacy-safe screenshots, local AI inference, procrastination pattern detection, and a production-ready Windows installer.

---

## 1. Goal & Philosophy

Complete the original FlowForge vision: privacy-safe screenshots, on-device processing, pattern learning, distraction-aware interventions, progress timelapses, and production-quality Windows packaging. This phase is intentionally **last** because it carries the most platform-specific risk (screen capture APIs, FFmpeg bundling, local model performance) and privacy sensitivity (visual data processing).

### Why This Phase Last

Screenshot capture, browser extension integration, and local LLM inference are the three most technically risky subsystems in FlowForge. By deferring them to Phase 4, the team has a stable, tested app (Phases 1–3) to integrate into. If a screenshot API behaves unexpectedly on Windows or a local model is too slow, the app still delivers immense value through its calendar sync, context awareness, and API-backed AI features.

---

## 2. Primary User Outcomes

| # | Outcome | Description |
|---|---------|-------------|
| 1 | Screenshot capture | Enable periodic, consent-based screenshots of the active work window. |
| 2 | Privacy blurring | Faces, sensitive text, and blocked content are automatically redacted. |
| 3 | Screenshot review | Browse, inspect, and delete any captured frame. |
| 4 | Progress timelapse | End-of-day video recap compressing work into a 30-second clip. |
| 5 | Pattern insights | See personal procrastination patterns (e.g., "You drift after 45 min of focus"). |
| 6 | Local AI option | Run AI features on-device without sending data to any external service. |
| 7 | Browser integration | Chrome/Edge extension tracks URLs and enables optional site blocking. |
| 8 | Polished installer | Professional Windows installer with auto-start and system tray. |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 React UI (Additions)                     │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │  Privacy    │ │  Screenshot  │ │  Timelapse        │  │
│  │  Dashboard  │ │  Review      │ │  Player           │  │
│  └─────────────┘ └──────────────┘ └───────────────────┘  │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │  Pattern    │ │  Distraction │ │  Local AI         │  │
│  │  Insights   │ │  Rules       │ │  Settings         │  │
│  └─────────────┘ └──────────────┘ └───────────────────┘  │
│                          │                                │
│                          │ Tauri IPC + Events             │
├──────────────────────────┼───────────────────────────────┤
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │               Rust Backend (Additions)             │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Screenshot Service                          │  │  │
│  │  │  ┌────────────┐  ┌────────────────────────┐  │  │  │
│  │  │  │  Capture   │  │  Privacy Redaction      │  │  │  │
│  │  │  │  Pipeline  │  │  Pipeline               │  │  │
│  │  │  │ (xcap/scap)│  │ (image+imageproc+ort)   │  │  │
│  │  │  └────────────┘  └────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Pattern Detector                            │  │  │
│  │  │  (Rule engine + statistical analysis)        │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Local AI Adapter                            │  │  │
│  │  │  (llama.cpp sidecar → LlmProvider trait)     │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Timelapse Generator                         │  │  │
│  │  │  (ffmpeg sidecar)                            │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Browser Extension Bridge                    │  │  │
│  │  │  (tokio-tungstenite WebSocket server)        │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Encrypted Storage Layer                     │  │  │
│  │  │  (AES-256-GCM at rest, keyring-managed)      │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Context Manager (v3) — enriched with        │  │  │
│  │  │  screenshot analysis + pattern scores        │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌───────────┐   │  │
│  │  │  All Phase  │ │  LLM Gateway│ │ Activity  │   │  │
│  │  │  1-3 Svc's  │ │  (Phase 3)  │ │  Svc (P2) │   │  │
│  │  └─────────────┘ └──────────────┘ └───────────┘   │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                                │
├──────────────────────────┼───────────────────────────────┤
│  SQLite + Encrypted Files + Optional Model Files          │
└──────────────────────────────────────────────────────────┘
         ▲               ▲               ▲               ▲
    ┌────┴────┐   ┌──────┴──────┐  ┌────┴──────┐  ┌────┴──────┐
    │ Windows │   │  Browser    │  │  llama.cpp│  │  ffmpeg    │
    │ APIs    │   │  Extension  │  │  sidecar  │  │  sidecar  │
    │ (Win32) │   │  (Manifest  │  │  (local)  │  │  (bundled)│
    │         │   │   V3)       │  │           │  │           │
    └─────────┘   └─────────────┘  └───────────┘  └───────────┘
```

---

## Context Manager (v3)

Phase 4 enriches the Context Manager (v2 from Phase 3) with two new data sources: **screenshot analysis** and **pattern scores**.

### What Changes from v2

| Aspect | v2 (Phase 3) | v3 (Phase 4) |
|--------|--------------|--------------|
| Data sources | Calendar + Activity + Agenda + AI | + Screenshot metadata + Pattern profiles |
| Pattern awareness | None | Uses `user_pattern_profiles` to pre-emptively adjust nudge timing |
| Screenshot context | None | Knows whether a screenshot was captured, its redaction status |
| Drift detection | Rule-based only | Pattern-informed: if user historically drifts at this time, shorten grace period |
| Intervention selection | Rules first, AI second | Rules first, pattern-informed scoring, AI second |

### Updated `ContextSnapshot`

```rust
struct ContextSnapshot {
    // --- Carried forward from v2 ---
    now: DateTime<Utc>,
    active_task_id: Option<String>,
    active_focus_block_id: Option<String>,
    active_calendar_event_id: Option<String>,
    active_app: Option<AppActivity>,
    monitoring_allowed: bool,
    intent_state: IntentState,

    // --- New in v3 ---
    active_pattern_profiles: Vec<PatternProfile>,     // Active patterns for this time/task
    drift_risk_score: Option<f32>,                      // 0.0-1.0 from pattern detector
    screenshot_enabled: bool,                           // Whether capture is active
    last_screenshot_redaction_status: Option<String>,    // 'processed', 'failed', etc.
}
```

### Pattern-Informed Grace Period

Instead of a fixed 2-minute grace period for drift detection (v2), v3 dynamically adjusts based on the user's `user_pattern_profiles`:

| Pattern Detected | Grace Period Adjustment |
|------------------|--------------------------|
| Post-focus drift (confidence > 0.7) | Shorten to 1 minute |
| Meeting recovery gap (confidence > 0.7) | Extend to 3 minutes after meeting ends |
| Time-of-day energy drop (afternoon) | Shorten overall, increase nudge frequency |
| No patterns yet (first week) | Use v2 defaults (2-minute grace) |

This means the Context Manager becomes **personalized over time** — it learns when to be lenient and when to be proactive based on the user's own behavioral data.

---

## 4. Technical Stack

### 4.1 Carried Forward from Phases 1–3

| Technology | Purpose |
|-----------|---------|
| Tauri v2 | Desktop runtime |
| React 18 + TypeScript + Vite | Frontend |
| Tailwind CSS | Styling |
| Zustand | UI state management |
| Rust + Tokio + Serde + Chrono | Backend runtime |
| SQLite via rusqlite | Storage |
| `reqwest` | HTTP client |
| `keyring` | Credential storage |
| LLM Gateway + Provider trait | AI abstraction |
| Context Manager (v3) | Situation evaluation + pattern scores + screenshot context |
| Intervention Engine (v2) | Nudge selection |

### 4.2 New Additions in Phase 4

| Technology | Crate/Library | Purpose |
|-----------|---------------|---------|
| Screen capture | `xcap` or `scap` | Per-window screenshot capture on Windows |
| Image processing | `image` + `imageproc` | Cropping, masking, Gaussian blur |
| Face detection | `ort` (ONNX Runtime) + YOLOv8n-face (~5 MB) | Detect faces for blurring |
| OCR (optional) | `leptess` (Tesseract bindings) | Detect and redact sensitive text |
| Video encoding | `ffmpeg` sidecar (via `std::process::Command`) | Stitch screenshots into timelapse MP4 |
| Browser bridge | `tokio-tungstenite` | Local WebSocket server for browser extension |
| Local LLM | `llama.cpp` sidecar (GGUF models) | On-device AI inference |
| Encryption | `aes-gcm` crate | AES-256-GCM encryption for local data at rest |
| Model management | Custom Rust module | Download, verify, and manage local model files |

---

## 5. Screenshot Capture Design

### 5.1 Consent-First Philosophy

Screenshots are **disabled by default**. The user must explicitly enable them and configure:

| Setting | Options | Default |
|---------|---------|---------|
| Capture enabled | On/Off | Off |
| Capture interval | 30s, 60s, 120s, 300s | 60s |
| Capture scope | Active window only, Full virtual screen | Active window only |
| Storage mode | Store blurred frames, Transient (analyze + discard) | Store blurred |
| Retention duration | 1 day, 7 days, 30 days, 90 days, Forever | 7 days |
| Timelapse generation | On/Off | Off |
| Sensitive app handling | Skip entirely, Blur full frame, Blur + store | Skip entirely |

### 5.2 Capture Pipeline

```
Timer tick or focus-session tick
  │
  ▼
Check active app/window against monitoring rules (Phase 2)
  │
  ├─ Denied → Do nothing, skip this cycle
  │
  ├─ Metadata-only → Store activity_segment only (no image)
  │
  └─ Allowed → Capture active window via xcap/scap
             │
             ▼
       Crop to window bounding box (image crate)
             │
             ▼
       Resize to max 1920x1080
             │
             ▼
       Redaction pipeline (see §6)
             │
             ▼
       Convert to JPEG at 80% quality
             │
             ▼
       Store blurred frame to disk (app_data/screenshots/)
             │
             ▼
       Store metadata in screenshot_captures table
             │
             ▼
       Emit review/update event to frontend
```

### 5.3 SQLite Schema Additions

```sql
-- =============================================
-- Screenshot Captures
-- =============================================
CREATE TABLE screenshot_captures (
  id                    TEXT PRIMARY KEY,    -- UUID v4
  focus_session_id      TEXT REFERENCES focus_sessions(id) ON DELETE SET NULL,
  activity_segment_id   TEXT REFERENCES activity_segments(id) ON DELETE SET NULL,
  file_path             TEXT NOT NULL,       -- Relative path in app_data/screenshots/
  thumbnail_path        TEXT,                -- Smaller preview for gallery
  captured_at           TEXT NOT NULL,       -- ISO 8601
  app_name              TEXT,
  window_title_redacted TEXT,
  redaction_status      TEXT NOT NULL        -- 'pending', 'processed', 'failed'
                        CHECK(redaction_status IN ('pending', 'processed', 'failed')),
  retention_until       TEXT,                -- When this frame should be auto-deleted
  deleted_at            TEXT                 -- Soft delete
);

CREATE INDEX idx_screenshots_session ON screenshot_captures(focus_session_id);
CREATE INDEX idx_screenshots_time ON screenshot_captures(captured_at);
CREATE INDEX idx_screenshots_retention ON screenshot_captures(retention_until);

-- =============================================
-- Screenshot Redactions (audit trail)
-- =============================================
CREATE TABLE screenshot_redactions (
  id                TEXT PRIMARY KEY,
  screenshot_id     TEXT NOT NULL REFERENCES screenshot_captures(id) ON DELETE CASCADE,
  redaction_type    TEXT NOT NULL,           -- 'face_blur', 'text_redact', 'full_blur', 'region_mask'
  confidence        REAL,                   -- 0.0–1.0 detection confidence
  bounding_box_json TEXT,                   -- {x, y, width, height}
  created_at        TEXT NOT NULL
);
```

---

## 6. Privacy Redaction Pipeline

### 6.1 Layered Privacy Approach

The privacy pipeline uses **defense in depth** — multiple independent layers that each contribute to protecting sensitive data. No single layer is relied upon as the sole privacy barrier.

```
Layer 1: Pre-capture filtering (fastest, most reliable)
  │  └─ Monitoring rules (Phase 2) prevent capture entirely for denied apps
  │
Layer 2: Metadata minimization
  │  └─ Window titles are redacted based on rules before any storage
  │
Layer 3: Visual processing
  │  ├─ Full-frame blur for "sensitive but keep proof of work" apps
  │  ├─ Face detection and blur via ONNX Runtime
  │  └─ OCR text detection and redaction (optional, performance-dependent)
  │
Layer 4: Retention enforcement
  │  └─ Auto-delete frames after retention period expires
  │
Layer 5: User review
     └─ Manual review and delete capability in the gallery UI
```

### 6.2 Face Detection

**Model:** UltraLight YOLOv8n-face (~5 MB, ONNX format)

```rust
struct FaceDetector {
    session: ort::Session,          // ONNX Runtime session
    blur_radius: u32,               // Gaussian blur radius (default: 25)
    min_confidence: f32,            // Detection threshold (default: 0.5)
}

impl FaceDetector {
    fn detect_and_blur(
        &self,
        image: &DynamicImage,
    ) -> (DynamicImage, Vec<DetectedFace>) {
        let faces = self.session.run(image.to_rgb8())?;

        let mut blurred = image.clone();
        for face in &faces {
            // Draw filled Gaussian blur circle over face region
            let roi = blurred.crop_imm(face.x, face.y, face.w, face.h);
            let blurred_roi = roi.blur(self.blur_radius);
            blurred.copy_from(&blurred_roi, face.x, face.y);
        }

        (blurred, faces)
    }
}
```

**Performance target:** Process each screenshot within 2 seconds on a modern CPU. If face detection exceeds 3 seconds, skip it and log a warning.

### 6.3 Text Redaction (OCR — Optional)

OCR is **intentionally optional and behind a feature flag**. It is slow, CPU-intensive, and not always accurate. The strongest privacy controls remain the allow/deny rules and metadata minimization.

**When enabled:**

1. Run Tesseract OCR via `leptess` on the captured image.
2. Extract all text regions with bounding boxes.
3. Apply regex patterns to detect sensitive content:
   - Email addresses: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
   - Credit card numbers: `\b(?:\d[ -]*?){13,16}\b`
   - URLs (if user opts out of URL capture)
   - Phone numbers: `\b\d{3}[-.]?\d{3}[-.]?\d{4}\b`
4. Draw black boxes or heavy Gaussian blur over matching regions.
5. Store redaction audit trail in `screenshot_redactions` table.

**Performance target:** If OCR takes more than 5 seconds per frame, disable it automatically and notify the user.

### 6.4 Auto-Retention Cleanup

A background Tokio task runs daily at midnight:

```rust
async fn retention_cleanup_task(db: Arc<SQLiteRepo>, screenshots_dir: PathBuf) {
    let mut interval = tokio::time::interval(Duration::from_secs(24 * 3600));
    loop {
        interval.tick().await;
        let expired = db.get_expired_screenshots().await;
        for capture in &expired {
            // Delete file from disk
            fs::remove_file(screenshots_dir.join(&capture.file_path)).ok();
            if let Some(thumb) = &capture.thumbnail_path {
                fs::remove_file(screenshots_dir.join(thumb)).ok();
            }
        }
        db.soft_delete_expired_screenshots(&expired).await;
    }
}
```

---

## 7. Browser Extension Bridge

### 7.1 Why It Is Needed

Native active-window tracking (Phase 2) can detect that Chrome/Edge is the active app but **cannot** see which tab or URL is open. A browser extension provides accurate URL and page title data without network interception or complex OS-level hooks.

### 7.2 Extension Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Browser Extension  │         │  FlowForge (Tauri)   │
│  (Manifest V3)      │         │  Local WebSocket     │
│                     │         │  Server (localhost)   │
│  ┌───────────────┐  │   WS    │  ┌──────────────┐   │
│  │  Content      │◄─┼────────►│  │  Activity    │   │
│  │  Script       │  │  JSON   │  │  Service     │   │
│  └───────────────┘  │         │  └──────────────┘   │
│  ┌───────────────┐  │         │  ┌──────────────┐   │
│  │  Background   │──┼────────►│  │  Context     │   │
│  │  Service      │  │         │  │  Manager     │   │
│  └───────────────┘  │         │  └──────────────┘   │
│  ┌───────────────┐  │         │  ┌──────────────┐   │
│  │  Popup UI     │  │         │  │  Intervention│   │
│  │  (focus task) │  │         │  │  Engine      │   │
│  └───────────────┘  │         │  └──────────────┘   │
└─────────────────────┘         └──────────────────────┘
```

### 7.3 Extension Features

| Feature | Description |
|---------|-------------|
| URL tracking | Send active tab URL + title to Tauri WebSocket on tab change |
| Domain extraction | Tauri stores domain only (e.g., `youtube.com`), not full URL |
| Focus timer popup | Show current top task and focus timer in extension popup |
| Site blocking (optional) | During focus blocks, redirect distracting domains to a reminder page |
| Minimal permissions | `activeTab`, `tabs`, `storage` — no broad host permissions |

### 7.4 WebSocket Security

```rust
struct BrowserBridge {
    shared_secret: String,           // Random per-install, stored in extension + app config
    expected_origin: String,         // Extension ID validation
}

impl BrowserBridge {
    fn handle_message(&self, msg: IncomingMessage) -> Result<()> {
        // 1. Verify shared_secret matches
        if msg.secret != self.shared_secret {
            return Err(BridgeError::Unauthorized);
        }

        // 2. Extract domain from URL
        let domain = extract_domain(&msg.url)?;

        // 3. Store domain (not full URL) in activity_segments
        self.db.update_activity_domain(domain, &msg.session_id).await;

        // 4. Check if blocking is active
        if self.is_blocked_domain(&domain) {
            return Ok(()); // Extension will handle redirect
        }

        Ok(())
    }
}
```

---

## 8. Procrastination Pattern Detector

### 8.1 Design Philosophy

Start with **rules and statistics**, not complex machine learning. The first useful version requires only simple feature engineering on the data already collected in Phases 2–3. Complex ML models are added later only if the rule engine proves insufficient.

### 8.2 Feature Extraction

| Feature | Source | Type |
|---------|--------|------|
| Time of day | Activity log | Categorical (morning, afternoon, evening, night) |
| Focus session duration before drift | Focus sessions + Activity log | Continuous (seconds) |
| App/category switched to | Activity log | Categorical (work, social, news, entertainment, communication) |
| Task status | Agenda Tracker | Categorical (not_started, in_progress, stuck, blocked) |
| Task estimated duration | Agenda Tracker | Continuous (minutes) |
| Due date proximity | Agenda Tracker | Continuous (days until due) |
| Stuck reason history | Intervention events | Categorical (most common reason) |
| User response to previous nudges | Intervention events | Categorical (accepted, dismissed, snoozed) |
| Day of week | System clock | Categorical |
| Consecutive focus sessions | Focus sessions | Continuous |

### 8.3 Detectable Patterns

| Pattern | Detection Logic | Example |
|---------|----------------|---------|
| **Post-focus drift** | User switches to distracting site within 10 minutes of ending a focus session | "You consistently check social media right after deep work" |
| **Unclear-start freeze** | Task started, no micro-task completed in 20+ minutes, long idle period | "You tend to freeze when the first step is unclear" |
| **Deadline panic loop** | Task rescheduled 3+ times, now within 24 hours of due date | "You push this task forward until the deadline forces action" |
| **Estimate bias** | Similar task types consistently take 2x+ the original estimate | "Your coding tasks typically take twice as long as you plan" |
| **Meeting recovery gap** | After a calendar meeting ends, user drifts for 15+ minutes before returning to agenda | "It takes you 15 minutes to refocus after meetings" |
| **Time-of-day energy** | Focus sessions started after 2 PM are 60% more likely to be abandoned | "Your focus quality drops significantly in the afternoon" |
| **Social media escape** | When a task is marked `stuck` with reason `anxious` or `perfectionism`, user opens social media | "When anxious about quality, you tend to seek distraction" |

### 8.4 SQLite Schema Additions

```sql
-- =============================================
-- Pattern Observations (raw evidence)
-- =============================================
CREATE TABLE pattern_observations (
  id              TEXT PRIMARY KEY,
  pattern_type    TEXT NOT NULL,         -- 'post_focus_drift', 'estimate_bias', etc.
  task_id         TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  confidence      REAL NOT NULL,         -- 0.0–1.0
  evidence_json   TEXT NOT NULL,         -- Structured evidence data
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_patterns_type ON pattern_observations(pattern_type);
CREATE INDEX idx_patterns_time ON pattern_observations(created_at);

-- =============================================
-- User Pattern Profiles (learned summary)
-- =============================================
CREATE TABLE user_pattern_profiles (
  id              TEXT PRIMARY KEY,
  pattern_type    TEXT NOT NULL UNIQUE,  -- One profile per pattern type
  summary         TEXT NOT NULL,         -- Human-readable summary
  confidence      REAL NOT NULL,         -- 0.0–1.0 (increases with more evidence)
  first_observed  TEXT NOT NULL,
  last_observed   TEXT NOT NULL,
  observation_count INTEGER DEFAULT 1,
  updated_at      TEXT NOT NULL
);
```

### 8.5 Pattern Analysis Loop

```
Daily analysis (runs at end of day or on demand):
  │
  ├─ Load today's activity segments, focus sessions, intervention events
  │
  ├─ Run each pattern detector:
  │    ├─ For each detector, compute features from today's data
  │    ├─ Compare against historical profile (if exists)
  │    ├─ If pattern detected with confidence > threshold:
  │    │    ├─ Create pattern_observation record
  │    │    └─ Update or create user_pattern_profile
  │    └─ If profile exists but pattern NOT detected today:
  │         └─ Slightly decrease confidence (pattern may be changing)
  │
  └─ Emit pattern insights to frontend for display
```

---

## 9. Local AI Integration

### 9.1 Practical Scope

Use local models for **privacy-sensitive, lower-latency** tasks:

| Task | Why Local | Model Size |
|------|-----------|------------|
| Classify task type | Small input, fast inference | ~1.5 GB |
| Suggest a short next action | Simple output, low latency | ~1.5 GB |
| Summarize pattern observations | Internal data only | ~2 GB |
| Rewrite goals into clearer wording | Short text transformation | ~1.5 GB |

Avoid making local AI mandatory. Model download size, CPU performance, and packaging complexity can hurt adoption. The app must be fully functional with API-based AI (Phase 3) or with AI disabled entirely.

### 9.2 Implementation: llama.cpp Sidecar

**Recommended approach for rapid delivery:**

```
FlowForge (Tauri)
  │
  ├─ Spawn llama.cpp server process on app start (if local AI enabled)
  │    └─ llama-server --model /path/to/model.gguf --port 31416 --ctx 2048
  │
  ├─ Communicate via localhost HTTP (OpenAI-compatible API)
  │
  └─ Implement LocalLlmProvider (implements LlmProvider trait from Phase 3)
       └─ Routes requests to http://localhost:31416/v1/chat/completions
```

**Why sidecar over Rust bindings:**

| Consideration | Sidecar | Rust Bindings |
|---------------|---------|---------------|
| Build complexity on Windows | Low (pre-built binary) | High (C++ compilation) |
| Model update independence | Yes (swap binary) | No (recompile) |
| Memory isolation | Yes (separate process) | No (shared address space) |
| Crash isolation | Yes (sidecar crash ≠ app crash) | No (panic = app crash) |
| Startup time | Fast (pre-compiled) | Slow (model loading in-process) |

### 9.3 Model Management

| Feature | Implementation |
|---------|---------------|
| Model selection | Settings page shows available models with size and description |
| Download on demand | User clicks "Download" → progress bar → stored in `app_data/models/` |
| Disk size display | "Llama 3.2 3B Q4: 2.1 GB downloaded" |
| Integrity verification | SHA-256 hash check after download |
| Default recommendation | Llama 3.2 3B Instruct Q4_K_M (~2 GB) for balance of quality and speed |
| Fallback | If model is too slow (inference >10s), suggest switching to API provider |

---

## 10. Timelapse Generation

### 10.1 Flow

```
User ends focus session (or clicks "Generate Timelapse")
  │
  ▼
Query screenshot_captures for this session (blurred frames only)
  │
  ▼
Sort by captured_at timestamp
  │
  ▼
FFmpeg command:
  ffmpeg -framerate 10 -i frame_%04d.jpg \
         -c:v libx264 -pix_fmt yuv420p \
         -vf "zoompan=z='min(zoom+0.001,1.5)':d=150:s=1920x1080" \
         -t 30 timelapse_2026-05-06.mp4
  │
  ▼
Save to app_data/timelapses/
  │
  ▼
Show in Timelapse Player UI
```

### 10.2 Windows Packaging Considerations

| Issue | Solution |
|-------|---------|
| FFmpeg binary size (~30 MB) | Use a minimal build with only libx264 and required codecs |
| License (LGPL) | Dynamic linking; provide attribution in About dialog |
| Graceful fallback | If FFmpeg not available, show image strip or animated preview in UI |
| Hardware acceleration | Detect NVENC/AMF for GPU-accelerated encoding on supported hardware |

---

## 11. Encrypted Storage (Optional)

### 11.1 Design

```rust
struct EncryptedStorage {
    db: SqliteConnection,        // Wrapped rusqlite connection
    cipher: Aes256Gcm,           // Encryption cipher
    key_derivation: Argon2id,    // Key derivation from user password / OS keychain
}
```

**Scope:** When enabled, encrypts:
- SQLite database file (via SQLCipher or application-level encryption)
- Screenshot files on disk
- AI chat history
- Pattern observation data

**Key management:**

1. Derive encryption key from OS user password via `keyring` (no separate master password needed).
2. Store the derived key in the OS credential manager (Windows Credential Manager).
3. On first launch with encryption enabled, prompt user to confirm.
4. If the OS credential is lost, the data is irrecoverable (by design — no backdoor).

---

## 12. Production Privacy Dashboard

```
┌─────────────────────────────────────────────────────┐
│  🔒 Privacy & Data                                  │
│                                                      │
│  ┌─── Monitoring ────────────────────────────────┐  │
│  │ Active window tracking:    [ON]               │  │
│  │ Screenshot capture:         [OFF]              │  │
│  │ Browser extension:          Connected (Edge)   │  │
│  │ Poll interval:              30 seconds          │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── What's Being Collected ────────────────────┐  │
│  │ ✓ App names and window titles (redacted)       │  │
│  │ ✓ Focus session start/end times               │  │
│  │ ✓ Calendar event times                        │  │
│  │ ✗ Screenshots (disabled)                      │  │
│  │ ✗ Browser URLs (extension not connected)      │  │
│  │ ✗ Full activity logs (purged)                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── AI & External Services ────────────────────┐  │
│  │ AI Provider:              Anthropic (Claude)   │  │
│  │ Data sent to API:         Task titles only     │  │
│  │ Local AI:                 Not installed         │  │
│  │ Requests this month:      147                   │  │
│  │ Est. cost this month:     $0.12                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── Storage ───────────────────────────────────┐  │
│  │ Database size:           4.2 MB                │  │
│  │ Screenshots:             0 frames              │  │
│  │ Timelapses:              3 videos (120 MB)     │  │
│  │ Local AI model:          Not installed          │  │
│  │ Encryption:              OFF                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── Actions ───────────────────────────────────┐  │
│  │ [Export All Data (JSON)]                       │  │
│  │ [One-Click Purge: Delete Everything]           │  │
│  │ [Delete Screenshots Only]                      │  │
│  │ [Delete AI Request Logs]                       │  │
│  │ [Disable All Monitoring]                       │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 13. Pattern Insights UI

```
┌─────────────────────────────────────────────────────┐
│  🧠 Your Patterns — This Week                       │
│                                                      │
│  ┌─ Post-Focus Drift ──────────────────────────┐    │
│  │ Confidence: 87%  (12 observations)           │    │
│  │                                               │    │
│  │ You tend to open social media within 10      │    │
│  │ minutes of ending a deep work session.       │    │
│  │                                               │    │
│  │ Most common: YouTube (6x), Twitter (4x)      │    │
│  │ Time of day: Usually 11:00 AM – 1:00 PM      │    │
│  │                                               │    │
│  │ Suggestion: Schedule a 10-minute buffer      │    │
│  │ after focus blocks for a mindful transition.  │    │
│  └───────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ Estimate Bias ─────────────────────────────┐    │
│  │ Confidence: 74%  (8 observations)            │    │
│  │                                               │    │
│  │ Your coding tasks take 2.3x longer than      │    │
│  │ you estimate on average.                     │    │
│  │                                               │    │
│  │ Suggestion: Multiply coding estimates by     │    │
│  │ 2.5 when planning your week.                 │    │
│  └───────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ Meeting Recovery Gap ───────────────────────┐    │
│  │ Confidence: 65%  (5 observations)            │    │
│  │                                               │    │
│  │ After meetings, it takes you ~18 minutes     │    │
│  │ to return to focused work.                   │    │
│  │                                               │    │
│  │ Suggestion: Schedule a 20-minute "re-entry"  │    │
│  │ block after meetings with a simple task.      │    │
│  └───────────────────────────────────────────────┘    │
│                                                      │
│  [View Full History] [Export Patterns]                │
└──────────────────────────────────────────────────────┘
```

---

## 14. Windows Testing Plan

### 14.1 Performance Tests

| Metric | Target | Test Method |
|--------|--------|-------------|
| App idle memory | < 200 MB | Windows Task Manager after 10 min idle |
| App active memory (with monitoring) | < 350 MB | Monitor during 1-hour work session |
| CPU usage (idle) | < 2% | Windows Task Manager |
| CPU usage (screenshot capture cycle) | < 15% spike for < 2s | Monitor during capture |
| Screenshot redaction latency | < 2 seconds per frame | Time from capture to storage |
| Face detection latency | < 1.5 seconds per frame | Benchmark with test images |
| Timelapse generation (30s video, 100 frames) | < 60 seconds | Time ffmpeg command |
| Local model startup time | < 30 seconds | Time from sidecar spawn to first response |
| Local model inference latency | < 5 seconds per response | Time a task decomposition request |

### 14.2 Privacy Tests

| Test | Expected |
|------|----------|
| Denied app is never captured | No file created, no database row |
| Denied domain is never stored as full URL | Only domain stored (e.g., `bank.com`) |
| Face blur works on test image | Facial region is blurred beyond recognition |
| Sensitive text regex redacts SSN, email, credit card | Black boxes or blur over matches |
| Purge removes database rows AND files | Database tables empty, screenshots dir empty |
| Screenshots are never sent to APIs | Network monitor shows zero screenshot data in API payloads |
| Logs do not contain API keys | Grep log files for key patterns, find zero matches |
| Encryption works end-to-end | Enable encryption, restart, verify data accessible; copy DB file to another machine, verify unreadable |

### 14.3 Installer Tests

| Test | Expected |
|------|----------|
| Fresh install on Windows 10 | App installs, launches, creates database |
| Fresh install on Windows 11 | Same as above |
| Upgrade install (v1 → v2) | Data preserved, migrations run |
| Uninstall | App removed, user data optionally preserved or deleted |
| Auto-start setting | App starts with Windows when enabled |
| Windows Defender | No false-positive warnings (may require signing) |
| App works after system reboot | Tray icon appears, data intact |
| WebView2 bootstrapper | On Windows 10 without WebView2, installer downloads it |

---

## 15. Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Screenshot capture fails on certain Windows versions | Medium | High | Test early on Win10 + Win11; implement graceful fallback to metadata-only mode |
| Face detection model too slow on low-end hardware | Medium | Medium | Make face detection optional; skip if latency > 3 seconds |
| FFmpeg bundling increases installer size > 100 MB | Medium | Low | Use minimal FFmpeg build (~30 MB); offer download on first use |
| Browser extension rejected by Chrome Web Store | Low | Medium | Distribute as unpacked extension via GitHub Releases; keep permissions minimal |
| Local LLM inference too slow on low-end hardware | Medium | High | Offer model size options (1.5B / 3B / 7B); default to API provider; show performance benchmark before download |
| OCR (Tesseract) crashes or hangs | Medium | Medium | Run OCR in isolated process with timeout; disable automatically on failure |
| SQLite performance under heavy logging | Low | Medium | Use WAL mode; batch-insert activity logs; archive data older than 90 days |
| llama.cpp sidecar fails to start | Low | High | Detect startup failure, show error, offer API provider fallback |
| Cross-platform screenshot APIs diverge | Medium | High | Use xcap with thin abstraction trait; test each platform early |

---

## 16. Deliverables

| Deliverable | Description |
|-------------|-------------|
| Screenshot capture service | Consent-based, per-window capture with configurable interval |
| Privacy redaction pipeline | Face blur, text redaction, full-frame blur for sensitive apps |
| Screenshot review gallery | Browse, inspect, and delete captured frames |
| Browser extension MVP | Chrome/Edge Manifest V3 extension with URL tracking |
| Distraction site blocking | Optional tab redirect during focus blocks |
| Pattern Detector v1 | Rule-based + statistical analysis of procrastination patterns |
| Pattern Insights UI | Human-readable summaries with actionable suggestions |
| Local AI sidecar | llama.cpp server with model download and management |
| LocalLlmProvider | Plugs into Phase 3's LlmProvider trait for seamless switching |
| Progress Timelapse | FFmpeg-powered 30-second video recap from blurred frames |
| Timelapse Player | Browse and play past daily recaps |
| Encrypted storage option | AES-256-GCM encryption for database and files |
| Production Privacy Dashboard | Full transparency of what's collected, stored, and shared |
| One-click data purge | Delete all data (DB + files + AI logs + model) |
| Production Windows installer | NSIS installer with auto-start and WebView2 bootstrapper |
| Auto-update mechanism | Check for updates on launch, download and install seamlessly |

---

## 17. Exit Criteria

| Criteria | Validation |
|----------|------------|
| Screenshots are opt-in and reviewable | Disabled by default; gallery UI shows all captured frames |
| Sensitive apps/domains are blocked before capture | Deny rules prevent both capture and persistence |
| Faces are blurred beyond recognition | Manual review of 20+ test screenshots |
| Pattern insights are useful without feeling punitive | User testing: 3+ testers find insights actionable |
| Timelapse uses only redacted frames | No unblurred content in generated MP4 |
| Local AI works as drop-in replacement for API | Same features work when switching from Anthropic to local model |
| Browser extension tracks URLs without full URL storage | Database contains only domains, not full URLs |
| Windows installer passes all installer tests | Fresh install, upgrade, uninstall, reboot all pass |
| App idle memory stays under 200 MB | Windows Task Manager verification |
| Full data purge removes everything | Database empty, files deleted, AI logs cleared |
| All Phase 1–3 features continue working | Full regression test pass |
| App is useful with all Phase 4 features disabled | Core task management + calendar + API AI still works |

---

## 18. Post-Phase 4: Future Considerations

These items are **out of scope** for Phase 4 but may be considered for future versions:

| Feature | Description |
|---------|-------------|
| Cross-platform builds (macOS, Linux) | Tauri supports these; platform-specific APIs need testing |
| Outlook Calendar sync | Extend calendar provider to Microsoft Graph API |
| Team / shared accountability | Optional peer matching for shared check-ins |
| Community "first draft" sharing | Anonymized peer proof viewer |
| Mobile companion app | React Native or Tauri Mobile for on-the-go task management |
| Plugin/extension system | Third-party intervention modules |
| Voice task capture | Local speech-to-text for hands-free task creation |
| Email integration | Parse emails into tasks (IMAP or Gmail API) |
| Keyboard-driven navigation | Vim-style keybindings for power users |
