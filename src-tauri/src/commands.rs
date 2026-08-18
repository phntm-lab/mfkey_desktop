#![allow(dead_code)]

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_dialog::DialogExt;

use mfkey_core::core::attack_runner::{self, FileAttackOutcome};
use mfkey_core::core::reporter::Reporter;

use crate::error::CommandError;
use crate::events::{
    ATTACK_ERROR, ATTACK_SUMMARY, AttackErrorPayload, AttackSummaryPayload, DEVICE_STATUS,
    DeviceStatusPayload, DictOutputPayload,
};
use crate::reporter::TauriReporter;

#[derive(Default)]
pub struct AttackControl {
    cancel: Arc<AtomicBool>,
    running: Arc<AtomicBool>,
}

#[derive(Default)]
pub struct AutoControl {
    cancel: Arc<AtomicBool>,
    running: Arc<AtomicBool>,
}

struct RunningGuard(Arc<AtomicBool>);

impl Drop for RunningGuard {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

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
    pub delete_logs_after: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectRequest {
    pub transport: TransportKind,
    pub device_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveKeysRequest {
    pub keys: Vec<String>,
    pub dict_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlipperDeviceInfo {
    pub id: String,
    pub name: String,
    pub transport: TransportKind,
}

#[tauri::command]
pub fn start_file_attack(
    app: AppHandle,
    state: State<AttackControl>,
    request: FileAttackRequest,
) -> Result<(), CommandError> {
    if state
        .running
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err(CommandError::already_running());
    }
    state.cancel.store(false, Ordering::SeqCst);

    let dict_dir = match prepare_dict_dir(&app) {
        Ok(dir) => dir,
        Err(e) => {
            state.running.store(false, Ordering::SeqCst);
            return Err(e);
        }
    };

    let cancel = Arc::clone(&state.cancel);
    let running = Arc::clone(&state.running);
    let path = request.path;

    std::thread::spawn(move || {
        let _guard = RunningGuard(running);
        let reporter: Arc<dyn Reporter> = Arc::new(TauriReporter::new(app.clone()));
        let dict_dir_str = dict_dir.to_string_lossy().to_string();

        match attack_runner::run_file_attack(&reporter, &cancel, &path, Some(&dict_dir_str)) {
            Ok(FileAttackOutcome::Ran(outcome)) => {
                let status = if cancel.load(Ordering::SeqCst) {
                    "cancelled"
                } else {
                    "success"
                };
                let dict_outputs = outcome
                    .dict_outputs
                    .iter()
                    .map(|d| DictOutputPayload {
                        uid: format!("0x{:08X}", d.uid),
                        path: d.path.clone(),
                        key_count: d.count as u64,
                    })
                    .collect();
                let payload = AttackSummaryPayload {
                    found_keys: outcome.found_keys.len() as u64,
                    candidate_keys: outcome.candidate_total_count as u64,
                    dict_outputs,
                    status: status.to_string(),
                };
                let _ = app.emit(ATTACK_SUMMARY, payload);
            }
            Ok(FileAttackOutcome::NoUsableNonces) => {
                emit_error(
                    &app,
                    "no_usable_nonces",
                    "No usable nonces found in the selected file",
                );
            }
            Err(e) => {
                emit_error(&app, "io", &format!("Failed to process file: {e}"));
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub fn cancel_attack(state: State<AttackControl>) -> Result<(), CommandError> {
    state.cancel.store(true, Ordering::SeqCst);
    Ok(())
}

const DICT_DIR_PREFIX: &str = "attack-";

fn prepare_dict_dir(app: &AppHandle) -> Result<PathBuf, CommandError> {
    let base = app
        .path()
        .app_cache_dir()
        .map_err(|e| CommandError::io(&format!("Failed to resolve cache directory: {e}")))?;
    clean_stale_dict_dirs(&base);
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let dir = base.join(format!("{DICT_DIR_PREFIX}{ts}"));
    std::fs::create_dir_all(&dir)
        .map_err(|e| CommandError::io(&format!("Failed to create output directory: {e}")))?;
    Ok(dir)
}

fn clean_stale_dict_dirs(base: &Path) {
    let Ok(entries) = std::fs::read_dir(base) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let is_dict_dir = path.is_dir()
            && path
                .file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| name.starts_with(DICT_DIR_PREFIX));
        if is_dict_dir {
            let _ = std::fs::remove_dir_all(&path);
        }
    }
}

fn emit_error(app: &AppHandle, code: &str, message: &str) {
    let payload = AttackErrorPayload {
        code: code.to_string(),
        message: message.to_string(),
    };
    let _ = app.emit(ATTACK_ERROR, payload);
}

#[tauri::command]
pub fn save_recovered_keys(
    app: AppHandle,
    request: SaveKeysRequest,
) -> Result<Option<String>, CommandError> {
    let destination = match app.dialog().file().blocking_pick_folder() {
        Some(folder) => match folder.into_path() {
            Ok(path) => path,
            Err(e) => return Err(CommandError::io(&format!("Invalid destination: {e}"))),
        },
        None => return Ok(None),
    };

    if !request.keys.is_empty() {
        let mut content = String::new();
        for key in &request.keys {
            content.push_str(key);
            content.push('\n');
        }
        std::fs::write(destination.join("recovered_keys.txt"), content)
            .map_err(|e| CommandError::io(&format!("Failed to write keys file: {e}")))?;
    }

    for dict_path in &request.dict_paths {
        let source = Path::new(dict_path);
        if let Some(name) = source.file_name() {
            std::fs::copy(source, destination.join(name)).map_err(|e| {
                CommandError::io(&format!("Failed to copy dictionary {dict_path}: {e}"))
            })?;
        }
    }

    Ok(Some(destination.to_string_lossy().into_owned()))
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
    let ports = mfkey_flipper::find::find_all_flippers()
        .map_err(|e| CommandError::device(&format!("Failed to enumerate USB ports: {e}")))?;
    Ok(ports
        .into_iter()
        .map(|p| FlipperDeviceInfo {
            id: p.port,
            name: p.label,
            transport: TransportKind::Usb,
        })
        .collect())
}

#[tauri::command]
pub fn scan_ble() -> Result<Vec<FlipperDeviceInfo>, CommandError> {
    let devices = mfkey_flipper::ble::scanner::list_ble_devices_blocking()
        .map_err(|e| CommandError::device(&format!("BLE scan failed: {e}")))?;
    Ok(devices
        .into_iter()
        .map(|d| FlipperDeviceInfo {
            id: d.id,
            name: d.name,
            transport: TransportKind::Ble,
        })
        .collect())
}

#[tauri::command]
pub fn connect_flipper(app: AppHandle, request: ConnectRequest) -> Result<(), CommandError> {
    let ConnectRequest {
        transport,
        device_id,
    } = request;

    emit_device_status(&app, "connecting", Some(&device_id), Some(transport), None);

    std::thread::spawn(move || match probe_device(transport, &device_id) {
        Ok(()) => emit_device_status(&app, "connected", Some(&device_id), Some(transport), None),
        Err(e) => emit_device_status(
            &app,
            "error",
            Some(&device_id),
            Some(transport),
            Some(&e.to_string()),
        ),
    });

    Ok(())
}

fn probe_device(transport: TransportKind, device_id: &str) -> mfkey_flipper::Result<()> {
    match transport {
        TransportKind::Usb => {
            mfkey_flipper::FlipperSession::open(device_id)?;
            Ok(())
        }
        TransportKind::Ble => {
            let ble = mfkey_flipper::ble::connection::connect_ble_blocking(device_id)?;
            mfkey_flipper::FlipperSession::from_transport(Box::new(ble))?;
            Ok(())
        }
    }
}

fn emit_device_status(
    app: &AppHandle,
    status: &str,
    device_id: Option<&str>,
    transport: Option<TransportKind>,
    message: Option<&str>,
) {
    let payload = DeviceStatusPayload {
        status: status.to_string(),
        device_id: device_id.map(|s| s.to_string()),
        transport,
        message: message.map(|s| s.to_string()),
    };
    let _ = app.emit(DEVICE_STATUS, payload);
}

#[tauri::command]
pub fn start_auto(
    app: AppHandle,
    state: State<AutoControl>,
    request: AutoRequest,
) -> Result<(), CommandError> {
    if state
        .running
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err(CommandError::already_running());
    }
    state.cancel.store(false, Ordering::SeqCst);

    let logs_dir = match crate::auto::prepare_auto_dir(&app) {
        Ok(dir) => dir,
        Err(e) => {
            state.running.store(false, Ordering::SeqCst);
            return Err(e);
        }
    };

    let cancel = Arc::clone(&state.cancel);
    let running = Arc::clone(&state.running);

    std::thread::spawn(move || {
        let _guard = RunningGuard(running);
        crate::auto::run_auto(app, cancel, request, logs_dir);
    });

    Ok(())
}

#[tauri::command]
pub fn cancel_auto(state: State<AutoControl>) -> Result<(), CommandError> {
    state.cancel.store(true, Ordering::SeqCst);
    Ok(())
}
