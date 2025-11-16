# Installation Guide

## Quick Start

### 1. Get a Gemini API Key

Before installing, you'll need a Google Gemini API key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Click **"Create API Key in new project"** (or select existing project)
5. Copy the API key (starts with `AIza...`)

**Important:** Keep your API key secure and never share it publicly.

### 2. Install the Extension

#### Option A: From Chrome Web Store (Recommended - Coming Soon)
1. Visit the Chrome Web Store
2. Search for "IlmAI"
3. Click "Add to Chrome"
4. Follow the prompts

#### Option B: Install from Source

1. **Download the extension:**
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
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle **"Developer mode"** ON (top right corner)
   - Click **"Load unpacked"**
   - Select the `urdu-notes-extension` folder
   - The extension icon should appear in your toolbar

### 3. Configure Your API Key

1. Click the **IlmAI extension icon** in your toolbar
2. Click the **Settings (⚙️) icon**
3. Go to the **"API Keys"** tab
4. Enter your Gemini API key
5. Click **"Add API Key"**
6. Click **"Save Settings"**

Your extension is now ready to use!

## First Use

### Capture Your First Video

1. Open a video on **YouTube, Vimeo, or any supported platform**
2. Click the **IlmAI extension icon**
3. Click **"Capture & Transcribe"**
4. A capture overlay will appear
5. Click **"Stop & Transcribe"** when finished
6. Wait for the AI to process (this may take a moment)
7. Your note will appear in the sidepanel

### Access Your Notes

1. Click the IlmAI extension icon
2. Click **"Open Notes Panel"**
3. Browse, search, and organize your notes

## Advanced Setup

### Multiple API Keys

For better reliability and higher usage limits, add multiple API keys:

1. Go to Settings → API Keys
2. Add each API key with a unique name
3. Set priorities if desired
4. Choose a load balancing strategy

### Customization

Explore the settings page for:
- **Transcription quality settings**
- **AI behavior customization**
- **Theme preferences**
- **Keyboard shortcuts**
- **Notification settings**

## Troubleshooting

### Extension Not Loading
- Ensure Developer mode is enabled
- Try reloading the extension
- Check for Chrome updates

### API Key Not Working
- Verify the key is correct (no extra spaces)
- Check your Gemini API quota
- Try testing the key in Settings

### Audio Capture Fails
- Grant microphone permissions
- Refresh the video page
- Try a different video platform

## Uninstallation

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "IlmAI"
3. Click **"Remove"**
4. Confirm removal

**Note:** This will delete all your notes. Export your data first if you want to keep it.

## Getting Help

- 📖 [User Guide](README.md)
- 🐛 [Report Issues](https://github.com/ilmai/urdu-notes-extension/issues)
- 💬 [Ask Questions](https://github.com/ilmai/urdu-notes-extension/discussions)
