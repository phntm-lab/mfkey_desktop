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

    pub fn flipper_session(context: &str, err: &FlipperError) -> Self {
        Self {
            code: flipper_session_code(err).to_string(),
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

pub fn flipper_session_code(err: &FlipperError) -> &'static str {
    let base = flipper_code(err);
    if base == codes::IO || base == codes::DEVICE || base == codes::DEVICE_UNREACHABLE {
        codes::DEVICE_DISCONNECTED
    } else {
        base
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::ErrorKind;

    #[test]
    fn ble_hints_map_to_permission_codes() {
        assert_eq!(
            ble_code("Bluetooth appears to be off or not ready (0x800710DF)"),
            codes::BLUETOOTH_OFF
        );
        assert_eq!(
            ble_code("the Flipper is not paired — pair it first"),
            codes::NOT_PAIRED
        );
        assert_eq!(
            ble_code("no Bluetooth adapter was found on this system"),
            codes::NO_ADAPTER
        );
        assert_eq!(
            ble_code("access is denied (0x80070005)"),
            codes::ACCESS_DENIED
        );
    }

    #[test]
    fn unmatched_ble_error_is_generic_device() {
        assert_eq!(
            ble_code("BLE transport closed during write"),
            codes::DEVICE
        );
    }

    #[test]
    fn session_remaps_transport_failures_to_disconnected() {
        assert_eq!(
            flipper_session_code(&FlipperError::Ble("BLE transport closed during write".into())),
            codes::DEVICE_DISCONNECTED
        );
        assert_eq!(
            flipper_session_code(&FlipperError::Io(std::io::Error::from(ErrorKind::BrokenPipe))),
            codes::DEVICE_DISCONNECTED
        );
    }

    #[test]
    fn session_preserves_specific_codes() {
        assert_eq!(flipper_session_code(&FlipperError::Timeout), codes::TIMEOUT);
        assert_eq!(
            flipper_session_code(&FlipperError::Ble("the device is not paired".into())),
            codes::NOT_PAIRED
        );
        assert_eq!(
            flipper_session_code(&FlipperError::CommandStatus(3)),
            codes::PROTOCOL
        );
    }
}
