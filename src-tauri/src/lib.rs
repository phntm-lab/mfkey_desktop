mod commands;
mod error;
mod events;
mod reporter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(commands::AttackControl::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::start_file_attack,
            commands::cancel_attack,
            commands::pick_input_file,
            commands::save_recovered_keys,
            commands::list_flipper_usb,
            commands::scan_ble,
            commands::start_auto,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
