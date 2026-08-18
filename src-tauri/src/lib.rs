mod auto;
mod commands;
mod error;
mod events;
mod reporter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .manage(commands::AttackControl::default())
        .manage(commands::AutoControl::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init());

    #[cfg(feature = "mcp-bridge")]
    let builder = builder.plugin(tauri_plugin_mcp_bridge::init());

    builder
        .invoke_handler(tauri::generate_handler![
            commands::start_file_attack,
            commands::cancel_attack,
            commands::pick_input_file,
            commands::save_recovered_keys,
            commands::list_flipper_usb,
            commands::scan_ble,
            commands::connect_flipper,
            commands::start_auto,
            commands::cancel_auto,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
