#![allow(dead_code)]

use serde::Serialize;

use crate::commands::TransportKind;

pub const ATTACK_PROGRESS: &str = "attack://progress";
pub const ATTACK_FOUND_KEY: &str = "attack://found-key";
pub const ATTACK_SUMMARY: &str = "attack://summary";
pub const ATTACK_HARDNESTED: &str = "attack://hardnested";
pub const ATTACK_ERROR: &str = "attack://error";
pub const DEVICE_STATUS: &str = "device://status";
pub const TRANSFER_PROGRESS: &str = "transfer://progress";
pub const AUTO_STATUS: &str = "auto://status";
pub const AUTO_SUMMARY: &str = "auto://summary";
pub const AUTO_ERROR: &str = "auto://error";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttackProgressPayload {
    pub stage: String,
    pub processed: u64,
    pub total: u64,
    pub percent: f32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundKeyPayload {
    pub key: String,
    pub uid: Option<String>,
    pub key_type: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DictOutputPayload {
    pub uid: String,
    pub path: String,
    pub key_count: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttackSummaryPayload {
    pub found_keys: u64,
    pub candidate_keys: u64,
    pub dict_outputs: Vec<DictOutputPayload>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HardNestedPayload {
    pub line: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStatusPayload {
    pub status: String,
    pub device_id: Option<String>,
    pub transport: Option<TransportKind>,
    pub code: Option<String>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferProgressPayload {
    pub path: String,
    pub transferred: u64,
    pub total: u64,
    pub percent: f32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoStatusPayload {
    pub phase: String,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoSummaryPayload {
    pub found_keys: u64,
    pub uploaded_dicts: u64,
    pub keys_added: u64,
    pub keys_uploaded: bool,
    pub logs_total: u64,
    pub logs_skipped: u64,
}
