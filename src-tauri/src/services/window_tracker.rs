use std::time::Duration;
use std::thread;
use tauri::{AppHandle, Manager};

use crate::db::Database;
use crate::models::{ActivitySegment, MonitoringRule};

#[cfg(target_os = "windows")]
use windows::{
    core::*,
    Win32::Foundation::*,
    Win32::System::ProcessStatus::*,
    Win32::System::Threading::*,
    Win32::UI::WindowsAndMessaging::*,
};

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
        unsafe {
            // Get the foreground window handle
            let hwnd = GetForegroundWindow();

            if hwnd.is_invalid() {
                return WindowInfo {
                    app_name: None,
                    process_name: None,
                    window_title: None,
                    domain: None,
                };
            }

            // Get the window title
            let mut title_buffer = [0u16; 512];
            let length = GetWindowTextW(hwnd, &mut title_buffer);
            let window_title = if length > 0 {
                let title_str = String::from_utf16_lossy(&title_buffer[..length as usize]);
                Some(title_str)
            } else {
                None
            };

            // Get the process ID for the window
            let mut process_id: u32 = 0;
            GetWindowThreadProcessId(hwnd, &mut process_id as *mut u32);

            // Open the process to get its name
            let app_name = if process_id != 0 {
                match OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, process_id) {
                    Ok(handle) if !handle.is_invalid() => {
                        let mut name_buffer = [0u16; 260];
                        let mut size = name_buffer.len() as u32;
                        let result = QueryFullProcessImageNameW(
                            handle,
                            PROCESS_NAME_WIN32,
                            PWSTR(name_buffer.as_mut_ptr()),
                            &mut size,
                        );

                        let _ = CloseHandle(handle);

                        if result.is_ok() && size > 0 {
                            let path = String::from_utf16_lossy(&name_buffer[..size as usize]);
                            // Extract just the filename from the path
                            Some(
                                path.split('\\')
                                    .last()
                                    .unwrap_or(&path)
                                    .to_string(),
                            )
                        } else {
                            // Fallback to trying to get the module name
                            let mut name_buffer = [0u16; 260];
                            let mut size = name_buffer.len() as u32;
                            if GetModuleBaseNameW(
                                handle,
                                HMODULE::default(),
                                &mut name_buffer,
                                size,
                            ) > 0
                            {
                                let name =
                                    String::from_utf16_lossy(&name_buffer[..name_buffer.iter()
                                        .position(|&c| c == 0)
                                        .unwrap_or(name_buffer.len())]);
                                Some(name)
                            } else {
                                Some(format!("Process_{}", process_id))
                            }
                        }
                    }
                    _ => Some(format!("Process_{}", process_id)),
                }
            } else {
                None
            };

            // Extract domain from window title if it looks like a browser URL
            let domain = window_title.as_ref().and_then(|title| {
                // Look for browser URL patterns
                if title.contains(" - ") {
                    let parts: Vec<&str> = title.split(" - ").collect();
                    if parts.len() >= 2 {
                        let potential_url = parts.last().unwrap_or("");
                        if potential_url.starts_with("http://") || potential_url.starts_with("https://") {
                            if let Ok(parsed) = url::Url::parse(potential_url) {
                                return parsed.host_str().map(|h| h.to_string());
                            }
                        }
                    }
                }
                None
            });

            WindowInfo {
                app_name: app_name.clone(),
                process_name: app_name,
                window_title,
                domain,
            }
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
