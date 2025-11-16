# 🌙 IlmAI - Urdu Video Notes Extension

**AI-Powered Chrome Extension for Urdu Video Note-Taking with Comprehensive Features**

IlmAI is an enterprise-grade Chrome extension that transforms how you learn from Urdu videos. Capture audio, transcribe in real-time, organize with AI, and access powerful learning tools - all powered by Google's Gemini API.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/ilmai/urdu-notes-extension)

---

## ✨ Key Features

### 🎙️ **Audio Capture & Transcription**
- **Real-time Urdu transcription** using Gemini API
- Support for **YouTube, Vimeo, and other video platforms**
- **Mixed language support** (Urdu/English/Arabic with auto-detection)
- **Speaker diarization** to identify different speakers
- **Adjustable quality levels** (Fast/Balanced/Accurate)
- **Background transcription** - continues even when tab is inactive

### 🤖 **AI-Powered Intelligence**
- **Auto-categorization** (Islamic Studies, History, Science, Business, etc.)
- **Smart summaries** (One-line, Executive, Detailed)
- **NotebookLM-style Q&A** - Ask questions about your notes
- **Entity extraction** - Automatically identify names, dates, Quranic verses, Hadith references
- **Flashcard generation** - Create study materials automatically
- **Quiz generation** - MCQ, True/False, Fill-in-the-blank
- **Study guide creation** - Comprehensive learning materials

### 📚 **Knowledge Base System**
- **Multi-level organization:**
  - Workspaces (separate knowledge bases)
  - Notebooks (collections of notes)
  - Categories and Sub-categories
  - Tags (with nested support)
- **Smart linking** - Automatic backlinks between related notes
- **Version history** - Track changes over time
- **Advanced search** with fuzzy matching and boolean operators
- **Saved searches** for frequently used queries

### 🔑 **Advanced API Key Management**
- **Add unlimited Gemini API keys**
- **Automatic rotation and load balancing**
- **Multiple strategies:** Round-robin, Least-used, Health-weighted, Priority-based
- **Per-key usage tracking** and quotas
- **Cost estimation** per key
- **Health monitoring** with automatic failover
- **Circuit breaker pattern** for reliability

### 📤 **Export & Integration**
Export your notes in multiple formats:
- **PDF** - Formatted notes with RTL support
- **Markdown** - Plain text with formatting
- **HTML** - Beautiful web pages
- **JSON** - Structured data
- **CSV** - Tabular format for transcripts
- **TXT** - Simple text files

### 🎨 **Beautiful UI**
- **Dark/Light/Auto themes**
- **RTL (Right-to-Left) support** for Urdu and Arabic
- **Responsive design** for all screen sizes
- **Custom Urdu fonts** (Noto Nastaliq Urdu)
- **Intuitive sidepanel** interface
- **Quick actions popup**
- **Comprehensive settings page**

---

## 🚀 Installation

### Prerequisites
- **Google Chrome** (or Chromium-based browser: Edge, Brave, Arc, Opera)
- **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))
- **Node.js 16+** (for development)

### Quick Install (From Source)

1. **Clone the repository:**
```bash
git clone https://github.com/ilmai/urdu-notes-extension.git
cd urdu-notes-extension
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the extension:**
```bash
npm run build
```

4. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `urdu-notes-extension` folder

5. **Configure API Key:**
   - Click the extension icon
   - Go to Settings (⚙️)
   - Navigate to "API Keys" tab
   - Add your Gemini API key

---

## 📖 User Guide

### Getting Started

#### 1. **Capture a Video**
- Navigate to any video (YouTube, Vimeo, etc.)
- Click the IlmAI extension icon
- Click "Capture & Transcribe"
- The extension will start recording audio

#### 2. **Stop and Process**
- Click "Stop & Transcribe" when done
- Wait for AI to transcribe and process
- Your note will be automatically saved and categorized

#### 3. **Access Your Notes**
- Click "Open Notes Panel" in the popup
- Browse, search, and organize your notes
- Use AI features to enhance learning

### Advanced Features

#### **Asking Questions (NotebookLM-style)**
1. Open any note
2. Click "💬 Ask Question"
3. Type your question
4. Get AI-powered answers with source citations

#### **Generating Flashcards**
1. Open a note
2. Click "🃏 Flashcards"
3. AI will create study flashcards
4. Export to Anki or study within the extension

#### **Searching Notes**
Use advanced search operators:
- `"exact phrase"` - Search for exact matches
- `tag:islamic` - Filter by tag
- `category:education` - Filter by category
- `date:2024-01` - Filter by date range

#### **Keyboard Shortcuts**
- `Ctrl+Shift+N` - Quick capture
- `Ctrl+Shift+I` - Toggle sidepanel
- `Ctrl+Shift+F` - Search notes
- `Ctrl+K` - Command palette

---

## 🔧 Configuration

### API Keys Setup

#### Getting a Gemini API Key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy and paste into IlmAI settings

#### Multiple API Keys:
You can add multiple API keys for:
- **Higher usage limits** - Distribute load across keys
- **Redundancy** - Automatic failover if one key fails
- **Cost management** - Track usage per key
- **Different models** - Use different Gemini models per key

### Settings Overview

#### **General Settings**
- Default language (Urdu/English/Arabic/Mixed)
- Notification preferences
- UI density and font size

#### **Transcription Settings**
- Quality level (Fast/Balanced/Accurate)
- Speaker diarization (on/off)
- Timestamps (on/off)
- Auto-categorization (on/off)

#### **AI Settings**
- Summary length preference
- AI temperature (creativity level)
- Auto-generation options

#### **Appearance**
- Theme (Auto/Light/Dark)
- UI density
- Font size

---

## 🏗️ Architecture

### Technology Stack
- **Manifest V3** - Latest Chrome extension standard
- **JavaScript (ES6+)** - Modern async/await patterns
- **Tailwind CSS** - Utility-first styling
- **Google Gemini API** - AI transcription and processing
- **Chrome Storage API** - Local data persistence

### Project Structure
```
urdu-notes-extension/
├── manifest.json              # Extension configuration
├── popup/                     # Quick actions popup
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── sidepanel/                 # Main notes interface
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── sidepanel.css
├── options/                   # Settings page
│   ├── options.html
│   ├── options.js
│   └── options.css
├── background/                # Service worker
│   ├── background.js
│   └── api-manager.js         # API key management
├── content/                   # Content scripts
│   ├── content.js
│   └── audio-capture.js       # Audio recording
├── components/                # Core logic
│   ├── storage-manager.js     # Data management
│   ├── transcription-engine.js # Transcription
│   ├── ai-assistant.js        # AI features
│   └── export-manager.js      # Export functionality
├── styles/                    # Global styles
│   └── global.css
└── assets/                    # Icons and resources
    └── icons/
```

### Data Flow
1. **User starts capture** → Content script captures audio
2. **Audio sent to background** → Background worker handles processing
3. **Gemini API called** → Transcription with selected API key
4. **AI processing** → Categorization, summarization, entity extraction
5. **Storage** → Saved to Chrome Storage with indexes
6. **UI updates** → Notes appear in sidepanel

---

## 🔐 Privacy & Security

### Data Storage
- **All data stored locally** in Chrome Storage
- **No external servers** - Direct API calls to Google Gemini
- **API keys encrypted** in Chrome's secure storage
- **No telemetry or tracking**

### Permissions Explained
- `storage` - Save your notes locally
- `tabCapture` - Record audio from videos
- `scripting` - Inject UI on video pages
- `notifications` - Alert you when transcription completes
- Network access - Call Gemini API for transcription

---

## 🛠️ Development

### Setup Development Environment

```bash
# Clone and install
git clone https://github.com/ilmai/urdu-notes-extension.git
cd urdu-notes-extension
npm install

# Start development with auto-rebuild
npm run watch

# Run linting
npm run lint

# Run tests
npm test

# Format code
npm run format
```

### Building for Production

```bash
# Build optimized version
npm run build

# The dist/ folder contains the production build
```

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- **Code Style**: Follow ESLint rules
- **Commits**: Use conventional commits
- **Testing**: Add tests for new features
- **Documentation**: Update README for API changes

---

## 📊 Performance

### Optimizations
- **Lazy loading** - Load notes on demand
- **Virtual scrolling** - Handle 1000+ notes smoothly
- **Web Workers** - Background processing doesn't block UI
- **Efficient indexing** - Fast full-text search
- **Caching** - Cache AI responses to reduce API calls

### Browser Support
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave (latest)
- ✅ Arc (latest)
- ✅ Opera 74+

---

## 🐛 Troubleshooting

### Common Issues

#### **"No API key available" error**
- **Solution**: Add at least one API key in Settings → API Keys

#### **Transcription fails**
- Check your API key is valid
- Ensure you have internet connection
- Try a different API key (if you have multiple)
- Check Gemini API quota limits

#### **Audio capture doesn't start**
- Grant microphone permissions to Chrome
- Ensure you're on a supported video page
- Try refreshing the page

#### **Notes not appearing**
- Check if note is archived
- Clear filters in sidepanel
- Try searching for the video title

#### **Extension not loading**
- Ensure Developer mode is enabled
- Try reloading the extension
- Check Chrome console for errors

### Getting Help
- 📖 [Documentation](https://github.com/ilmai/urdu-notes-extension/wiki)
- 🐛 [Report Issues](https://github.com/ilmai/urdu-notes-extension/issues)
- 💬 [Discussions](https://github.com/ilmai/urdu-notes-extension/discussions)

---

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] Offline transcription support
- [ ] Cloud sync (Google Drive, Dropbox)
- [ ] Collaboration features
- [ ] Mobile app companion
- [ ] Anki integration
- [ ] Obsidian plugin

### Version 2.0 (Future)
- [ ] Real-time collaborative notes
- [ ] Advanced analytics dashboard
- [ ] Gamification features
- [ ] Spaced repetition system
- [ ] Custom AI models
- [ ] API for third-party integrations

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 IlmAI Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Google Gemini** - For the powerful AI API
- **Tailwind CSS** - For beautiful styling
- **Noto Nastaliq Urdu Font** - For authentic Urdu typography
- **Chrome Extensions Team** - For the excellent platform
- **Urdu Learning Community** - For inspiration and feedback

---

## 📞 Contact

- **GitHub**: [ilmai/urdu-notes-extension](https://github.com/ilmai/urdu-notes-extension)
- **Issues**: [Report a bug](https://github.com/ilmai/urdu-notes-extension/issues)
- **Email**: support@ilmai.io

---

## 🌟 Star History

If you find IlmAI useful, please ⭐ star the repository to show your support!

---

Made with ❤️ for the Urdu learning community

**Happy Learning! 📚 التعلم سعيد**
