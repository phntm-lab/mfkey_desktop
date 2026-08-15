#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::error::CommandError;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransportKind {
    Usb,
    Ble,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileAttackRequest {
    pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoRequest {
    pub transport: TransportKind,
    pub device_id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlipperDeviceInfo {
    pub id: String,
    pub name: String,
    pub transport: TransportKind,
}

#[tauri::command]
pub fn start_file_attack(request: FileAttackRequest) -> Result<(), CommandError> {
    let _ = request;
    Err(CommandError::not_implemented("start_file_attack"))
}

#[tauri::command]
pub fn cancel_attack() -> Result<(), CommandError> {
    Err(CommandError::not_implemented("cancel_attack"))
}

#[tauri::command]
pub fn pick_input_file(app: AppHandle) -> Result<Option<String>, CommandError> {
    let picked = app
        .dialog()
        .file()
        .add_filter("Nonce logs", &["log"])
        .blocking_pick_file();

    Ok(picked
        .and_then(|file| file.into_path().ok())
        .map(|path| path.to_string_lossy().into_owned()))
}

#[tauri::command]
pub fn list_flipper_usb() -> Result<Vec<FlipperDeviceInfo>, CommandError> {
    Err(CommandError::not_implemented("list_flipper_usb"))
}

#[tauri::command]
pub fn scan_ble() -> Result<Vec<FlipperDeviceInfo>, CommandError> {
    Err(CommandError::not_implemented("scan_ble"))
}

#[tauri::command]
pub fn start_auto(request: AutoRequest) -> Result<(), CommandError> {
    let _ = request;
    Err(CommandError::not_implemented("start_auto"))
}
