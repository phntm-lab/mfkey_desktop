#![allow(dead_code)]

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter, Manager};

use mfkey_core::core::attack_runner::{self, FileAttackOutcome};
use mfkey_core::core::keys::{merge_key_sets, parse_key_lines};
use mfkey_core::core::reporter::Reporter;
use mfkey_flipper::FlipperSession;

use crate::commands::{AutoRequest, TransportKind};
use crate::error::CommandError;
use crate::events::{
    AUTO_ERROR, AUTO_STATUS, AUTO_SUMMARY, AutoStatusPayload, AutoSummaryPayload, TRANSFER_PROGRESS,
    TransferProgressPayload,
};
use crate::reporter::TauriReporter;

const NFC_DIR: &str = "/ext/nfc";
const ASSETS_DIR: &str = "/ext/nfc/assets";
const RESULT_REMOTE_NAME: &str = "mf_classic_dict_user.nfc";
const AUTO_DIR_PREFIX: &str = "auto-";

const PHASE_CONNECTING: &str = "connecting";
const PHASE_LISTING: &str = "listing";
const PHASE_DOWNLOADING: &str = "downloading";
const PHASE_ATTACKING: &str = "attacking";
const PHASE_UPLOADING: &str = "uploading";
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
    if let Err(error) = run_auto_inner(&app, &cancel, &request, &logs_dir) {
        emit_auto_error(&app, &error);
    }
}

fn run_auto_inner(
    app: &AppHandle,
    cancel: &Arc<AtomicBool>,
    request: &AutoRequest,
    logs_dir: &Path,
) -> Result<(), CommandError> {
    emit_status(app, PHASE_CONNECTING, None);
    let mut sess = open_session(request.transport, &request.device_id)
        .map_err(|e| CommandError::flipper("connect to Flipper", &e))?;

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

    emit_status(app, PHASE_ATTACKING, None);
    let (all_keys, local_dicts) = run_attacks_over_logs(app, cancel, &logs.local, logs_dir);

    if cancel.load(Ordering::SeqCst) {
        emit_status(app, PHASE_CANCELLED, None);
        return Ok(());
    }

    emit_status(app, PHASE_UPLOADING, None);
    let uploaded_dicts = upload_dicts(app, &mut sess, &local_dicts);
    let (keys_added, keys_uploaded) =
        merge_and_upload_keys(app, &mut sess, &all_keys, logs_dir)?;

    if request.delete_logs_after && !all_keys.is_empty() {
        delete_remote_logs(&mut sess, &logs.remote);
    }

    emit_summary(
        app,
        all_keys.len() as u64,
        uploaded_dicts,
        keys_added,
        keys_uploaded,
    );
    emit_status(app, PHASE_DONE, None);
    Ok(())
}

fn run_attacks_over_logs(
    app: &AppHandle,
    cancel: &Arc<AtomicBool>,
    logs: &[PathBuf],
    logs_dir: &Path,
) -> (BTreeSet<String>, Vec<PathBuf>) {
    let mut all_keys: BTreeSet<String> = BTreeSet::new();
    let mut local_dicts: Vec<PathBuf> = Vec::new();

    let reporter: Arc<dyn Reporter> = Arc::new(TauriReporter::new(app.clone()));
    let dict_dir = logs_dir.to_string_lossy().to_string();

    for log in logs {
        if cancel.load(Ordering::SeqCst) {
            break;
        }

        let log_str = log.to_string_lossy().to_string();
        let outcome =
            match attack_runner::run_file_attack(&reporter, cancel, &log_str, Some(&dict_dir)) {
                Ok(o) => o,
                Err(_) => continue,
            };

        let result = match outcome {
            FileAttackOutcome::NoUsableNonces => continue,
            FileAttackOutcome::Ran(r) => r,
        };

        for k in &result.found_keys {
            all_keys.insert(k.to_hex().to_uppercase());
        }
        for d in &result.dict_outputs {
            local_dicts.push(PathBuf::from(&d.path));
        }
    }

    (all_keys, local_dicts)
}

fn upload_dicts(app: &AppHandle, sess: &mut FlipperSession, local_dicts: &[PathBuf]) -> u64 {
    if local_dicts.is_empty() {
        return 0;
    }

    let mut dicts = local_dicts.to_vec();
    dicts.sort();
    dicts.dedup();

    let mut uploaded = 0u64;
    for dict_path in &dicts {
        let Some(file_name) = dict_path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        let Ok(data) = std::fs::read(dict_path) else {
            continue;
        };

        let remote_dict = format!("{ASSETS_DIR}/{file_name}");
        let res = sess.upload_file(&remote_dict, &data, |sent, total| {
            emit_transfer(
                app,
                &remote_dict,
                sent as u64,
                total as u64,
                transfer_percent(sent, total),
            );
        });
        if res.is_ok() {
            uploaded += 1;
        }
    }

    uploaded
}

fn merge_and_upload_keys(
    app: &AppHandle,
    sess: &mut FlipperSession,
    all_keys: &BTreeSet<String>,
    logs_dir: &Path,
) -> Result<(u64, bool), CommandError> {
    if all_keys.is_empty() {
        return Ok((0, false));
    }

    let result_path = logs_dir.join(RESULT_REMOTE_NAME);
    let mut local_body = all_keys.iter().cloned().collect::<Vec<_>>().join("\n");
    local_body.push('\n');
    std::fs::write(&result_path, local_body.as_bytes())
        .map_err(|e| CommandError::io(&format!("write {result_path:?}: {e}")))?;

    let remote_out = format!("{ASSETS_DIR}/{RESULT_REMOTE_NAME}");

    let existing = sess.storage_read(&remote_out).ok().filter(|d| !d.is_empty());
    let had_existing = existing.is_some();
    let existing_keys = existing.as_deref().map(parse_key_lines).unwrap_or_default();
    let (added, final_keys) = merge_key_sets(&existing_keys, all_keys);

    if had_existing && added == 0 {
        return Ok((0, false));
    }

    let mut body = final_keys.into_iter().collect::<Vec<_>>().join("\n");
    body.push('\n');
    let upload = body.into_bytes();

    let _ = std::fs::write(&result_path, &upload);

    sess.upload_file(&remote_out, &upload, |sent, total| {
        emit_transfer(
            app,
            &remote_out,
            sent as u64,
            total as u64,
            transfer_percent(sent, total),
        );
    })
    .map_err(|e| CommandError::flipper(&format!("upload {remote_out}"), &e))?;

    Ok((added as u64, true))
}

fn delete_remote_logs(sess: &mut FlipperSession, remote_logs: &[String]) {
    for remote in remote_logs {
        let _ = sess.storage_delete(remote, false);
    }
}

fn transfer_percent(sent: usize, total: usize) -> f32 {
    if total == 0 {
        100.0
    } else {
        (sent as f32 / total as f32) * 100.0
    }
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
) -> Result<DownloadedLogs, CommandError> {
    let entries = sess
        .storage_list(NFC_DIR)
        .map_err(|e| CommandError::flipper(&format!("list {NFC_DIR}"), &e))?;

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
            .map_err(|e| CommandError::flipper(&format!("read {remote_path}"), &e))?;

        let local_path = logs_dir.join(name);
        std::fs::write(&local_path, &data)
            .map_err(|e| CommandError::io(&format!("write {local_path:?}: {e}")))?;

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

fn emit_summary(
    app: &AppHandle,
    found_keys: u64,
    uploaded_dicts: u64,
    keys_added: u64,
    keys_uploaded: bool,
) {
    let payload = AutoSummaryPayload {
        found_keys,
        uploaded_dicts,
        keys_added,
        keys_uploaded,
    };
    let _ = app.emit(AUTO_SUMMARY, payload);
}

fn emit_auto_error(app: &AppHandle, error: &CommandError) {
    let _ = app.emit(AUTO_ERROR, error);
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
