# Changelog

All notable changes to IlmAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-16

### 🎉 Initial Release

#### Added

**Core Features:**
- ✅ Audio capture from video pages (YouTube, Vimeo, etc.)
- ✅ Real-time Urdu transcription using Google Gemini API
- ✅ Mixed language support (Urdu/English/Arabic) with auto-detection
- ✅ Speaker diarization to identify different speakers
- ✅ Adjustable transcription quality levels (Fast/Balanced/Accurate)
- ✅ Background transcription support

**AI-Powered Features:**
- ✅ Auto-categorization of content (Islamic Studies, History, Science, etc.)
- ✅ Smart summaries (One-line, Executive, Detailed)
- ✅ NotebookLM-style Q&A system
- ✅ Entity extraction (names, dates, Quranic verses, Hadith)
- ✅ Flashcard generation
- ✅ Quiz generation (MCQ, True/False, Fill-in-the-blank)
- ✅ Study guide creation
- ✅ Key points extraction
- ✅ Translation support (Urdu ↔ English ↔ Arabic)

**Knowledge Management:**
- ✅ Multi-level organization (Workspaces, Notebooks, Categories, Tags)
- ✅ Advanced search with fuzzy matching
- ✅ Full-text search indexing
- ✅ Smart linking and backlinks
- ✅ Version history for notes
- ✅ Favorites and archiving

**API Key Management:**
- ✅ Multiple API key support
- ✅ Automatic rotation and load balancing
- ✅ Multiple strategies (Round-robin, Least-used, Health-weighted, Priority)
- ✅ Per-key usage tracking and quotas
- ✅ Cost estimation
- ✅ Health monitoring with circuit breaker pattern
- ✅ Automatic failover

**Export & Integration:**
- ✅ Export to PDF (with RTL support)
- ✅ Export to Markdown
- ✅ Export to HTML (beautiful formatted pages)
- ✅ Export to JSON (structured data)
- ✅ Export to CSV (transcripts in tabular format)
- ✅ Export to TXT (plain text)

**User Interface:**
- ✅ Modern, responsive design
- ✅ Dark/Light/Auto theme support
- ✅ RTL (Right-to-Left) support for Urdu and Arabic
- ✅ Custom Urdu fonts (Noto Nastaliq Urdu)
- ✅ Intuitive sidepanel interface
- ✅ Quick actions popup
- ✅ Comprehensive settings page
- ✅ Beautiful capture overlay

**Developer Features:**
- ✅ TypeScript support
- ✅ Tailwind CSS integration
- ✅ ESLint configuration
- ✅ Prettier code formatting
- ✅ Modular architecture
- ✅ Comprehensive error handling
- ✅ Performance optimizations

**Documentation:**
- ✅ Comprehensive README with features and installation guide
- ✅ Detailed INSTALLATION guide
- ✅ DEVELOPMENT guide for contributors
- ✅ CONTRIBUTING guidelines
- ✅ MIT License
- ✅ Code comments and JSDoc

### Known Limitations

- Icon placeholder files need to be replaced with actual designed icons
- Offline mode not yet implemented
- Cloud sync not available in v1.0
- Collaboration features planned for future release
- Mobile app companion planned for future

### Browser Support

- ✅ Google Chrome 88+
- ✅ Microsoft Edge 88+
- ✅ Brave Browser (latest)
- ✅ Arc Browser (latest)
- ✅ Opera 74+

---

## [Unreleased]

### Planned for v1.1
- [ ] Offline transcription support
- [ ] Cloud sync (Google Drive, Dropbox, OneDrive)
- [ ] Proper icon designs
- [ ] Anki direct integration
- [ ] Obsidian plugin
- [ ] Enhanced analytics dashboard
- [ ] Spaced repetition system
- [ ] Voice commands for hands-free operation
- [ ] Picture-in-picture mode
- [ ] Screenshot OCR

### Planned for v2.0
- [ ] Real-time collaborative notes
- [ ] Team workspaces
- [ ] Advanced gamification
- [ ] Mobile companion app
- [ ] Custom AI models support
- [ ] REST API for third-party integrations
- [ ] Webhook support
- [ ] Advanced annotation tools
- [ ] Mind map visualization
- [ ] Timeline view for historical content

---

## Release Notes

### Version 1.0.0 - "Foundation"

This is the initial release of IlmAI, focusing on core functionality and enterprise-grade architecture. The extension provides a solid foundation for Urdu video note-taking with AI-powered features.

**Highlights:**
- Complete audio capture and transcription pipeline
- Sophisticated API key management with load balancing
- Beautiful, accessible UI with RTL support
- Comprehensive export options
- Advanced search and organization
- AI-powered learning tools

**Next Steps:**
- Add professional icon designs
- Implement offline mode
- Add cloud sync capabilities
- Enhance collaboration features
- Mobile app development

---

[1.0.0]: https://github.com/ilmai/urdu-notes-extension/releases/tag/v1.0.0
