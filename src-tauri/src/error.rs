#![allow(dead_code)]

use serde::Serialize;

use mfkey_flipper::FlipperError;

pub mod codes {
    pub const ALREADY_RUNNING: &str = "already_running";
    pub const IO: &str = "io";
    pub const PARSE: &str = "parse";
    pub const NO_USABLE_NONCES: &str = "no_usable_nonces";
    pub const NO_LOGS: &str = "no_logs";
    pub const INTERNAL: &str = "internal";
    pub const CANCELLED: &str = "cancelled";
    pub const TIMEOUT: &str = "timeout";
    pub const PROTOCOL: &str = "protocol";
    pub const DEVICE: &str = "device";
    pub const DEVICE_UNREACHABLE: &str = "device_unreachable";
    pub const DEVICE_DISCONNECTED: &str = "device_disconnected";
    pub const BLUETOOTH_OFF: &str = "bluetooth_off";
    pub const NOT_PAIRED: &str = "not_paired";
    pub const NO_ADAPTER: &str = "no_adapter";
    pub const ACCESS_DENIED: &str = "access_denied";
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: String,
    pub message: String,
}

impl CommandError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
        }
    }

    pub fn already_running() -> Self {
        Self::new(codes::ALREADY_RUNNING, "An attack is already running")
    }

    pub fn io(message: &str) -> Self {
        Self::new(codes::IO, message)
    }

    pub fn internal(message: &str) -> Self {
        Self::new(codes::INTERNAL, message)
    }

    pub fn device(message: &str) -> Self {
        Self::new(codes::DEVICE, message)
    }

    pub fn flipper(context: &str, err: &FlipperError) -> Self {
        Self {
            code: flipper_code(err).to_string(),
            message: format!("{context}: {err}"),
        }
    }
}

impl From<FlipperError> for CommandError {
    fn from(err: FlipperError) -> Self {
        Self {
            code: flipper_code(&err).to_string(),
            message: err.to_string(),
        }
    }
}

pub fn flipper_code(err: &FlipperError) -> &'static str {
    match err {
        FlipperError::Io(_) => codes::IO,
        FlipperError::Serial(_) => codes::DEVICE_UNREACHABLE,
        FlipperError::Decode(_) | FlipperError::Encode(_) => codes::PROTOCOL,
        FlipperError::CommandStatus(_) => codes::PROTOCOL,
        FlipperError::Timeout => codes::TIMEOUT,
        FlipperError::Protocol(_) => codes::PROTOCOL,
        FlipperError::Ble(message) => ble_code(message),
    }
}

fn ble_code(message: &str) -> &'static str {
    let lower = message.to_lowercase();
    if lower.contains("0x800710df")
        || lower.contains("not ready")
        || lower.contains("bluetooth appears to be off")
    {
        codes::BLUETOOTH_OFF
    } else if lower.contains("not paired")
        || lower.contains("pairing")
        || lower.contains("authentication")
        || lower.contains("0x800700b7")
    {
        codes::NOT_PAIRED
    } else if lower.contains("no ble adapter")
        || lower.contains("no adapter")
        || lower.contains("no bluetooth adapter")
    {
        codes::NO_ADAPTER
    } else if lower.contains("access is denied")
        || lower.contains("access denied")
        || lower.contains("0x80070005")
    {
        codes::ACCESS_DENIED
    } else {
        codes::DEVICE
    }
}
