use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use reqwest::blocking::Client;
use serde::Deserialize;
use chrono::NaiveDate;

use crate::db::Database;

// Google Calendar API response structures
#[derive(Debug, Deserialize)]
struct GoogleCalendarResponse {
    items: Vec<GoogleCalendarEvent>,
}

#[derive(Debug, Deserialize)]
struct GoogleCalendarEvent {
    id: String,
    summary: Option<String>,
    description: Option<String>,
    start: Option<GoogleEventTime>,
    end: Option<GoogleEventTime>,
    transparency: Option<String>,
    status: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoogleEventTime {
    date: Option<String>, // For all-day events
    date_time: Option<String>, // For timed events
}

#[derive(Debug, Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: u64,
}

const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API: &str = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

pub struct CalendarSyncService {
    app_handle: AppHandle,
    sync_interval: Duration,
}

impl CalendarSyncService {
    pub fn new(app_handle: AppHandle, sync_interval: Duration) -> Self {
        Self { app_handle, sync_interval }
    }

    pub fn start_periodic_sync(self) {
        thread::spawn(move || loop {
            thread::sleep(self.sync_interval);
            if let Err(e) = self.sync_all_accounts() {
                eprintln!("Calendar sync failed: {}", e);
            }
        });
    }

    fn sync_all_accounts(&self) -> Result<(), String> {
        let db = self.app_handle.state::<Database>();
        let accounts = db.list_calendar_accounts().map_err(|e| e.to_string())?;
        let enabled_accounts: Vec<_> = accounts.into_iter().filter(|acc| acc.sync_enabled).collect();

        for account in enabled_accounts {
            if let Err(e) = self.sync_account(&account, &db) {
                eprintln!("Failed to sync account {}: {}", account.email, e);
            }
        }

        Ok(())
    }

    fn sync_account(
        &self,
        account: &crate::models::CalendarAccount,
        db: &Database,
    ) -> Result<(), String> {
        let now = chrono::Utc::now();
        let time_min = now.format("%Y-%m-%dT00:00:00Z").to_string();
        let time_max = (now + chrono::Duration::days(14))
            .format("%Y-%m-%dT23:59:59Z")
            .to_string();

        let events = if account.provider == "google" {
            self.sync_google_calendar(account, &time_min, &time_max)?
        } else {
            vec![]
        };

        // Store or update events in database
        for event in events {
            db.upsert_calendar_event(event).map_err(|e| e.to_string())?;
        }

        // Update last_synced_at
        db.update_calendar_last_sync(account.id.clone()).map_err(|e| e.to_string())?;

        Ok(())
    }

    fn sync_google_calendar(
        &self,
        account: &crate::models::CalendarAccount,
        time_min: &str,
        time_max: &str,
    ) -> Result<Vec<crate::models::CalendarEvent>, String> {
        // Get refresh token from keyring
        let keyring_entry = keyring::Entry::new("flowforge-google-calendar", &account.email)
            .map_err(|e| format!("Failed to access keyring: {}", e))?;

        let refresh_token = keyring_entry
            .get_password()
            .map_err(|e| format!("Failed to get refresh token from keyring: {}", e))?;

        // Exchange refresh token for access token
        let access_token = self.refresh_google_token(&refresh_token)?;

        // Fetch events from Google Calendar API
        let client = Client::new();
        let response = client
            .get(&format!(
                "{}?timeMin={}&timeMax={}&singleEvents=true&orderBy=startTime",
                GOOGLE_CALENDAR_API, time_min, time_max
            ))
            .bearer_auth(&access_token)
            .header("Accept", "application/json")
            .send()
            .map_err(|e| format!("Failed to fetch calendar events: {}", e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Google Calendar API returned error: {} - {}",
                response.status(),
                response.text().unwrap_or_default()
            ));
        }

        let google_response: GoogleCalendarResponse = response
            .json()
            .map_err(|e| format!("Failed to parse calendar response: {}", e))?;

        // Convert Google events to our CalendarEvent format
        let events = google_response
            .items
            .into_iter()
            .filter_map(|google_event| {
                // Skip cancelled events
                if google_event.status.as_deref() == Some("cancelled") {
                    return None;
                }

                // Parse start and end times
                let starts_at = match (&google_event.start, &google_event.end) {
                    (Some(start), Some(_end)) => {
                        if let Some(dt) = &start.date_time {
                            dt.clone()
                        } else if let Some(d) = &start.date {
                            format!("{}T00:00:00Z", d) // All-day event
                        } else {
                            return None;
                        }
                    }
                    _ => return None,
                };

                let ends_at = match (&google_event.end, &google_event.start) {
                    (Some(end), Some(_start)) => {
                        if let Some(dt) = &end.date_time {
                            dt.clone()
                        } else if let Some(d) = &end.date {
                            // For all-day events, the end date is exclusive, so subtract 1 day
                            let end_date = NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()?;
                            let previous_day = end_date.pred_opt()?;
                            format!("{}T23:59:59Z", previous_day.format("%Y-%m-%d"))
                        } else {
                            return None;
                        }
                    }
                    _ => return None,
                };

                // Determine busy status based on transparency
                let busy_status = if google_event.transparency.as_deref() == Some("transparent") {
                    "free"
                } else {
                    "busy"
                };

                Some(crate::models::CalendarEvent {
                    id: uuid::Uuid::new_v4().to_string(),
                    provider_event_id: google_event.id,
                    account_id: account.id.clone(),
                    title: google_event.summary.unwrap_or_else(|| "(No title)".to_string()),
                    starts_at: starts_at,
                    ends_at: ends_at,
                    busy_status: busy_status.to_string(),
                    location: None, // Could be extracted from Google event location field
                    meeting_url: None, // Could be extracted from Google event hangoutLink field
                    source_updated_at: None,
                    local_updated_at: chrono::Utc::now().to_rfc3339(),
                })
            })
            .collect();

        Ok(events)
    }

    fn refresh_google_token(&self, refresh_token: &str) -> Result<String, String> {
        let client_id = std::env::var("GOOGLE_CLIENT_ID")
            .unwrap_or_else(|_| "398286636865-h5jp8j6m3qn26rpbq5c5op8hm9238.apps.googleusercontent.com".to_string());
        let client_secret = std::env::var("GOOGLE_CLIENT_SECRET")
            .unwrap_or_else(|_| "GOCSPX-".to_string());

        let client = Client::new();

        let params = [
            ("grant_type", "refresh_token"),
            ("client_id", &client_id),
            ("client_secret", &client_secret),
            ("refresh_token", refresh_token),
        ];

        let response = client
            .post(GOOGLE_TOKEN_URL)
            .form(&params)
            .send()
            .map_err(|e| format!("Failed to refresh token: {}", e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Token refresh failed: {} - {}",
                response.status(),
                response.text().unwrap_or_default()
            ));
        }

        let token_response: GoogleTokenResponse = response
            .json()
            .map_err(|e| format!("Failed to parse token response: {}", e))?;

        Ok(token_response.access_token)
    }
}
