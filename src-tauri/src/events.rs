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
pub struct AttackErrorPayload {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStatusPayload {
    pub status: String,
    pub device_id: Option<String>,
    pub transport: Option<TransportKind>,
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
