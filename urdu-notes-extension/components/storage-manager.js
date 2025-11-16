/**
 * Storage Manager
 * Comprehensive storage management with indexing and search capabilities
 */

export class StorageManager {
  constructor() {
    this.searchIndex = new Map(); // Full-text search index
    this.categoryIndex = new Map();
    this.tagIndex = new Map();
    this.dateIndex = new Map();
    this.initialized = false;
  }

  /**
   * Initialize storage and build indexes
   */
  async initialize() {
    if (this.initialized) return;

    await this.ensureDefaultStructure();
    await this.rebuildIndexes();
    this.initialized = true;
  }

  /**
   * Ensure default storage structure exists
   */
  async ensureDefaultStructure() {
    const data = await chrome.storage.local.get([
      'workspaces',
      'notebooks',
      'notes',
      'settings',
      'analytics',
      'customPrompts'
    ]);

    const defaults = {
      workspaces: data.workspaces || [{
        id: this.generateId('ws'),
        name: 'Default Workspace',
        description: 'Your primary workspace',
        createdAt: Date.now(),
        notebooks: []
      }],
      notebooks: data.notebooks || [],
      notes: data.notes || [],
      settings: data.settings || this.getDefaultSettings(),
      analytics: data.analytics || this.getDefaultAnalytics(),
      customPrompts: data.customPrompts || this.getDefaultPrompts()
    };

    await chrome.storage.local.set(defaults);
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      theme: 'auto',
      language: 'ur',
      transcriptionQuality: 'balanced',
      autoSync: false,
      syncProvider: null,
      notifications: {
        transcriptionComplete: true,
        dailyReview: true,
        apiKeyIssues: true
      },
      shortcuts: {
        quickCapture: 'Ctrl+Shift+N',
        search: 'Ctrl+Shift+F',
        commandPalette: 'Ctrl+K'
      },
      aiPreferences: {
        summaryLength: 'medium',
        promptTemplate: 'default',
        temperature: 0.7
      },
      privacy: {
        encryptionEnabled: false,
        autoLock: false,
        lockTimeout: 300000
      },
      ui: {
        density: 'comfortable',
        fontSize: 'medium',
        fontFamily: 'default'
      }
    };
  }

  /**
   * Get default analytics structure
   */
  getDefaultAnalytics() {
    return {
      totalVideos: 0,
      totalHours: 0,
      categoryCounts: {},
      studyTime: {},
      achievements: [],
      streaks: {
        current: 0,
        longest: 0,
        lastActivity: null
      }
    };
  }

  /**
   * Get default prompts
   */
  getDefaultPrompts() {
    return [
      {
        id: this.generateId('prompt'),
        name: 'Academic Summary',
        description: 'Summarize for academic research',
        prompt: 'Summarize the following content in an academic style, focusing on key concepts, methodologies, and conclusions:\n\n{{content}}',
        variables: ['content'],
        category: 'summary'
      },
      {
        id: this.generateId('prompt'),
        name: 'Islamic Studies',
        description: 'Extract Islamic references',
        prompt: 'Extract all Quranic verses, Hadith references, and Islamic scholarly opinions from:\n\n{{content}}',
        variables: ['content'],
        category: 'extraction'
      },
      {
        id: this.generateId('prompt'),
        name: 'Generate Flashcards',
        description: 'Create study flashcards',
        prompt: 'Create 10 flashcards from the following content. Format as Q&A pairs:\n\n{{content}}',
        variables: ['content'],
        category: 'learning'
      }
    ];
  }

  // ==================== WORKSPACE OPERATIONS ====================

  async createWorkspace(name, description = '') {
    const workspaces = await this.getWorkspaces();
    const newWorkspace = {
      id: this.generateId('ws'),
      name,
      description,
      createdAt: Date.now(),
      notebooks: []
    };

    workspaces.push(newWorkspace);
    await chrome.storage.local.set({ workspaces });
    return newWorkspace;
  }

  async getWorkspaces() {
    const data = await chrome.storage.local.get(['workspaces']);
    return data.workspaces || [];
  }

  async updateWorkspace(id, updates) {
    const workspaces = await this.getWorkspaces();
    const workspace = workspaces.find(w => w.id === id);
    if (workspace) {
      Object.assign(workspace, updates);
      await chrome.storage.local.set({ workspaces });
    }
  }

  async deleteWorkspace(id) {
    const workspaces = await this.getWorkspaces();
    const notebooks = await this.getNotebooks();

    // Delete all notebooks in this workspace
    const workspaceNotebooks = notebooks.filter(n => n.workspaceId === id);
    for (const notebook of workspaceNotebooks) {
      await this.deleteNotebook(notebook.id);
    }

    // Delete workspace
    const filtered = workspaces.filter(w => w.id !== id);
    await chrome.storage.local.set({ workspaces: filtered });
  }

  // ==================== NOTEBOOK OPERATIONS ====================

  async createNotebook(workspaceId, name, options = {}) {
    const workspaces = await this.getWorkspaces();
    const notebooks = await this.getNotebooks();

    const newNotebook = {
      id: this.generateId('nb'),
      workspaceId,
      name,
      description: options.description || '',
      color: options.color || '#0ea5e9',
      icon: options.icon || '📓',
      createdAt: Date.now(),
      shareSettings: {
        isShared: false,
        permissions: []
      }
    };

    notebooks.push(newNotebook);

    // Update workspace
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      workspace.notebooks.push(newNotebook.id);
    }

    await chrome.storage.local.set({ notebooks, workspaces });
    return newNotebook;
  }

  async getNotebooks(workspaceId = null) {
    const data = await chrome.storage.local.get(['notebooks']);
    const notebooks = data.notebooks || [];
    return workspaceId ? notebooks.filter(n => n.workspaceId === workspaceId) : notebooks;
  }

  async updateNotebook(id, updates) {
    const notebooks = await this.getNotebooks();
    const notebook = notebooks.find(n => n.id === id);
    if (notebook) {
      Object.assign(notebook, updates);
      await chrome.storage.local.set({ notebooks });
    }
  }

  async deleteNotebook(id) {
    const notebooks = await this.getNotebooks();
    const notes = await this.getNotes();

    // Delete all notes in this notebook
    const notebookNotes = notes.filter(n => n.notebookId === id);
    for (const note of notebookNotes) {
      await this.deleteNote(note.id);
    }

    // Delete notebook
    const filtered = notebooks.filter(n => n.id !== id);
    await chrome.storage.local.set({ notebooks: filtered });
  }

  // ==================== NOTE OPERATIONS ====================

  async createNote(notebookId, noteData) {
    const notes = await this.getNotes();

    const newNote = {
      id: this.generateId('note'),
      notebookId,
      videoUrl: noteData.videoUrl,
      videoTitle: noteData.videoTitle || 'Untitled Video',
      videoId: noteData.videoId || this.extractVideoId(noteData.videoUrl),
      thumbnail: noteData.thumbnail || '',
      duration: noteData.duration || 0,
      timestamp: Date.now(),
      lastModified: Date.now(),
      category: noteData.category || 'Uncategorized',
      subcategories: noteData.subcategories || [],
      tags: noteData.tags || [],
      language: noteData.language || 'ur',
      speakers: noteData.speakers || [],

      content: {
        rawTranscription: noteData.rawTranscription || '',
        formattedTranscription: noteData.formattedTranscription || [],
        summary: {
          oneLine: '',
          executive: [],
          detailed: ''
        },
        keyPoints: [],
        entities: {
          people: [],
          places: [],
          organizations: [],
          dates: [],
          verses: [],
          hadith: []
        },
        outline: {},
        mindMap: {}
      },

      annotations: [],
      aiGenerated: {
        flashcards: [],
        quiz: [],
        studyGuide: '',
        questions: []
      },

      metadata: {
        viewCount: 0,
        lastViewed: null,
        rating: 0,
        isFavorite: false,
        isArchived: false,
        version: 1,
        wordCount: 0,
        readingTime: 0
      },

      links: {
        relatedNotes: [],
        backlinks: [],
        externalLinks: []
      }
    };

    notes.push(newNote);
    await chrome.storage.local.set({ notes });

    // Update indexes
    this.addToIndexes(newNote);

    // Update analytics
    await this.updateAnalytics('videoAdded');

    return newNote;
  }

  async getNotes(filters = {}) {
    const data = await chrome.storage.local.get(['notes']);
    let notes = data.notes || [];

    // Apply filters
    if (filters.notebookId) {
      notes = notes.filter(n => n.notebookId === filters.notebookId);
    }

    if (filters.category) {
      notes = notes.filter(n => n.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      notes = notes.filter(n =>
        filters.tags.some(tag => n.tags.includes(tag))
      );
    }

    if (filters.isFavorite) {
      notes = notes.filter(n => n.metadata.isFavorite);
    }

    if (filters.isArchived !== undefined) {
      notes = notes.filter(n => n.metadata.isArchived === filters.isArchived);
    }

    return notes;
  }

  async getNote(id) {
    const notes = await this.getNotes();
    const note = notes.find(n => n.id === id);

    if (note) {
      // Update view count
      note.metadata.viewCount++;
      note.metadata.lastViewed = Date.now();
      await this.updateNote(id, note);
    }

    return note;
  }

  async updateNote(id, updates) {
    const notes = await this.getNotes();
    const note = notes.find(n => n.id === id);

    if (note) {
      Object.assign(note, updates);
      note.lastModified = Date.now();
      note.metadata.version++;

      await chrome.storage.local.set({ notes });

      // Update indexes
      this.updateIndexes(note);
    }
  }

  async deleteNote(id) {
    const notes = await this.getNotes();
    const filtered = notes.filter(n => n.id !== id);

    await chrome.storage.local.set({ notes: filtered });

    // Remove from indexes
    this.removeFromIndexes(id);
  }

  // ==================== SEARCH ====================

  async search(query, options = {}) {
    const notes = await this.getNotes();
    const lowerQuery = query.toLowerCase();

    let results = notes.filter(note => {
      // Search in title
      if (note.videoTitle.toLowerCase().includes(lowerQuery)) return true;

      // Search in transcription
      if (note.content.rawTranscription.toLowerCase().includes(lowerQuery)) return true;

      // Search in tags
      if (note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;

      // Search in category
      if (note.category.toLowerCase().includes(lowerQuery)) return true;

      return false;
    });

    // Apply additional filters
    if (options.category) {
      results = results.filter(n => n.category === options.category);
    }

    if (options.dateRange) {
      results = results.filter(n =>
        n.timestamp >= options.dateRange.start &&
        n.timestamp <= options.dateRange.end
      );
    }

    // Sort results
    if (options.sortBy === 'relevance') {
      results.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a, lowerQuery);
        const scoreB = this.calculateRelevanceScore(b, lowerQuery);
        return scoreB - scoreA;
      });
    } else if (options.sortBy === 'date') {
      results.sort((a, b) => b.timestamp - a.timestamp);
    }

    return results;
  }

  calculateRelevanceScore(note, query) {
    let score = 0;

    // Title match is most important
    if (note.videoTitle.toLowerCase().includes(query)) score += 10;

    // Category match
    if (note.category.toLowerCase().includes(query)) score += 5;

    // Tag match
    if (note.tags.some(tag => tag.toLowerCase().includes(query))) score += 3;

    // Content match (check frequency)
    const content = note.content.rawTranscription.toLowerCase();
    const matches = (content.match(new RegExp(query, 'g')) || []).length;
    score += matches;

    return score;
  }

  // ==================== INDEXES ====================

  async rebuildIndexes() {
    const notes = await this.getNotes();

    this.searchIndex.clear();
    this.categoryIndex.clear();
    this.tagIndex.clear();
    this.dateIndex.clear();

    notes.forEach(note => this.addToIndexes(note));
  }

  addToIndexes(note) {
    // Category index
    if (!this.categoryIndex.has(note.category)) {
      this.categoryIndex.set(note.category, []);
    }
    this.categoryIndex.get(note.category).push(note.id);

    // Tag index
    note.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, []);
      }
      this.tagIndex.get(tag).push(note.id);
    });

    // Date index (by day)
    const date = new Date(note.timestamp).toDateString();
    if (!this.dateIndex.has(date)) {
      this.dateIndex.set(date, []);
    }
    this.dateIndex.get(date).push(note.id);
  }

  updateIndexes(note) {
    this.removeFromIndexes(note.id);
    this.addToIndexes(note);
  }

  removeFromIndexes(noteId) {
    // Remove from all indexes
    this.categoryIndex.forEach((noteIds, category) => {
      const filtered = noteIds.filter(id => id !== noteId);
      if (filtered.length === 0) {
        this.categoryIndex.delete(category);
      } else {
        this.categoryIndex.set(category, filtered);
      }
    });

    this.tagIndex.forEach((noteIds, tag) => {
      const filtered = noteIds.filter(id => id !== noteId);
      if (filtered.length === 0) {
        this.tagIndex.delete(tag);
      } else {
        this.tagIndex.set(tag, filtered);
      }
    });
  }

  // ==================== ANALYTICS ====================

  async updateAnalytics(event, data = {}) {
    const analyticsData = await chrome.storage.local.get(['analytics']);
    const analytics = analyticsData.analytics || this.getDefaultAnalytics();

    switch (event) {
      case 'videoAdded':
        analytics.totalVideos++;
        break;

      case 'studyTime':
        const today = new Date().toDateString();
        analytics.studyTime[today] = (analytics.studyTime[today] || 0) + data.duration;
        analytics.totalHours += data.duration / 3600;
        break;

      case 'categoryAdded':
        analytics.categoryCounts[data.category] = (analytics.categoryCounts[data.category] || 0) + 1;
        break;
    }

    await chrome.storage.local.set({ analytics });
  }

  // ==================== UTILITY ====================

  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractVideoId(url) {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) return youtubeMatch[1];

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return vimeoMatch[1];

    return '';
  }
}

// Singleton instance
export const storageManager = new StorageManager();
