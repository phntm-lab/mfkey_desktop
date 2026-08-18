#![allow(dead_code)]

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter, Manager};

use mfkey_flipper::FlipperSession;

use crate::commands::{AutoRequest, TransportKind};
use crate::error::CommandError;
use crate::events::{
    AUTO_ERROR, AUTO_STATUS, AutoErrorPayload, AutoStatusPayload, TRANSFER_PROGRESS,
    TransferProgressPayload,
};

const NFC_DIR: &str = "/ext/nfc";
const AUTO_DIR_PREFIX: &str = "auto-";

const PHASE_CONNECTING: &str = "connecting";
const PHASE_LISTING: &str = "listing";
const PHASE_DOWNLOADING: &str = "downloading";
const PHASE_DONE: &str = "done";
const PHASE_CANCELLED: &str = "cancelled";

struct DownloadedLogs {
    local: Vec<PathBuf>,
    remote: Vec<String>,
}

fn is_target_log(name: &str) -> bool {
    let lower = name.to_lowercase();
    lower.ends_with(".mfkey32.log") || lower.ends_with(".nested.log")
}

pub fn prepare_auto_dir(app: &AppHandle) -> Result<PathBuf, CommandError> {
    let base = app
        .path()
        .app_cache_dir()
        .map_err(|e| CommandError::io(&format!("Failed to resolve cache directory: {e}")))?;
    clean_stale_auto_dirs(&base);
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let dir = base.join(format!("{AUTO_DIR_PREFIX}{ts}"));
    std::fs::create_dir_all(&dir)
        .map_err(|e| CommandError::io(&format!("Failed to create data directory: {e}")))?;
    Ok(dir)
}

fn clean_stale_auto_dirs(base: &Path) {
    let Ok(entries) = std::fs::read_dir(base) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let is_auto_dir = path.is_dir()
            && path
                .file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| name.starts_with(AUTO_DIR_PREFIX));
        if is_auto_dir {
            let _ = std::fs::remove_dir_all(&path);
        }
    }
}

pub fn run_auto(app: AppHandle, cancel: Arc<AtomicBool>, request: AutoRequest, logs_dir: PathBuf) {
    if let Err(message) = run_auto_inner(&app, &cancel, &request, &logs_dir) {
        emit_auto_error(&app, "auto", &message);
    }
}

fn run_auto_inner(
    app: &AppHandle,
    cancel: &Arc<AtomicBool>,
    request: &AutoRequest,
    logs_dir: &Path,
) -> Result<(), String> {
    emit_status(app, PHASE_CONNECTING, None);
    let mut sess =
        open_session(request.transport, &request.device_id).map_err(|e| e.to_string())?;

    if cancel.load(Ordering::SeqCst) {
        emit_status(app, PHASE_CANCELLED, None);
        return Ok(());
    }

    emit_status(app, PHASE_LISTING, None);
    let logs = download_target_logs(app, cancel, &mut sess, logs_dir)?;

    if cancel.load(Ordering::SeqCst) {
        emit_status(app, PHASE_CANCELLED, None);
        return Ok(());
    }

    if logs.local.is_empty() {
        emit_status(app, PHASE_DONE, Some("no_logs"));
        return Ok(());
    }

    let _ = &logs.remote;
    emit_status(app, PHASE_DONE, None);
    Ok(())
}

fn open_session(transport: TransportKind, device_id: &str) -> mfkey_flipper::Result<FlipperSession> {
    match transport {
        TransportKind::Usb => FlipperSession::open(device_id),
        TransportKind::Ble => {
            let ble = mfkey_flipper::ble::connection::connect_ble_blocking(device_id)?;
            FlipperSession::from_transport(Box::new(ble))
        }
    }
}

fn download_target_logs(
    app: &AppHandle,
    cancel: &Arc<AtomicBool>,
    sess: &mut FlipperSession,
    logs_dir: &Path,
) -> Result<DownloadedLogs, String> {
    let entries = sess
        .storage_list(NFC_DIR)
        .map_err(|e| format!("cannot list {NFC_DIR}: {e}"))?;

    let targets: Vec<String> = entries
        .into_iter()
        .filter(|e| !e.is_dir && is_target_log(&e.name))
        .map(|e| e.name)
        .collect();

    let mut local = Vec::new();
    let mut remote = Vec::new();

    for name in &targets {
        if cancel.load(Ordering::SeqCst) {
            break;
        }
        emit_status(app, PHASE_DOWNLOADING, Some(name));

        let remote_path = format!("{NFC_DIR}/{name}");
        let data = sess
            .storage_read(&remote_path)
            .map_err(|e| format!("read {remote_path}: {e}"))?;

        let local_path = logs_dir.join(name);
        std::fs::write(&local_path, &data)
            .map_err(|e| format!("write {local_path:?}: {e}"))?;

        let len = data.len() as u64;
        emit_transfer(app, &remote_path, len, len, 100.0);

        local.push(local_path);
        remote.push(remote_path);
    }

    Ok(DownloadedLogs { local, remote })
}

fn emit_status(app: &AppHandle, phase: &str, message: Option<&str>) {
    let payload = AutoStatusPayload {
        phase: phase.to_string(),
        message: message.map(|s| s.to_string()),
    };
    let _ = app.emit(AUTO_STATUS, payload);
}

fn emit_auto_error(app: &AppHandle, code: &str, message: &str) {
    let payload = AutoErrorPayload {
        code: code.to_string(),
        message: message.to_string(),
    };
    let _ = app.emit(AUTO_ERROR, payload);
}

fn emit_transfer(app: &AppHandle, path: &str, transferred: u64, total: u64, percent: f32) {
    let payload = TransferProgressPayload {
        path: path.to_string(),
        transferred,
        total,
        percent: percent.clamp(0.0, 100.0),
    };
    let _ = app.emit(TRANSFER_PROGRESS, payload);
}
