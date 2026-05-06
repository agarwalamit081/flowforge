use std::time::Duration;
use std::thread;
use tauri::{AppHandle, Manager};

use crate::db::Database;
use crate::models::{ActivitySegment, MonitoringRule};

enum PrivacyState {
    Allowed,
    RedactedTitle,
    Denied,
}

pub struct WindowTracker {
    app_handle: AppHandle,
    poll_interval: Duration,
}

impl WindowTracker {
    pub fn new(app_handle: AppHandle, poll_interval: Duration) -> Self {
        Self { app_handle, poll_interval }
    }

    pub fn start_tracking(self) {
        thread::spawn(move || {
            let mut last_window_info: Option<WindowInfo> = None;
            let mut segment_start_time: Option<chrono::DateTime<chrono::Utc>> = None;

            loop {
                thread::sleep(self.poll_interval);

                // Get current window information
                let current_window_info = self.get_active_window();

                // Check privacy rules
                let privacy_state = self.apply_privacy_rules(&current_window_info);

                // Detect window changes
                let window_changed = last_window_info.as_ref().map_or(true, |last| {
                    last.app_name != current_window_info.app_name || last.window_title != current_window_info.window_title
                });

                if window_changed {
                    // End previous activity segment if exists
                    if let (Some(last), Some(start)) = (last_window_info, segment_start_time) {
                        self.record_activity_segment(last, start, privacy_state);
                    }

                    // Start new segment
                    segment_start_time = Some(chrono::Utc::now());
                    last_window_info = Some(current_window_info);
                }
            }
        });
    }

    #[cfg(target_os = "windows")]
    fn get_active_window(&self) -> WindowInfo {
        // Windows-specific implementation using Win32 APIs
        // This would use GetForegroundWindow, GetWindowText, etc.
        // For now, return a placeholder
        WindowInfo {
            app_name: Some("unknown".to_string()),
            process_name: Some("unknown".to_string()),
            window_title: None, // Will be redacted based on privacy rules
            domain: None,
        }
    }

    #[cfg(target_os = "linux")]
    fn get_active_window(&self) -> WindowInfo {
        // Linux implementation using x11 or wayland
        // For now, return a placeholder
        WindowInfo {
            app_name: Some("unknown".to_string()),
            process_name: Some("unknown".to_string()),
            window_title: None,
            domain: None,
        }
    }

    #[cfg(target_os = "macos")]
    fn get_active_window(&self) -> WindowInfo {
        // macOS implementation using NSWorkspace
        // For now, return a placeholder
        WindowInfo {
            app_name: Some("unknown".to_string()),
            process_name: Some("unknown".to_string()),
            window_title: None,
            domain: None,
        }
    }

    fn apply_privacy_rules(&self, window_info: &WindowInfo) -> PrivacyState {
        let db = self.app_handle.state::<Database>();
        let rules = db.list_monitoring_rules().unwrap_or_default();

        // Check each rule against window info
        for rule in rules {
            if rule.action == "deny" {
                if self.rule_matches(&rule, window_info) {
                    return PrivacyState::Denied;
                }
            } else if rule.action == "redact_title" {
                if self.rule_matches(&rule, window_info) {
                    return PrivacyState::RedactedTitle;
                }
            }
        }

        PrivacyState::Allowed
    }

    fn rule_matches(&self, rule: &MonitoringRule, window_info: &WindowInfo) -> bool {
        // Simple pattern matching - can be enhanced with regex
        let pattern = &rule.pattern.to_lowercase();
        let app_name = window_info.app_name.as_ref().map(|s| s.to_lowercase()).unwrap_or_default();
        let window_title = window_info.window_title.as_ref().map(|s| s.to_lowercase()).unwrap_or_default();

        app_name.contains(pattern) || window_title.contains(pattern)
    }

    fn record_activity_segment(&self, window_info: WindowInfo, start: chrono::DateTime<chrono::Utc>, privacy_state: PrivacyState) {
        let end = chrono::Utc::now();
        let duration_seconds = (end - start).num_seconds().max(0) as i64;

        if duration_seconds < 5 {
            // Skip very short segments
            return;
        }

        let segment = ActivitySegment {
            id: uuid::Uuid::new_v4().to_string(),
            app_name: window_info.app_name,
            process_name: window_info.process_name,
            window_title_redacted: if matches!(privacy_state, PrivacyState::RedactedTitle) {
                Some("[REDACTED]".to_string())
            } else {
                window_info.window_title
            },
            domain: window_info.domain,
            started_at: start.to_rfc3339(),
            ended_at: end.to_rfc3339(),
            duration_seconds,
            privacy_state: match privacy_state {
                PrivacyState::Allowed => "allowed".to_string(),
                PrivacyState::RedactedTitle => "redacted_title".to_string(),
                PrivacyState::Denied => "denied".to_string(),
            },
            linked_focus_session_id: None,
        };

        // Store segment in database
        let db = self.app_handle.state::<Database>();
        if let Err(e) = db.record_activity_segment(segment) {
            eprintln!("Failed to record activity segment: {}", e);
        }
    }
}

#[derive(Debug, Clone)]
pub struct WindowInfo {
    pub app_name: Option<String>,
    pub process_name: Option<String>,
    pub window_title: Option<String>,
    pub domain: Option<String>,
}
