use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: String,
    pub message: String,
}

impl CommandError {
    pub fn already_running() -> Self {
        Self {
            code: "already_running".to_string(),
            message: "An attack is already running".to_string(),
        }
    }

    pub fn io(message: &str) -> Self {
        Self {
            code: "io".to_string(),
            message: message.to_string(),
        }
    }

    pub fn device(message: &str) -> Self {
        Self {
            code: "device".to_string(),
            message: message.to_string(),
        }
    }
}
