#![allow(dead_code)]

use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Emitter};

use mfkey_core::core::model::MfClassicKey;
use mfkey_core::core::reporter::Reporter;

use crate::events::{
    ATTACK_ERROR, ATTACK_FOUND_KEY, ATTACK_HARDNESTED, ATTACK_PROGRESS, AttackErrorPayload,
    AttackProgressPayload, FoundKeyPayload, HardNestedPayload,
};

const PROGRESS_THROTTLE: Duration = Duration::from_millis(40);

const STAGE_LOADING: &str = "loading";
const STAGE_RUNNING: &str = "running";
const STAGE_HARDNESTED: &str = "hardnested";

pub struct TauriReporter {
    app: AppHandle,
    last_progress: Mutex<Instant>,
}

impl TauriReporter {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            last_progress: Mutex::new(Instant::now() - PROGRESS_THROTTLE),
        }
    }

    fn emit_progress(&self, stage: &str, processed: u64, total: u64, percent: f32) {
        let payload = AttackProgressPayload {
            stage: stage.to_string(),
            processed,
            total,
            percent: percent.clamp(0.0, 100.0),
        };
        let _ = self.app.emit(ATTACK_PROGRESS, payload);
    }

    fn reset_throttle(&self) {
        if let Ok(mut last) = self.last_progress.lock() {
            *last = Instant::now();
        }
    }

    fn throttle_ready(&self) -> bool {
        if let Ok(mut last) = self.last_progress.try_lock() {
            if last.elapsed() >= PROGRESS_THROTTLE {
                *last = Instant::now();
                return true;
            }
        }
        false
    }

    fn emit_found_key(&self, key: &MfClassicKey, uid: Option<String>, key_type: Option<String>) {
        let payload = FoundKeyPayload {
            key: key.to_hex(),
            uid,
            key_type,
        };
        let _ = self.app.emit(ATTACK_FOUND_KEY, payload);
    }
}

fn parse_hardnested_label(label: &str) -> (Option<String>, Option<String>) {
    let parts: Vec<&str> = label.split_whitespace().collect();
    let mut uid = None;
    let mut key_type = None;
    let mut i = 0;
    while i < parts.len() {
        match parts[i] {
            "UID" => {
                uid = parts.get(i + 1).map(|s| s.to_string());
                i += 2;
            }
            "key" => {
                key_type = parts.get(i + 1).map(|s| s.to_string());
                i += 2;
            }
            _ => i += 1,
        }
    }
    (uid, key_type)
}

fn compute_percent(processed: usize, total: usize, stage_progress: f32) -> f32 {
    if total == 0 {
        return 0.0;
    }
    ((processed as f32 + stage_progress) / total as f32) * 100.0
}

impl Reporter for TauriReporter {
    fn loading(&self, _file_path: &str) {
        self.reset_throttle();
        self.emit_progress(STAGE_LOADING, 0, 0, 0.0);
    }

    fn error(&self, msg: &str) {
        let payload = AttackErrorPayload {
            code: "internal".to_string(),
            message: msg.to_string(),
        };
        let _ = self.app.emit(ATTACK_ERROR, payload);
    }

    fn begin_progress(&self, total_nonces: usize) {
        self.reset_throttle();
        self.emit_progress(STAGE_RUNNING, 0, total_nonces as u64, 0.0);
    }

    fn update_progress(
        &self,
        nonce_current: usize,
        nonce_total: usize,
        _msb_current: usize,
        _msb_total: usize,
        stage_progress: f32,
        _uid: u32,
    ) {
        if !self.throttle_ready() {
            return;
        }
        let percent = compute_percent(nonce_current, nonce_total, stage_progress);
        self.emit_progress(
            STAGE_RUNNING,
            nonce_current as u64,
            nonce_total as u64,
            percent,
        );
    }

    fn found_key(&self, key: &MfClassicKey) {
        self.emit_found_key(key, None, None);
    }

    fn hardnested_begin(&self, index: usize, total: usize, _label: &str) {
        self.reset_throttle();
        let percent = if total == 0 {
            0.0
        } else {
            (index.saturating_sub(1) as f32 / total as f32) * 100.0
        };
        self.emit_progress(
            STAGE_HARDNESTED,
            index.saturating_sub(1) as u64,
            total as u64,
            percent,
        );
    }

    fn hardnested_line(&self, line: &str) {
        let payload = HardNestedPayload {
            line: line.to_string(),
        };
        let _ = self.app.emit(ATTACK_HARDNESTED, payload);
    }

    fn hardnested_result(&self, label: &str, key: Option<&MfClassicKey>) {
        if let Some(k) = key {
            let (uid, key_type) = parse_hardnested_label(label);
            self.emit_found_key(k, uid, key_type);
        }
    }
}
