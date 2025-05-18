use anyhow::Result;
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::LlamaModel;
use llama_cpp_2::token::data_array::LlamaTokenDataArray;
use llama_cpp_2::token::LlamaToken;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State, Window};
use tokio::task;
use std::io::Write;
use std::fmt;
use sentencepiece::SentencePieceProcessor;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LlmModelInfo {
    name: String,
    size_mb: u32,
    url: String,
    tokenizer_url: String,
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
    tokenizer: Option<Arc<SentencePieceProcessor>>,
}

impl fmt::Debug for LlmState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("LlmState")
            .field("model_path", &self.model_path)
            .field("model", &self.model.as_ref().map(|_| "Some(LlamaModel Arc)"))
            .field("tokenizer", &self.tokenizer.as_ref().map(|_| "Some(SentencePieceProcessor Arc)"))
            .finish()
    }
}

impl LlmState {
    fn new() -> Self {
        Self {
            model: None,
            model_path: None,
            tokenizer: None,
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
            tokenizer_url: "https://huggingface.co/meta-llama/Llama-2-7b-chat-hf/resolve/main/tokenizer.model".to_string(),
            description: "Llama 2 7B Chat model - good balance of size and quality".to_string(),
        },
        LlmModelInfo {
            name: "TinyLlama-1.1B-Chat-v1.0-GGUF".to_string(),
            size_mb: 700,
            url: "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf".to_string(),
            tokenizer_url: "https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0/resolve/main/tokenizer.model".to_string(),
            description: "TinyLlama 1.1B Chat model - extremely fast, smaller model".to_string(),
        },
    ])
}

#[tauri::command]
pub async fn download_model(model_info: LlmModelInfo, app_state: State<'_, Arc<Mutex<AppState>>>, window: Window) -> Result<String, String> {
    let models_dir = std::env::current_dir()
        .map_err(|e| e.to_string())?
        .join("models_data");

    if !models_dir.exists() {
        std::fs::create_dir_all(&models_dir).map_err(|e| e.to_string())?;
    }

    // Create model-specific directory
    let model_dir = models_dir.join(&model_info.name);
    if !model_dir.exists() {
        std::fs::create_dir_all(&model_dir).map_err(|e| e.to_string())?;
    }

    let model_path = model_dir.join("model.gguf");
    let tokenizer_path = model_dir.join("tokenizer.model");

    // Check if model file already exists
    if model_path.exists() {
        // Try to load existing model to check validity and update state if good
        let model_path_clone = model_path.clone();
        let tokenizer_path_clone = tokenizer_path.clone();
        let temp_window_clone = window.clone(); // Clone for task
        let temp_model_name = model_info.name.clone();

        let validation_check = task::spawn_blocking(move || -> Result<(Arc<LlamaModel>, Arc<SentencePieceProcessor>), String> {
            temp_window_clone.emit("download-progress", serde_json::json!({
                "progress": 100, // Assuming it's already downloaded
                "modelName": temp_model_name,
                "status": "validating_existing"
            })).map_err(|e| e.to_string())?;

            let model_params = LlamaModelParams::default(); // Use default params for now
            let backend = LlamaBackend::init().map_err(|e| format!("Failed to initialize backend: {}", e))?;
            
            let model = LlamaModel::load_from_file(&backend, &model_path_clone, &model_params)
                .map(Arc::new)
                .map_err(|e| {
                    // If existing model is invalid, delete it
                    let _ = std::fs::remove_file(&model_path_clone);
                    format!("Existing model {} is invalid and was removed: {}. Please re-download.", model_path_clone.display(), e)
                })?;
                
            // Check tokenizer
            if !tokenizer_path_clone.exists() {
                return Err(format!("Tokenizer file not found: {}. Please re-download.", tokenizer_path_clone.display()));
            }
            
            // Add a more robust tokenizer loading with better error handling
            let processor = match tokenizer_path_clone.to_str() {
                Some(path_str) => {
                    match SentencePieceProcessor::open(path_str) {
                        Ok(p) => Arc::new(p),
                        Err(e) => {
                            // If tokenizer is invalid, delete it and provide a detailed error
                            let _ = std::fs::remove_file(&tokenizer_path_clone);
                            return Err(format!(
                                "Existing tokenizer is invalid and was removed: {}. Please re-download. \
                                This might be related to a Windows file handle issue. Try running in release mode.", 
                                e
                            ));
                        }
                    }
                },
                None => return Err(format!("Invalid tokenizer path: {}", tokenizer_path_clone.display()))
            };
            
            Ok((model, processor))
        }).await.map_err(|e| format!("Task join error: {}", e))?;
        
        match validation_check {
            Ok((model, tokenizer)) => {
                // If existing model and tokenizer are valid
                let app_state_guard = app_state.lock().map_err(|e| e.to_string())?;
                let mut llm_state_guard = app_state_guard.llm.lock().map_err(|e| e.to_string())?;
                llm_state_guard.model_path = Some(model_path.clone());
                llm_state_guard.model = Some(model);
                llm_state_guard.tokenizer = Some(tokenizer);
                
                window.emit("download-progress", serde_json::json!({
                    "progress": 100,
                    "modelName": model_info.name,
                    "status": "completed_existing_valid"
                })).map_err(|e| e.to_string())?;
                
                return Ok(format!("Model {} already exists and is valid.", model_info.name));
            },
            Err(e) => {
                // If validation failed, continue with download process
                window.emit("download-progress", serde_json::json!({
                    "progress": 0,
                    "modelName": model_info.name,
                    "status": "validation_failed_downloading",
                    "error": e
                })).map_err(|e| e.to_string())?;
            }
        }
    }

    // Function to download a file
    async fn download_file(url: &str, path: &PathBuf, file_type: &str, model_name: &str, window: &Window) -> Result<(), String> {
        // Create a temporary file for downloading
        let temp_path = path.with_extension("download");

        let client = reqwest::Client::new();
        let mut response = client.get(url)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            return Err(format!("Failed to download {}: HTTP {}", file_type, response.status()));
        }

        let total_size = response.content_length().unwrap_or(0);
        let mut downloaded_size = 0;
        let mut file = std::fs::File::create(&temp_path).map_err(|e| e.to_string())?;

        window.emit("download-progress", serde_json::json!({
            "progress": 0,
            "modelName": model_name,
            "fileType": file_type,
            "total": total_size,
            "downloaded": 0,
            "status": format!("downloading_{}", file_type)
        })).map_err(|e| e.to_string())?;

        while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
            file.write_all(&chunk).map_err(|e| e.to_string())?;
            downloaded_size += chunk.len() as u64;
            let progress = if total_size > 0 { (downloaded_size as f64 / total_size as f64 * 100.0) as u32 } else { 0 };
            if progress % 1 == 0 || downloaded_size == total_size {
                window.emit("download-progress", serde_json::json!({
                    "progress": progress,
                    "modelName": model_name,
                    "fileType": file_type,
                    "total": total_size,
                    "downloaded": downloaded_size,
                    "status": format!("downloading_{}", file_type)
                })).map_err(|e| e.to_string())?;
            }
        }

        if total_size > 0 && downloaded_size != total_size {
            let _ = std::fs::remove_file(&temp_path);
            return Err(format!("Incomplete download: expected {} bytes but got {} bytes", total_size, downloaded_size));
        }

        drop(file);
        std::fs::rename(&temp_path, path).map_err(|e| e.to_string())?;
        
        Ok(())
    }

    // Download model file
    download_file(&model_info.url, &model_path, "model", &model_info.name, &window).await?;
    
    // Download tokenizer file
    download_file(&model_info.tokenizer_url, &tokenizer_path, "tokenizer", &model_info.name, &window).await?;

    window.emit("download-progress", serde_json::json!({
        "progress": 100,
        "modelName": model_info.name,
        "status": "validating_downloaded"
    })).map_err(|e| e.to_string())?;

    let model_path_clone = model_path.clone();
    let tokenizer_path_clone = tokenizer_path.clone();
    
    let validation_result = task::spawn_blocking(move || -> Result<(Arc<LlamaModel>, Arc<SentencePieceProcessor>), String> {
        // Validate model
        let model_params = LlamaModelParams::default(); // Use default params
        let backend = LlamaBackend::init().map_err(|e| format!("Failed to initialize backend: {}", e))?;
        
        let model = LlamaModel::load_from_file(&backend, &model_path_clone, &model_params)
            .map(Arc::new)
            .map_err(|e| {
                let _ = std::fs::remove_file(&model_path_clone); // Clean up invalid downloaded file
                format!("Invalid downloaded model file: {}. It has been removed.", e)
            })?;
        
        // Validate tokenizer with improved error handling
        let processor = match tokenizer_path_clone.to_str() {
            Some(path_str) => {
                match SentencePieceProcessor::open(path_str) {
                    Ok(p) => Arc::new(p),
                    Err(e) => {
                        // If tokenizer is invalid, delete it and provide a detailed error
                        let _ = std::fs::remove_file(&tokenizer_path_clone);
                        return Err(format!(
                            "Invalid downloaded tokenizer file: {}. It has been removed. \
                            This might be related to a Windows file handle issue. Try running in release mode.", 
                            e
                        ));
                    }
                }
            },
            None => return Err(format!("Invalid tokenizer path: {}", tokenizer_path_clone.display()))
        };
        
        Ok((model, processor))
    }).await.map_err(|e| format!("Task join error during validation: {}", e))??;
    
    window.emit("download-progress", serde_json::json!({
        "progress": 100,
        "modelName": model_info.name,
        "status": "completed"
    })).map_err(|e| e.to_string())?;

    let app_state_guard = app_state.lock().map_err(|e| e.to_string())?;
    let mut llm_state_guard = app_state_guard.llm.lock().map_err(|e| e.to_string())?;
    
    llm_state_guard.model_path = Some(model_path);
    llm_state_guard.model = Some(validation_result.0);
    llm_state_guard.tokenizer = Some(validation_result.1);

    Ok(format!("Successfully downloaded and validated model {}", model_info.name))
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

    let (model_arc, tokenizer_arc) = {
        let llm_state_guard = llm_state_arc.lock().map_err(|e| e.to_string())?;
        match (&llm_state_guard.model, &llm_state_guard.tokenizer) {
            (Some(m), Some(t)) => (m.clone(), t.clone()),
            (None, _) => return Err("Model not loaded. Please download or select a valid model first.".to_string()),
            (_, None) => return Err("Tokenizer not loaded. Please ensure the tokenizer file exists.".to_string()),
        }
    };

    // Combine messages into a single prompt string
    let mut prompt = String::new();
    for message in &messages {
        prompt.push_str(&format!("{}: {}\n", message.role, message.content)); 
    }
    prompt.push_str("assistant: "); // Prompt the model for an assistant response

    // --- Inference using llama-cpp-2 with SentencePiece tokenization ---
    let model_clone_for_task = model_arc.clone();
    let tokenizer_clone_for_task = tokenizer_arc.clone();
    let response_content = task::spawn_blocking(move || -> Result<String, String> {
        let model = model_clone_for_task;
        let tokenizer = tokenizer_clone_for_task;
        let backend = LlamaBackend::init().map_err(|e| format!("Failed to initialize backend: {}", e))?;

        // Create a context
        let ctx_params = LlamaContextParams::default();
        let mut context = model.new_context(&backend, ctx_params)
            .map_err(|e| format!("Failed to create LlamaContext: {}", e))?;

        // Use SentencePiece to tokenize the prompt with better error handling
        let pieces = match tokenizer.encode(&prompt) {
            Ok(p) => p,
            Err(e) => {
                return Err(format!(
                    "Failed to tokenize with SentencePiece: {}. This might be due to encoding issues with the input.", 
                    e
                ));
            }
        };
        
        // Check if we got valid pieces
        if pieces.is_empty() {
            return Err("Tokenization resulted in empty tokens. This could be due to an issue with the prompt.".to_string());
        }
        
        // Convert SentencePiece token pieces to LlamaToken with additional validation
        let prompt_tokens: Vec<LlamaToken> = pieces.iter()
            .filter_map(|piece| {
                if piece.id >= 0 { // Ensure the ID is valid
                    Some(LlamaToken::new(piece.id as i32))
                } else {
                    None
                }
            })
            .collect();
            
        if prompt_tokens.is_empty() {
            return Err("No valid tokens were generated from the input.".to_string());
        }

        // Create a batch (llama-cpp-2 processes tokens in batches)
        let mut batch = LlamaBatch::new(512, 0);
        batch.add_sequence(&prompt_tokens, 0, false)
             .map_err(|e| format!("Failed to add tokens to batch: {}", e))?;
        
        // Evaluate the prompt to prefill the KV cache
        context.decode(&mut batch)
            .map_err(|e| format!("Context decode error (prompt processing): {}", e))?;

        // Main generation loop
        let mut generated_text = String::new();
        let mut generated_tokens = 0;
        let max_tokens = 1024; // Max tokens to generate for the response

        loop {
            if generated_tokens >= max_tokens {
                break;
            }

            // Sample the next token (using top_p sampling or similar)
            let candidates = context.candidates_ith(batch.n_tokens() - 1);
            let token_data_array = LlamaTokenDataArray::from_iter(candidates, false);
            
            // Simple greedy sampling (just take most likely token)
            let token = if !token_data_array.data.is_empty() {
                token_data_array.data[0].id()
            } else {
                break; // No candidates
            };

            // Check for End-Of-Sequence token
            if token == model.token_eos() {
                break;
            }

            // Convert Llama token ID to string by decoding a single token
            let token_id = token.0; // Extract the i32 value from LlamaToken
            
            // Use SentencePiece to decode this single token with error handling
            // SentencePiece expects u32 token IDs, so we need to convert safely
            let token_id_u32 = if token_id >= 0 {
                token_id as u32 // Safe conversion for non-negative values
            } else {
                return Err(format!("Encountered negative token ID: {}", token_id));
            };
            
            let piece = match tokenizer.decode_piece_ids(&[token_id_u32]) {
                Ok(text) => text,
                Err(e) => return Err(format!("Failed to decode token ID {}: {}", token_id, e))
            };
            
            generated_text.push_str(&piece);
            
            // Prepare the next batch for the new token
            batch.clear();
            batch.add_sequence(&[token], 0, true)
                 .map_err(|e| format!("Failed to add new token to batch: {}", e))?;

            // Decode the new token
            context.decode(&mut batch)
                .map_err(|e| format!("Context decode error (token generation): {}", e))?;
            
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
        .join("models_data");
    
    let model_dir = models_dir.join(&model_name);
    
    if !model_dir.exists() {
        return Ok(format!("Model {} does not exist", model_name));
    }
    
    {
        let app_state_guard = app_state.lock().map_err(|e| e.to_string())?;
        let mut llm_state_guard = app_state_guard.llm.lock().map_err(|e| e.to_string())?;
        
        if let Some(current_path) = &llm_state_guard.model_path {
            if current_path.starts_with(&model_dir) {
                llm_state_guard.model = None;
                llm_state_guard.model_path = None;
                llm_state_guard.tokenizer = None;
            }
        }
    }
    
    std::fs::remove_dir_all(&model_dir).map_err(|e| e.to_string())?;
    
    Ok(format!("Successfully deleted model {}", model_name))
}

pub fn init_app_state() -> Arc<Mutex<AppState>> {
    Arc::new(Mutex::new(AppState {
        llm: Arc::new(Mutex::new(LlmState::new())),
    }))
}