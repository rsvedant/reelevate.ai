# reelevate.ai

**Automate the creative process of generating brainrot content with AI-powered visualization - completely local!**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rsvedant/reelevate.ai)

## 🚀 Live Demo

Try it out at: **[https://reelevate-ai.vercel.app/](https://reelevate-ai.vercel.app/)**

## 🎯 What is reelevate.ai?

Do you love brainrot? So do I! That's why I decided to automate the creative process in creating new themes of all sorts of brainrot with visualization. This tool runs **completely local** using your computer's power - your data never leaves the app.

## ✨ Features

- 🤖 **AI-powered script generation** - Create brainrot stories, conversations, or any content
- 🎬 **Video reel generation** - Transform scripts into engaging video content
- 🎨 **Customizable subtitles** - Style your content exactly how you want
- 🔊 **Local AI TTS** - Text-to-speech processing without external services
- 📝 **Transcription support** - Built-in transcription capabilities
- 🔒 **Privacy-first** - All processing happens locally on your device, all chats are on your device, stored on the IndexedDB.
- 🎮 **WebGPU powered** - Hardware-accelerated AI inference

## 🛠️ How It Works

1. **Prompt Input**: Give the AI a prompt to write some brainrot (story, conversation, whatever) in the /chat route
2. **Script Generation**: The AI creates the script for you (however long - example: 1 year if you have the compute!)
3. **Script Editing**: Modify the script or copy-paste it into the reel generator with your background video to the /reel route
4. **Customization**: Customize subtitles and other visual elements
5. **Generation**: Local AI handles TTS + transcription and generates your reel 🎉

## ⚠️ Important Prerequisites

**YOU MUST ENABLE WebGPU on your browser for the app to function!**

### How to Enable WebGPU:

#### Chrome/Edge:
1. Go to `chrome://flags/` (or `edge://flags/`)
2. Search for "WebGPU"
3. Enable "Unsafe WebGPU" flag
4. Restart your browser

#### Firefox:
1. Go to `about:config`
2. Search for `dom.webgpu.enabled`
3. Set to `true`
4. Restart your browser

## 🚀 Getting Started

### Option 1: Use the Live Demo
Simply visit [https://reelevate-ai.vercel.app/](https://reelevate-ai.vercel.app/) and start creating!

### Option 2: Self-Hosting

#### Prerequisites
- Node.js 18+ 
- npm or yarn
- WebGPU-enabled browser

#### Installation

```bash
# Clone the repository
git clone https://github.com/rsvedant/reelevate.ai.git
cd reelevate.ai

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:3000`

#### Building for Production

```bash
# Build the application
npm run build
# or
bun run build

# Start the production server
npm start
# or
bun start
```

## 🔮 Future Roadmap

### Coming Soon:
- 🖥️ **Dedicated Mac App** - Native macOS application
- 🪟 **Dedicated Windows App** - Native Windows application
- 🦀 **Rust Migration** - Migrating to Rust for faster inference performance
- 🎯 **Enhanced AI Models** - More sophisticated content generation
- 🎨 **Advanced Customization** - More styling and effect options

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute:
- 🐛 **Bug Reports** - Found a bug? Open an issue!
- 💡 **Feature Requests** - Have an idea? We'd love to hear it!
- 🔧 **Code Contributions** - Submit pull requests for fixes or features
- 📚 **Documentation** - Help improve our docs
- 🎨 **Design** - UI/UX improvements
- 🧪 **Testing** - Help test new features

### Getting Started with Contributing:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines:
- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure WebGPU compatibility

## 🙏 Acknowledgments

- Thanks to the WebGPU community for enabling local AI inference
- The brainrot community for inspiration 💀

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/rsvedant/reelevate.ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/rsvedant/reelevate.ai/discussions)

## 🔗 Links

- **Live Demo**: [https://reelevate-ai.vercel.app/](https://reelevate-ai.vercel.app/)
- **Repository**: [https://github.com/rsvedant/reelevate.ai](https://github.com/rsvedant/reelevate.ai)

---

**Made with ❤️ by [rsvedant](https://github.com/rsvedant)**
