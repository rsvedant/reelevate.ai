use anyhow::Result;
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::LlamaModel;
use llama_cpp_2::token::data_array::LlamaTokenDataArray;
use std::num::NonZeroU32;
use std::ops::Deref;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State, Window};
use tokio::task;
use std::io::Write;
use std::fmt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LlmModelInfo {
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
    model: Option<Arc<LlamaModel>>,
    model_path: Option<PathBuf>,
}

impl fmt::Debug for LlmState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("LlmState")
            .field("model_path", &self.model_path)
            .field("model", &self.model.as_ref().map(|_| "Some(LlamaModel Arc)"))
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
pub async fn get_models() -> Result<Vec<LlmModelInfo>, String> {
    // hardcoded a couple popular models, TODO: add custom model fetching from repos
    Ok(vec![
        LlmModelInfo {
            name: "Llama-2-7B-Chat-GGUF".to_string(),
            size_mb: 3800,
            url: "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf".to_string(),
            description: "Llama 2 7B Chat model - good balance of size and quality".to_string(),
        },
        LlmModelInfo {
            name: "TinyLlama-1.1B-Chat-v1.0-GGUF".to_string(),
            size_mb: 700,
            url: "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf".to_string(),
            description: "TinyLlama 1.1B Chat model - extremely fast, smaller model".to_string(),
        },
    ])
}

#[tauri::command]
pub async fn download_model(model_info: LlmModelInfo, app_state: State<'_, Arc<Mutex<AppState>>>, window: Window) -> Result<String, String> {
    let models_dir = std::env::current_dir()
        .map_err(|e| e.to_string())?
        .join("models");

    if !models_dir.exists() {
        std::fs::create_dir_all(&models_dir).map_err(|e| e.to_string())?;
    }

    let model_path = models_dir.join(format!("{}.gguf", model_info.name));

    if model_path.exists() {
        // Try to load existing model to check validity and update state if good
        let model_path_clone = model_path.clone();
        let temp_window_clone = window.clone(); // Clone for task
        let model_name = model_info.name.clone();

        let validation_check = task::spawn_blocking(move || -> Result<Arc<LlamaModel>, String> {
            temp_window_clone.emit("download-progress", serde_json::json!({
                "progress": 100, // Assuming it's already downloaded
                "modelName": model_name,
                "status": "validating_existing"
            })).map_err(|e| e.to_string())?;

            let model_params = LlamaModelParams::default(); // Use default params for now
            let backend = LlamaBackend::init().map_err(|e| format!("Failed to initialize backend: {}", e))?;
            
            LlamaModel::load_from_file(&backend, &model_path_clone, &model_params)
                .map(Arc::new)
                .map_err(|e| {
                    // If existing model is invalid, delete it
                    let _ = std::fs::remove_file(&model_path_clone);
                    format!("Existing model {} is invalid and was removed: {}. Please re-download.", model_path_clone.display(), e)
                })
        }).await.map_err(|e| format!("Task join error: {}", e))??;
        
        // If existing model is valid
        let app_state_guard = app_state.lock().map_err(|e| e.to_string())?;
        let mut llm_state_guard = app_state_guard.llm.lock().map_err(|e| e.to_string())?;
        llm_state_guard.model_path = Some(model_path.clone());
        llm_state_guard.model = Some(validation_check);

        window.emit("download-progress", serde_json::json!({
            "progress": 100,
            "modelName": model_info.name,
            "status": "completed_existing_valid"
        })).map_err(|e| e.to_string())?;
        
        return Ok(format!("Model {} already exists and is valid.", model_info.name));
    }

    // Create a temporary file for downloading
    let temp_path = model_path.with_extension("download");

    // Download the model (rest of the download logic remains similar)
    let client = reqwest::Client::new();
    let mut response = client.get(&model_info.url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Failed to download model: HTTP {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded_size = 0;
    let mut file = std::fs::File::create(&temp_path).map_err(|e| e.to_string())?;

    window.emit("download-progress", serde_json::json!({
        "progress": 0,
        "modelName": model_info.name,
        "total": total_size,
        "downloaded": 0,
        "status": "downloading"
    })).map_err(|e| e.to_string())?;

    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded_size += chunk.len() as u64;
        let progress = if total_size > 0 { (downloaded_size as f64 / total_size as f64 * 100.0) as u32 } else { 0 };
        if progress % 1 == 0 || downloaded_size == total_size {
            window.emit("download-progress", serde_json::json!({
                "progress": progress,
                "modelName": model_info.name,
                "total": total_size,
                "downloaded": downloaded_size,
                "status": "downloading"
            })).map_err(|e| e.to_string())?;
        }
    }

    if total_size > 0 && downloaded_size != total_size {
        let _ = std::fs::remove_file(&temp_path);
        return Err(format!("Incomplete download: expected {} bytes but got {} bytes", total_size, downloaded_size));
    }

    drop(file);
    std::fs::rename(&temp_path, &model_path).map_err(|e| e.to_string())?;

    window.emit("download-progress", serde_json::json!({
        "progress": 100,
        "modelName": model_info.name,
        "status": "validating_downloaded",
        "total": total_size,
        "downloaded": downloaded_size
    })).map_err(|e| e.to_string())?;

    let model_path_clone_for_validation = model_path.clone();
    let window_clone = window.clone();

    let loaded_model = task::spawn_blocking(move || -> Result<Arc<LlamaModel>, String> {
        let model_params = LlamaModelParams::default(); // Use default params
        let backend = LlamaBackend::init().map_err(|e| format!("Failed to initialize backend: {}", e))?;
        
        LlamaModel::load_from_file(&backend, &model_path_clone_for_validation, &model_params)
            .map(Arc::new)
            .map_err(|e| {
                let _ = std::fs::remove_file(&model_path_clone_for_validation); // Clean up invalid downloaded file
                format!("Invalid downloaded model file: {}. It has been removed.", e)
            })
    }).await.map_err(|e| format!("Task join error during validation: {}", e))??;
    
    window.emit("download-progress", serde_json::json!({
        "progress": 100,
        "modelName": model_info.name,
        "status": "completed"
    })).map_err(|e| e.to_string())?;

    let app_state_guard = app_state.lock().map_err(|e| e.to_string())?;
    let mut llm_state_guard = app_state_guard.llm.lock().map_err(|e| e.to_string())?;
    llm_state_guard.model_path = Some(model_path);
    llm_state_guard.model = Some(loaded_model);

    Ok(format!("Successfully downloaded and validated model {}", model_info.name))
}

#[tauri::command]
pub async fn tokenize(
    text: String,
    app_state: State<'_, Arc<Mutex<AppState>>>
) -> Result<Vec<i32>, String> {
    let llm_state_arc = {
        let app_state_guard = app_state.lock().map_err(|e| e.to_string())?;
        app_state_guard.llm.clone()
    };

    let model_arc = {
        let llm_state_guard = llm_state_arc.lock().map_err(|e| e.to_string())?;
        match &llm_state_guard.model {
            Some(m) => m.clone(),
            None => return Err("Model not loaded. Please download or select a valid model first.".to_string()),
        }
    };

    let text_to_tokenize = text.clone();
    
    // Run tokenization in a blocking task to not block the async runtime
    let tokens = task::spawn_blocking(move || -> Result<Vec<i32>, String> {
        // Using the correct API from llama-cpp-2 with proper dereferencing
        let tokens = model_arc.deref().encode(text_to_tokenize.as_bytes(), true)
            .map_err(|e| format!("Tokenization error: {}", e))?;
        
        // Convert LlamaToken (u32) to i32 for JSON serialization
        let tokens_i32: Vec<i32> = tokens.iter()
            .map(|&token| token as i32)
            .collect();
            
        Ok(tokens_i32)
    }).await.map_err(|e| format!("Task join error: {}", e))??;

    Ok(tokens)
}

#[tauri::command]
pub async fn detokenize(
    tokens: Vec<i32>,
    app_state: State<'_, Arc<Mutex<AppState>>>
) -> Result<String, String> {
    let llm_state_arc = {
        let app_state_guard = app_state.lock().map_err(|e| e.to_string())?;
        app_state_guard.llm.clone()
    };

    let model_arc = {
        let llm_state_guard = llm_state_arc.lock().map_err(|e| e.to_string())?;
        match &llm_state_guard.model {
            Some(m) => m.clone(),
            None => return Err("Model not loaded. Please download or select a valid model first.".to_string()),
        }
    };

    // Convert i32 tokens back to u32 for llama_token
    let tokens_u32: Vec<u32> = tokens.iter().map(|&t| t as u32).collect();
    
    // Run detokenization in a blocking task
    let text = task::spawn_blocking(move || -> Result<String, String> {
        let mut result = String::new();
        
        // Using decode to convert tokens to string with proper dereferencing
        for token in tokens_u32 {
            let piece = model_arc.deref().token_to_piece(token)
                .map_err(|e| format!("Decode error: {}", e))?;
            
            result.push_str(&String::from_utf8_lossy(&piece).to_string());
        }
        
        Ok(result)
    }).await.map_err(|e| format!("Task join error: {}", e))??;

    Ok(text)
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

    let model_arc = {
        let llm_state_guard = llm_state_arc.lock().map_err(|e| e.to_string())?;
        match &llm_state_guard.model {
            Some(m) => m.clone(),
            None => return Err("Model not loaded. Please download or select a valid model first.".to_string()),
        }
    };

    // Combine messages into a single prompt string
    // This basic formatting might need to be adjusted based on the model's expected chat format (e.g., Llama2-Chat, Alpaca, etc.)
    let mut prompt = String::new();
    for message in &messages {
        // A common format, but specific models might have different needs (e.g., [INST], <|user|>, etc.)
        prompt.push_str(&format!("{}: {}\n", message.role, message.content)); 
    }
    prompt.push_str("assistant: "); // Prompt the model for an assistant response

    // --- Inference using llama-cpp-2 ---
    let model_clone_for_task = model_arc.clone();
    let prompt_clone = prompt.clone();
    let response_content = task::spawn_blocking(move || -> Result<String, String> {
        let model = model_clone_for_task;
        let backend = LlamaBackend::init().map_err(|e| format!("Failed to initialize backend: {}", e))?;

        // Create a context with custom parameters - use a reasonable context size
        let n_ctx_val = NonZeroU32::new(2048).expect("2048 should be non-zero");
        let ctx_params = LlamaContextParams::default()
            .with_n_ctx(Some(n_ctx_val))
            .with_n_batch(512); // Reduced batch size for stability
            
        let current_n_ctx = match ctx_params.n_ctx() {
            Some(n) => n.get() as usize,
            None => 512, // Fallback to a reasonable default
        };

        let mut context = model.deref().new_context(&backend, ctx_params)
            .map_err(|e| format!("Failed to create LlamaContext: {}", e))?;

        // Tokenize the prompt using the correct method with proper dereferencing
        let prompt_tokens = model.deref().encode(prompt_clone.as_bytes(), true)
            .map_err(|e| format!("Tokenization error: {}", e))?;

        if prompt_tokens.is_empty() {
            return Ok("".to_string());
        }

        // Ensure we don't exceed context size
        let tokens_to_process = std::cmp::min(prompt_tokens.len(), current_n_ctx - 4);
        let mut batch = LlamaBatch::new(tokens_to_process, 1);

        // Add the prompt tokens to the batch
        batch.add_sequence(&prompt_tokens[..tokens_to_process], 0, false)
            .map_err(|e| format!("Failed to add tokens to batch: {}", e))?;
        
        // Process the prompt
        context.decode(&mut batch)
            .map_err(|e| format!("Context decode error (prompt processing): {}", e))?;

        let mut generated_text = String::new();
        let mut generated_tokens = 0;
        let max_tokens = 1024; // Maximum tokens to generate

        // Token generation loop
        loop {
            if generated_tokens >= max_tokens {
                break;
            }

            // Get logits for the last token using the correct method
            let logits = context.get_logits_ith(batch.n_tokens() - 1);
            
            // Get candidates
            let candidates = context.candidates_ith(batch.n_tokens() - 1);
            let mut token_data_array = LlamaTokenDataArray::from_iter(candidates, false);
            
            // Sample the next token using the correct sampling API
            let token = token_data_array.sample_top_p_top_k(
                None,   // rng seed
                0.9,    // top_p
                40,     // top_k 
                0.8,    // temp
                1.0,    // repeat_penalty
                1       // repeat_last_n
            );

            // Check for end of sequence
            if token == model.deref().token_eos() {
                break;
            }
            
            // Detokenize the token to text using the correct method with proper dereferencing
            let token_bytes = model.deref().token_to_piece(token)
                .map_err(|e| format!("Decode error: {}", e))?;
                
            let token_str = String::from_utf8_lossy(&token_bytes).to_string();
            generated_text.push_str(&token_str);
            
            // Prepare next batch with the new token - reset batch first
            batch.clear();
            batch.add_sequence(&[token], 0, false)
                .map_err(|e| format!("Failed to add token to batch: {}", e))?;

            // Process the new token
            context.decode(&mut batch)
                .map_err(|e| format!("Context decode error: {}", e))?;
            
            generated_tokens += 1;
        }
        
        Ok(generated_text)
    })
    .await
    .map_err(|e| format!("Chat task join error: {}", e))??;

    Ok(response_content)
}

#[tauri::command]
pub async fn delete_model(model_name: String, app_state: State<'_, Arc<Mutex<AppState>>>) -> Result<String, String> {
    let models_dir = std::env::current_dir()
        .map_err(|e| e.to_string())?
        .join("models");
    
    let model_path = models_dir.join(format!("{}.gguf", model_name));
    
    if !model_path.exists() {
        return Ok(format!("Model {} does not exist", model_name));
    }
    
    {
        let app_state_guard = app_state.lock().map_err(|e| e.to_string())?;
        let mut llm_state_guard = app_state_guard.llm.lock().map_err(|e| e.to_string())?;
        
        if let Some(current_path) = &llm_state_guard.model_path {
            if current_path == &model_path {
                llm_state_guard.model = None;
                llm_state_guard.model_path = None;
            }
        }
    }
    
    std::fs::remove_file(&model_path).map_err(|e| e.to_string())?;
    
    Ok(format!("Successfully deleted model {}", model_name))
}

pub fn init_app_state() -> Arc<Mutex<AppState>> {
    Arc::new(Mutex::new(AppState {
        llm: Arc::new(Mutex::new(LlmState::new())),
    }))
} 