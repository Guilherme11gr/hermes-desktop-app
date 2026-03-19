// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WebviewWindowBuilder, WebviewUrl};

/// Retorna a versão do app
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Cria a janela float (bolinha 60x60)
#[tauri::command]
async fn open_float_window(app: tauri::AppHandle) -> Result<(), String> {
    // Verifica se já existe
    if app.get_webview_window("float").is_some() {
        if let Some(float_window) = app.get_webview_window("float") {
            float_window.show().map_err(|e| e.to_string())?;
            float_window.set_focus().map_err(|e| e.to_string())?;
        }
        if let Some(main_window) = app.get_webview_window("main") {
            main_window.hide().map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    // Cria janela pequena (bolinha)
    let _float_window = WebviewWindowBuilder::new(
        &app,
        "float",
        WebviewUrl::App("index.html?mode=float".into())
    )
    .title("Hermes Float")
    .inner_size(60.0, 60.0)
    .min_inner_size(60.0, 60.0)
    .max_inner_size(500.0, 600.0)
    .decorations(false)
    .transparent(true)
    .shadow(false)
    .always_on_top(true)
    .visible(true)
    .resizable(false)
    .skip_taskbar(true)
    .build()
    .map_err(|e| e.to_string())?;

    // Esconde a janela principal
    if let Some(main_window) = app.get_webview_window("main") {
        main_window.hide().map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Fecha a janela float e mostra a principal
#[tauri::command]
async fn close_float_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(float_window) = app.get_webview_window("float") {
        float_window.close().map_err(|e| e.to_string())?;
    }

    if let Some(main_window) = app.get_webview_window("main") {
        main_window.show().map_err(|e| e.to_string())?;
        main_window.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Abre a janela principal (modo tela cheia)
#[tauri::command]
async fn open_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(float_window) = app.get_webview_window("float") {
        float_window.hide().map_err(|e| e.to_string())?;
    }
    if let Some(main_window) = app.get_webview_window("main") {
        main_window.show().map_err(|e| e.to_string())?;
        main_window.set_focus().map_err(|e| e.to_string())?;
        main_window.unminimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggle do modo float
#[tauri::command]
async fn toggle_float_mode(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(float_window) = app.get_webview_window("float") {
        if float_window.is_visible().map_err(|e| e.to_string())? {
            close_float_window(app).await?;
            return Ok(false);
        }
    }
    
    open_float_window(app).await?;
    Ok(true)
}

/// Verifica se está em modo float
#[tauri::command]
fn is_float_mode(app: tauri::AppHandle) -> bool {
    if let Some(float_window) = app.get_webview_window("float") {
        float_window.is_visible().unwrap_or(false)
    } else {
        false
    }
}

/// Redimensiona a janela float (bolinha <-> chat)
#[tauri::command]
async fn resize_float_window(app: tauri::AppHandle, expanded: bool) -> Result<(), String> {
    if let Some(float_window) = app.get_webview_window("float") {
        if expanded {
            float_window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 420, height: 520 })).map_err(|e| e.to_string())?;
            float_window.set_resizable(true).map_err(|e| e.to_string())?;
        } else {
            float_window.set_resizable(false).map_err(|e| e.to_string())?;
            float_window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 60, height: 60 })).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            open_float_window,
            close_float_window,
            open_main_window,
            toggle_float_mode,
            is_float_mode,
            resize_float_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
