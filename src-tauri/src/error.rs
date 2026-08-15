use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: String,
    pub message: String,
}

impl CommandError {
    pub fn not_implemented(command: &str) -> Self {
        Self {
            code: "not_implemented".to_string(),
            message: format!("Command '{command}' is not implemented yet"),
        }
    }

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
}
