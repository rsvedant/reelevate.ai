# Reelevate.ai

## Goal

The primary goal of Reelevate.ai is to automate the process of video reel creation. This involves leveraging Large Language Models (LLMs) and other AI techniques to generate engaging and relevant content.

## Current Status

**Development has just started, and the entire project is currently unfinished.**

Many features are still under active development, and the application is not yet stable or feature-complete.

## Getting Started (Running Locally)

As the project is in its early stages, running it locally requires setting up the development environment.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Rust:** The backend and core logic are being developed in Rust. ([Installation Guide](https://www.rust-lang.org/tools/install))
*   **Node.js & bun:** The frontend (Tauri) might require Node.js and `bun` is used as a JavaScript runtime and package manager. ([Node.js Installation](https://nodejs.org/), [Bun Installation](https://bun.sh/docs/installation))
*   **CMake:** Required for building some dependencies, particularly for `llama-cpp-2`. ([Installation Guide](https://cmake.org/install/))
*   **LLVM:** Also a dependency for `llama-cpp-2` or other related libraries. Ensure `clang` is in your PATH. ([Installation Guide](https://llvm.org/docs/GettingStarted.html))
*   **Visual Studio C++ Build Tools (Windows):** If you are on Windows, you will need the Visual C++ build tools for C/C++ compilation. Make sure to install the "Desktop development with C++" workload in the Visual Studio Installer.
*   **Tauri CLI:** For managing and building the Tauri application.
    ```bash
    cargo install tauri-cli --locked
    ```

### Running the Application

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd reelevate.ai
    ```

2.  **Install frontend dependencies (if applicable, navigate to the frontend directory if there is one):**
    ```bash
    # Assuming your frontend is in the root or a specific directory like 'src-ui'
    # bun install
    ```
    *(Note: Adjust the command based on your project structure if you have a separate frontend directory)*

3.  **Run the Tauri development server:**
    This command will build and run both the Rust backend and the Tauri frontend in development mode.
    ```bash
    bun tauri dev
    ```

    This will typically open the application window. The first build might take some time as it compiles Rust crates and potentially downloads models.

## Project Structure (Brief Overview)

*   `src-tauri/`: Contains the Rust backend code for the Tauri application.
    *   `src/llm.rs`: Handles Large Language Model interactions, including model downloading, loading, and inference.
    *   `src/main.rs`: Entry point for the Rust backend.
    *   `Cargo.toml`: Rust project manifest for the Tauri backend.
*   *(Other directories like `src/` or `ui/` would contain frontend code - to be updated as project evolves)*

## Contributing

Contributions are welcome! As the project is in its nascent stage, please feel free to open issues for bugs, feature requests, or discussions.

*(Further details on contributing guidelines will be added as the project matures.)*

## License

*(License information to be added)* 