# Development Guide

## Getting Started with Development

### Prerequisites
- Node.js 16+ and npm
- Google Chrome or Chromium-based browser
- Gemini API key for testing
- Git

### Initial Setup

1. **Clone and install:**
```bash
git clone https://github.com/ilmai/urdu-notes-extension.git
cd urdu-notes-extension
npm install
```

2. **Build the extension:**
```bash
npm run build
```

3. **Load in Chrome:**
- Navigate to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the project directory

## Development Workflow

### Watch Mode
For active development with auto-rebuild:
```bash
npm run watch
```

This will:
- Watch for file changes
- Automatically rebuild TypeScript
- Recompile Tailwind CSS
- You'll need to manually reload the extension in Chrome

### Building
```bash
npm run build        # Production build
npm run build:dev    # Development build (with source maps)
```

### Code Quality
```bash
npm run lint         # Check for errors
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

### Testing
```bash
npm test            # Run all tests
npm run test:watch  # Watch mode for tests
```

## Project Structure

```
urdu-notes-extension/
├── manifest.json              # Extension configuration
├── background/                # Service worker
│   ├── background.js         # Main background script
│   └── api-manager.js        # API key management
├── components/               # Core business logic
│   ├── storage-manager.js    # Data storage and indexing
│   ├── transcription-engine.js # Gemini API integration
│   ├── ai-assistant.js       # AI features (Q&A, summaries)
│   └── export-manager.js     # Export to various formats
├── content/                  # Content scripts
│   ├── content.js           # Main content script
│   └── audio-capture.js     # Audio recording logic
├── popup/                    # Extension popup
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── sidepanel/               # Main notes interface
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── sidepanel.css
├── options/                 # Settings page
│   ├── options.html
│   ├── options.js
│   └── options.css
└── styles/                  # Global styles
    └── global.css           # Tailwind + custom styles
```

## Key Technologies

### Core Stack
- **JavaScript ES6+** - Modern async/await patterns
- **Chrome Extension API** - Manifest V3
- **Tailwind CSS** - Utility-first styling
- **Google Gemini API** - AI transcription and processing

### Architecture Patterns
- **Singleton pattern** - For managers (storage, API, etc.)
- **Event-driven** - Chrome message passing
- **Promise-based** - All async operations
- **Factory pattern** - For creating notes, workspaces
- **Observer pattern** - For UI updates

## Component Development

### Adding a New Feature

1. **Plan the feature:**
   - What does it do?
   - Where does it fit in the architecture?
   - What storage schema changes are needed?
   - What UI changes are needed?

2. **Implement the logic:**
   - Add to appropriate component file
   - Follow existing patterns
   - Add error handling
   - Add JSDoc comments

3. **Add UI:**
   - Update HTML if needed
   - Add event handlers in JS
   - Style with Tailwind classes

4. **Test thoroughly:**
   - Manual testing in Chrome
   - Test edge cases
   - Test on different video platforms

5. **Document:**
   - Update README if user-facing
   - Add inline comments
   - Update CHANGELOG

### Example: Adding a New Export Format

```javascript
// 1. Add to export-manager.js
async exportAsYAML(note) {
  // Implementation
}

// 2. Update supportedFormats array
this.supportedFormats = [..., 'yaml'];

// 3. Add case in exportNote() switch
case 'yaml':
  return this.exportAsYAML(note);

// 4. Add UI button in sidepanel
<button onclick="exportNote(noteId, 'yaml')">Export as YAML</button>
```

## API Integration

### Working with Gemini API

All API calls go through `api-manager.js`:

```javascript
// Get next available key
const apiKey = await apiKeyManager.getNextKey();

// Make API call
const genAI = new GoogleGenerativeAI(apiKey.key);
const model = genAI.getGenerativeModel({ model: apiKey.model });
const result = await model.generateContent(prompt);

// Record success/failure
await apiKeyManager.recordSuccess(apiKey.id, tokensUsed);
// or
await apiKeyManager.recordFailure(apiKey.id, error);
```

### Error Handling

Always wrap API calls:

```javascript
try {
  const result = await someAsyncOperation();
  return { success: true, result };
} catch (error) {
  console.error('Operation failed:', error);
  return { success: false, error: error.message };
}
```

## Storage Best Practices

### Reading Data
```javascript
// Get all notes
const notes = await storageManager.getNotes();

// Get with filters
const islamicNotes = await storageManager.getNotes({
  category: 'Islamic Studies'
});

// Get single note
const note = await storageManager.getNote(noteId);
```

### Writing Data
```javascript
// Create
const note = await storageManager.createNote(notebookId, noteData);

// Update
await storageManager.updateNote(noteId, {
  category: 'New Category'
});

// Delete
await storageManager.deleteNote(noteId);
```

### Search
```javascript
const results = await storageManager.search('query', {
  category: 'Islamic Studies',
  sortBy: 'relevance',
  dateRange: { start: timestamp1, end: timestamp2 }
});
```

## UI Development

### Tailwind CSS Classes

Common patterns:

```html
<!-- Card -->
<div class="card p-6 space-y-4">
  <!-- Card content -->
</div>

<!-- Button -->
<button class="btn btn-primary">
  Click me
</button>

<!-- Input -->
<input type="text" class="input" placeholder="Enter text">

<!-- Badge -->
<span class="badge badge-primary">Tag</span>
```

### Dark Mode

Use dark mode variants:

```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

### RTL Support

For Urdu/Arabic text:

```html
<p class="urdu">یہ اردو متن ہے</p>
<p class="arabic">هذا نص عربي</p>
```

## Debugging

### Chrome DevTools

1. **Background script:**
   - Go to `chrome://extensions/`
   - Click "Service worker" link under extension

2. **Popup:**
   - Right-click popup → "Inspect"

3. **Sidepanel:**
   - Open sidepanel
   - Right-click → "Inspect"

4. **Content script:**
   - Open DevTools on the video page
   - Console will show content script logs

### Common Issues

**Extension not loading:**
- Check manifest.json syntax
- Check for console errors
- Ensure all files exist

**API calls failing:**
- Check API key validity
- Check network tab in DevTools
- Check API quota limits

**Storage not persisting:**
- Check chrome.storage permissions
- Check for errors in background worker
- Verify data format

## Performance Optimization

### Best Practices

1. **Lazy load data:**
```javascript
// Don't load all notes at once
// Load on-demand or in batches
```

2. **Use indexes:**
```javascript
// storageManager maintains indexes for fast lookups
```

3. **Debounce search:**
```javascript
let searchTimeout;
input.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(e.target.value);
  }, 300);
});
```

4. **Cache AI responses:**
```javascript
// Cache common queries to reduce API calls
```

## Release Process

### Version Update

1. Update version in `manifest.json`
2. Update version in `package.json`
3. Update CHANGELOG.md
4. Create git tag: `git tag v1.0.0`
5. Push tag: `git push origin v1.0.0`

### Building for Release

```bash
# Build production version
npm run build

# Create zip for Chrome Web Store
zip -r ilmai-v1.0.0.zip * -x "node_modules/*" -x ".git/*"
```

### Chrome Web Store Submission

1. Build and test thoroughly
2. Create promotional images (1280x800, 640x400, 440x280)
3. Write store description
4. Submit to Chrome Web Store
5. Wait for review (typically 1-3 days)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)

## Getting Help

- 📖 [User Guide](README.md)
- 🐛 [Report Issues](https://github.com/ilmai/urdu-notes-extension/issues)
- 💬 [Discussions](https://github.com/ilmai/urdu-notes-extension/discussions)
