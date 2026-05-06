mod commands;
mod db;
mod models;
mod services;

use std::fs;

use commands::*;
use db::Database;
use tauri::{
    menu::MenuBuilder,
    tray::TrayIconBuilder,
    Manager, WebviewWindowBuilder,
};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("flowforge.sqlite3");
            let default_ai_provider =
                std::env::var("FLOWFORGE_DEFAULT_AI_PROVIDER").unwrap_or_else(|_| "openai".to_string());
            let default_ai_model =
                std::env::var("FLOWFORGE_DEFAULT_MODEL").unwrap_or_else(|_| "gpt-4.1-mini".to_string());
            app.manage(Database::new(&db_path, default_ai_provider, default_ai_model)?);

            let _window = if app.get_webview_window("main").is_some() {
                app.get_webview_window("main").unwrap()
            } else {
                WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("index.html".into()))
                    .title("FlowForge")
                    .build()?
            };

            let tray_menu = MenuBuilder::new(app)
                .text("open", "Open FlowForge")
                .separator()
                .text("quit", "Quit")
                .build()?;

            TrayIconBuilder::new()
                .menu(&tray_menu)
                .tooltip("FlowForge")
                .icon(
                    app.default_window_icon()
                        .cloned()
                        .expect("default window icon available"),
                )
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_task,
            get_task,
            list_tasks,
            update_task,
            delete_task,
            update_task_status,
            create_micro_task,
            complete_micro_task,
            reorder_micro_tasks,
            create_project,
            list_projects,
            archive_project,
            list_today_agenda,
            create_daily_outcome,
            run_morning_briefing,
            start_focus_session,
            end_focus_session,
            record_stuck_event,
            export_user_data,
            purge_user_data,
            get_app_settings,
            update_app_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running FlowForge");
}
