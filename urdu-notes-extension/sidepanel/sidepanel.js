/**
 * Sidepanel Script
 * Main notes interface
 */

let currentFilter = 'all';
let allNotes = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadNotes();
  initializeTheme();
});

// Setup event listeners
function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', handleSearch);

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      filterNotes();
    });
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // FAB
  document.getElementById('fabBtn').addEventListener('click', () => {
    // Open current page for capture
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'START_VIDEO_CAPTURE' });
      }
    });
  });

  // Get started
  document.getElementById('getStartedBtn')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Modal close
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
}

// Load notes
async function loadNotes() {
  try {
    showLoading(true);

    const response = await chrome.runtime.sendMessage({
      type: 'SEARCH_NOTES',
      query: '',
      options: {}
    });

    if (response.success) {
      allNotes = response.results || [];
      renderNotes(allNotes);
    }

    showLoading(false);
  } catch (error) {
    console.error('Error loading notes:', error);
    showLoading(false);
  }
}

// Render notes
function renderNotes(notes) {
  const notesList = document.getElementById('notesList');
  const emptyState = document.getElementById('emptyState');

  if (notes.length === 0) {
    notesList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  notesList.classList.remove('hidden');

  notesList.innerHTML = notes.map(note => createNoteCard(note)).join('');

  // Add click listeners
  notesList.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', () => {
      const noteId = card.dataset.noteId;
      openNoteDetail(noteId);
    });
  });
}

// Create note card HTML
function createNoteCard(note) {
  const date = new Date(note.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const favoriteIcon = note.metadata.isFavorite ? '⭐' : '';
  const category = note.category || 'Uncategorized';
  const tags = note.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('');

  return `
    <div class="note-card" data-note-id="${note.id}">
      <div class="flex items-start space-x-3">
        <div class="note-thumbnail">
          ${note.thumbnail ? `<img src="${note.thumbnail}" alt="">` : '📹'}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between">
            <h3 class="note-title">${favoriteIcon} ${escapeHtml(note.videoTitle)}</h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">${date}</span>
          </div>
          <p class="note-summary">${escapeHtml(note.content.summary.oneLine || note.content.rawTranscription.substring(0, 100) + '...')}</p>
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center space-x-2">
              <span class="category-badge">${category}</span>
              ${tags}
            </div>
            <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>👁 ${note.metadata.viewCount || 0}</span>
              ${note.duration ? `<span>⏱ ${formatDuration(note.duration)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Open note detail
async function openNoteDetail(noteId) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_NOTE',
      noteId
    });

    if (response.success && response.note) {
      showNoteModal(response.note);
    }
  } catch (error) {
    console.error('Error opening note:', error);
  }
}

// Show note modal
function showNoteModal(note) {
  const modal = document.getElementById('noteModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = note.videoTitle;

  body.innerHTML = `
    <div class="space-y-4">
      <!-- Metadata -->
      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="text-sm">
          <span class="text-gray-600 dark:text-gray-400">Category:</span>
          <span class="font-medium text-gray-900 dark:text-white ml-2">${note.category}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button class="btn-icon" onclick="favoriteNote('${note.id}')">
            ${note.metadata.isFavorite ? '⭐' : '☆'}
          </button>
          <button class="btn-icon" onclick="exportNote('${note.id}')">📥</button>
          <button class="btn-icon" onclick="shareNote('${note.id}')">🔗</button>
        </div>
      </div>

      <!-- Summary -->
      ${note.content.summary.detailed ? `
        <div>
          <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Summary</h3>
          <p class="text-gray-700 dark:text-gray-300">${escapeHtml(note.content.summary.detailed)}</p>
        </div>
      ` : ''}

      <!-- Key Points -->
      ${note.content.keyPoints.length > 0 ? `
        <div>
          <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Key Points</h3>
          <ul class="list-disc list-inside space-y-1">
            ${note.content.keyPoints.map(point => `<li class="text-gray-700 dark:text-gray-300">${escapeHtml(point)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Transcription -->
      <div>
        <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Transcription</h3>
        <div class="transcription-content">
          ${note.content.formattedTranscription.length > 0 ?
            note.content.formattedTranscription.map(seg => `
              <div class="transcript-segment">
                <span class="timestamp">[${formatDuration(seg.timestamp)}]</span>
                ${seg.speaker !== 'Unknown' ? `<span class="speaker">${escapeHtml(seg.speaker)}:</span>` : ''}
                <span class="text-gray-700 dark:text-gray-300">${escapeHtml(seg.text)}</span>
              </div>
            `).join('') :
            `<p class="text-gray-700 dark:text-gray-300">${escapeHtml(note.content.rawTranscription)}</p>`
          }
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button class="btn-primary" onclick="askQuestion('${note.id}')">💬 Ask Question</button>
        <button class="btn-secondary" onclick="generateFlashcards('${note.id}')">🃏 Flashcards</button>
        <button class="btn-secondary" onclick="generateQuiz('${note.id}')">📝 Quiz</button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

// Close modal
function closeModal() {
  document.getElementById('noteModal').classList.add('hidden');
}

// Handle search
async function handleSearch(e) {
  const query = e.target.value.trim();

  if (query.length === 0) {
    renderNotes(allNotes);
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SEARCH_NOTES',
      query,
      options: { sortBy: 'relevance' }
    });

    if (response.success) {
      renderNotes(response.results);
    }
  } catch (error) {
    console.error('Search error:', error);
  }
}

// Filter notes
function filterNotes() {
  let filtered = allNotes;

  switch (currentFilter) {
    case 'favorites':
      filtered = allNotes.filter(n => n.metadata.isFavorite);
      break;
    case 'recent':
      filtered = allNotes.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
      break;
    case 'islamic':
      filtered = allNotes.filter(n => n.category === 'Islamic Studies');
      break;
    case 'education':
      filtered = allNotes.filter(n => n.category === 'Education');
      break;
  }

  renderNotes(filtered);
}

// Show loading
function showLoading(show) {
  const loading = document.getElementById('loadingState');
  const notesList = document.getElementById('notesList');
  const emptyState = document.getElementById('emptyState');

  if (show) {
    loading.classList.remove('hidden');
    notesList.classList.add('hidden');
    emptyState.classList.add('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

// Theme management
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'auto';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = localStorage.getItem('theme') || 'auto';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
}

function applyTheme(theme) {
  if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Utility functions
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Global functions for modal actions
window.favoriteNote = async (noteId) => {
  // Implementation
  console.log('Favorite:', noteId);
};

window.exportNote = async (noteId) => {
  // Implementation
  console.log('Export:', noteId);
};

window.shareNote = async (noteId) => {
  // Implementation
  console.log('Share:', noteId);
};

window.askQuestion = async (noteId) => {
  // Implementation
  console.log('Ask question:', noteId);
};

window.generateFlashcards = async (noteId) => {
  // Implementation
  console.log('Generate flashcards:', noteId);
};

window.generateQuiz = async (noteId) => {
  // Implementation
  console.log('Generate quiz:', noteId);
};
