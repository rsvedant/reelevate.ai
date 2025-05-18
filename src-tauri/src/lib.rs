mod llm;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

  let app_state = llm::init_app_state();

  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .manage(app_state)
    .invoke_handler(tauri::generate_handler![
      llm::get_models,
      llm::download_model,
      llm::delete_model,
      llm::tokenize,
      llm::detokenize,
      llm::chat
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
