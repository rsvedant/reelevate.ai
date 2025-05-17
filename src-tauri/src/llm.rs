use anyhow::Result;
use llm::{Model, ModelParameters};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::State;
use tokio::sync::RwLock;
use tokio::task;
use std::io::Write;
use std::fmt;
use rand::thread_rng;
use std::error::Error as StdError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LlmModel {
    name: String,
    size_mb: u32,
    url: String,
    description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Default)]
pub struct LlmState {
    model: Option<Arc<RwLock<Box<dyn Model>>>>,
    model_path: Option<PathBuf>,
}

impl fmt::Debug for LlmState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("LlmState")
            .field("model_path", &self.model_path)
            .field("model", &self.model.as_ref().map(|_| "Some(Model Arc<RwLock>)"))
            .finish()
    }
}

impl LlmState {
    fn new() -> Self {
        Self {
            model: None,
            model_path: None,
        }
    }
}

pub struct AppState {
    pub llm: Arc<Mutex<LlmState>>,
}

#[tauri::command]
pub async fn get_models() -> Result<Vec<LlmModel>, String> {
    // hardcoded a couple popular models, TODO: add custom model fetching from repos
    Ok(vec![
        LlmModel {
            name: "Llama-2-7B-Chat-GGUF".to_string(),
            size_mb: 3800,
            url: "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf".to_string(),
            description: "Llama 2 7B Chat model - good balance of size and quality".to_string(),
        },
        LlmModel {
            name: "TinyLlama-1.1B-Chat-v1.0-GGUF".to_string(),
            size_mb: 700,
            url: "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf".to_string(),
            description: "TinyLlama 1.1B Chat model - extremely fast, smaller model".to_string(),
        },
    ])
}

#[tauri::command]
pub async fn download_model(model_info: LlmModel, app_state: State<'_, Arc<Mutex<AppState>>>) -> Result<String, String> {
    let models_dir = std::env::current_dir()
        .map_err(|e| e.to_string())?
        .join("models");
    
    // Create models directory if it doesn't exist
    if !models_dir.exists() {
        std::fs::create_dir_all(&models_dir).map_err(|e| e.to_string())?;
    }
    
    let model_path = models_dir.join(format!("{}.gguf", model_info.name));
    
    // Check if model already exists
    if model_path.exists() {
        // Update the model path in state - avoid nested locks
        let llm_state = &app_state.llm;  // Immutably borrow the Arc<Mutex<LlmState>>
        let mut llm_state_guard = llm_state.lock().map_err(|e| e.to_string())?;
        llm_state_guard.model_path = Some(model_path.clone());
        
        return Ok(format!("Model {} already exists", model_info.name));
    }
    
    // Download the model
    let client = reqwest::Client::new();
    let mut response = client.get(&model_info.url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    if !response.status().is_success() {
        return Err(format!("Failed to download model: HTTP {}", response.status()));
    }
    
    let _total_size = response.content_length().unwrap_or(0);
    let mut file = std::fs::File::create(&model_path).map_err(|e| e.to_string())?;
    
    // Download the file in chunks
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        file.write_all(&chunk).map_err(|e| e.to_string())?;
    }
    
    // Update the model path in state - avoid nested locks
    let llm_state = &app_state.llm;  // Immutably borrow the Arc<Mutex<LlmState>>
    let mut llm_state_guard = llm_state.lock().map_err(|e| e.to_string())?;
    llm_state_guard.model_path = Some(model_path);
    
    Ok(format!("Successfully downloaded model {}", model_info.name))
}

#[tauri::command]
pub async fn chat(
    messages: Vec<ChatMessage>,
    app_state: State<'_, Arc<Mutex<AppState>>>
) -> Result<String, String> {
    let llm_state_arc = {
        let app_state_guard = app_state.lock().map_err(|e| e.to_string())?;
        app_state_guard.llm.clone()
    };
    
    let model_path = {
        let llm_state_guard = llm_state_arc.lock().map_err(|e| e.to_string())?;
        match &llm_state_guard.model_path {
            Some(path) => path.clone(),
            None => return Err("No model has been downloaded yet".to_string()),
        }
    };
    
    let model_arc_for_inference = {
        // Check if model exists first
        let has_model = {
            let llm_state_guard = llm_state_arc.lock().map_err(|e| e.to_string())?;
            llm_state_guard.model.is_some()
        };
        
        if has_model {
            // Get a clone of the model
            let model = {
                let llm_state_guard = llm_state_arc.lock().map_err(|e| e.to_string())?;
                llm_state_guard.model.as_ref().unwrap().clone()
            };
            model
        } else {
            // Load the model
            let model_path_clone = model_path.clone();
            let loaded_model = task::spawn_blocking(move || -> Result<Arc<RwLock<Box<dyn Model>>>, String> {
                let params = ModelParameters {
                    n_context_tokens: 2048,
                    ..Default::default()
                };
                
                let model_instance = llm::load_dynamic(
                    llm::ModelArchitecture::Llama,
                    &model_path_clone,
                    params,
                    |_progress| {}, // Simple no-op progress callback
                )
                .map_err(|e| e.to_string())?;
                
                Ok(Arc::new(RwLock::new(model_instance)))
            })
            .await
            .map_err(|e| format!("Task join error: {}", e))?
            .map_err(|e| e)?;
            
            // Update the model in state
            {
                let mut llm_state_guard = llm_state_arc.lock().map_err(|e| e.to_string())?;
                llm_state_guard.model = Some(loaded_model.clone());
            }
            
            loaded_model
        }
    };
    
    // Prepare conversation history
    let mut history = String::new();
    for message in &messages {
        match message.role.as_str() {
            "user" => history.push_str(&format!("User: {}\n", message.content)),
            "assistant" => history.push_str(&format!("Assistant: {}\n", message.content)),
            _ => return Err(format!("Unknown role: {}", message.role)),
        }
    }
    
    // Get the latest user message
    let _user_message = match messages.last() {
        Some(msg) if msg.role == "user" => &msg.content,
        _ => return Err("Last message must be from the user".to_string()),
    };
    
    // Generate response
    let model_read_guard = model_arc_for_inference.read().await;
    let mut session = model_read_guard.start_session(Default::default());
    
    let history_clone = history.clone();
    let response_content = task::spawn_blocking(move || -> Result<String, String> {
        let mut response = String::new();
        let mut rng = thread_rng();
        
        // Create our own error type
        #[derive(Debug)]
        struct CustomError(String);
        
        impl fmt::Display for CustomError {
            fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
                write!(f, "{}", self.0)
            }
        }
        
        impl StdError for CustomError {}
        
        // Infer using the correct API, offloaded to a blocking thread
        session.infer::<CustomError>(
            model_read_guard.as_ref(),
            &mut rng, 
            &llm::InferenceRequest {
                prompt: format!("{}\nAssistant:", history_clone).as_str().into(),
                parameters: Some(&llm::InferenceParameters::default()),
                play_back_previous_tokens: false,
                maximum_token_count: Some(1024),
            },
            &mut Default::default(),
            |t| {
                // Properly handle token extraction
                match t {
                    llm::InferenceResponse::Token(token) => {
                        // Use the appropriate method based on the API version
                        if let Some(text) = token.text() {
                            response.push_str(text);
                        } else if let Some(text) = token.as_str() {
                            response.push_str(text);
                        }
                    }
                    _ => {} // Ignore other inference responses
                }
                Ok(())
            },
        )
        .map_err(|e| e.to_string())?;
        
        Ok(response)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))??;
    
    Ok(response_content)
}

// Initialize state at app startup
pub fn init_app_state() -> Arc<Mutex<AppState>> {
    Arc::new(Mutex::new(AppState {
        llm: Arc::new(Mutex::new(LlmState::new())),
    }))
} 
