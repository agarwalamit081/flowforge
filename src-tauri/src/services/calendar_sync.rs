use std::time::Duration;
use std::thread;
use tauri::{AppHandle, Manager};

use crate::db::Database;

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
        // This would use the stored refresh token to get access token
        // and fetch events from Google Calendar API
        // For now, return empty vec as placeholder
        eprintln!("Would sync Google Calendar for {} from {} to {}", account.email, time_min, time_max);
        Ok(vec![])
    }
}
