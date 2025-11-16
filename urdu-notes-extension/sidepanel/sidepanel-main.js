/**
 * Side Panel Main Script
 * Handles all side panel interactions and state management
 */

// ==================== State Management ====================
let currentView = 'dashboard';
let stats = {
  totalVideos: 0,
  totalHours: 0,
  totalCategories: 0,
  currentStreak: 0
};
let notes = [];
let chatHistory = [];
let isRecording = false;
let recordingStartTime = null;
let recordingInterval = null;

// ==================== Keep-Alive Connection ====================
let port = null;

function establishConnection() {
  try {
    port = chrome.runtime.connect({ name: 'sidepanel' });

    port.onDisconnect.addListener(() => {
      console.log('Connection lost, reconnecting...');
      setTimeout(establishConnection, 1000);
    });

    port.onMessage.addListener((message) => {
      handleBackgroundMessage(message);
    });

    console.log('Side panel connected to background');
  } catch (error) {
    console.error('Error establishing connection:', error);
    setTimeout(establishConnection, 1000);
  }
}

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('IlmAI Side Panel loaded');

  // Establish keep-alive connection
  establishConnection();

  // Load saved state
  await loadState();

  // Load data
  await loadStats();
  await loadRecentNotes();
  await checkAPIStatus();

  // Setup event listeners
  setupEventListeners();

  // Initialize Lucide icons
  initializeLucideIcons();

  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);

  // Periodic refresh
  startPeriodicRefresh();
});

// ==================== State Persistence ====================
async function loadState() {
  try {
    const result = await chrome.storage.local.get(['sidepanelState']);
    if (result.sidepanelState) {
      currentView = result.sidepanelState.currentView || 'dashboard';
      switchView(currentView);
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
}

async function saveState() {
  try {
    await chrome.storage.local.set({
      sidepanelState: {
        currentView,
        lastUpdated: Date.now()
      }
    });
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

// ==================== Event Listeners Setup ====================
function setupEventListeners() {
  // Navigation tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      switchView(view);
    });
  });

  // Settings button
  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Notifications button
  document.getElementById('notificationBtn')?.addEventListener('click', handleNotifications);

  // Search input
  document.getElementById('searchInput')?.addEventListener('input', handleSearch);

  // Dashboard quick actions
  document.getElementById('newRecordingBtn')?.addEventListener('click', () => switchView('record'));
  document.getElementById('browseNotesBtn')?.addEventListener('click', () => switchView('notes'));
  document.getElementById('askAIBtn')?.addEventListener('click', () => switchView('ai-chat'));
  document.getElementById('exportBtn')?.addEventListener('click', handleExport);

  // Recording controls
  document.getElementById('startRecordingBtn')?.addEventListener('click', handleStartRecording);
  document.getElementById('stopRecordingBtn')?.addEventListener('click', handleStopRecording);

  // Chat controls
  document.getElementById('sendChatBtn')?.addEventListener('click', handleSendChat);
  document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  });

  // Chat suggestions
  const suggestionChips = document.querySelectorAll('.suggestion-chip');
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      document.getElementById('chatInput').value = prompt;
      handleSendChat();
    });
  });

  // FAB button
  document.getElementById('fabBtn')?.addEventListener('click', handleFABClick);

  // Sync button
  document.getElementById('syncBtn')?.addEventListener('click', handleSync);

  // Notes filters
  document.getElementById('sortBy')?.addEventListener('change', handleSortChange);
  document.getElementById('filterCategory')?.addEventListener('change', handleFilterChange);

  // Auto-resize chat input
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });
  }
}

// ==================== View Switching ====================
function switchView(viewName) {
  // Update current view
  currentView = viewName;

  // Update nav tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    if (tab.dataset.view === viewName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update view containers
  const viewContainers = document.querySelectorAll('.view-container');
  viewContainers.forEach(container => {
    container.classList.remove('active');
  });

  const activeView = document.getElementById(`${viewName}View`);
  if (activeView) {
    activeView.classList.add('active');
  }

  // Load view-specific data
  loadViewData(viewName);

  // Save state
  saveState();
}

// ==================== Load View Data ====================
async function loadViewData(viewName) {
  switch (viewName) {
    case 'dashboard':
      await loadStats();
      await loadRecentActivity();
      break;
    case 'notes':
      await loadAllNotes();
      break;
    case 'record':
      checkRecordingState();
      break;
    case 'ai-chat':
      loadChatHistory();
      break;
    case 'stats':
      await loadDetailedStats();
      break;
  }
}

// ==================== Load Stats ====================
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });

    if (response && response.success) {
      stats = {
        totalVideos: response.stats.analytics?.totalVideos || 0,
        totalHours: response.stats.analytics?.totalHours || 0,
        totalCategories: Object.keys(response.stats.analytics?.categoryCounts || {}).length || 0,
        currentStreak: response.stats.analytics?.currentStreak || 0
      };

      updateStatsDisplay();
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function updateStatsDisplay() {
  // Dashboard stats
  const totalVideosEl = document.getElementById('totalVideos');
  const totalHoursEl = document.getElementById('totalHours');
  const totalCategoriesEl = document.getElementById('totalCategories');

  if (totalVideosEl) animateValue(totalVideosEl, 0, stats.totalVideos, 800);
  if (totalHoursEl) totalHoursEl.textContent = formatDuration(stats.totalHours);
  if (totalCategoriesEl) animateValue(totalCategoriesEl, 0, stats.totalCategories, 800);

  // Stats view
  const statTotalVideosEl = document.getElementById('statTotalVideos');
  const statWatchTimeEl = document.getElementById('statWatchTime');
  const statCategoriesEl = document.getElementById('statCategories');
  const currentStreakEl = document.getElementById('currentStreak');

  if (statTotalVideosEl) animateValue(statTotalVideosEl, 0, stats.totalVideos, 800);
  if (statWatchTimeEl) statWatchTimeEl.textContent = formatDuration(stats.totalHours);
  if (statCategoriesEl) animateValue(statCategoriesEl, 0, stats.totalCategories, 800);
  if (currentStreakEl) animateValue(currentStreakEl, 0, stats.currentStreak, 800);
}

// ==================== Load Notes ====================
async function loadRecentNotes() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SEARCH_NOTES',
      query: '',
      options: { limit: 5, sortBy: 'date' }
    });

    if (response && response.success) {
      notes = response.results || [];
      renderRecentActivity();
    }
  } catch (error) {
    console.error('Error loading recent notes:', error);
  }
}

async function loadAllNotes() {
  try {
    const sortBy = document.getElementById('sortBy')?.value || 'date';
    const category = document.getElementById('filterCategory')?.value || 'all';

    const response = await chrome.runtime.sendMessage({
      type: 'SEARCH_NOTES',
      query: '',
      options: {
        sortBy,
        filterCategory: category !== 'all' ? category : undefined
      }
    });

    if (response && response.success) {
      notes = response.results || [];
      renderNotesList();
    }
  } catch (error) {
    console.error('Error loading all notes:', error);
  }
}

// ==================== Render Functions ====================
function renderRecentActivity() {
  const container = document.getElementById('recentActivity');
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="inbox"></i>
        <p>No recent activity</p>
        <span>Start by recording a video!</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = notes.slice(0, 5).map(note => `
    <div class="activity-item" data-note-id="${note.id}">
      <div class="activity-icon">
        <i data-lucide="video"></i>
      </div>
      <div class="activity-content">
        <h4>${escapeHtml(note.videoTitle || 'Untitled Note')}</h4>
        <p>${formatRelativeTime(note.createdAt)}</p>
      </div>
      <button class="btn-icon-small" aria-label="Open note">
        <i data-lucide="chevron-right"></i>
      </button>
    </div>
  `).join('');

  // Add click listeners
  container.querySelectorAll('.activity-item').forEach(item => {
    item.addEventListener('click', () => {
      const noteId = item.dataset.noteId;
      openNote(noteId);
    });
  });

  lucide.createIcons();
}

function renderNotesList() {
  const container = document.getElementById('notesList');
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="file-text"></i>
        <p>No notes yet</p>
        <span>Start recording to create your first note!</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = notes.map(note => `
    <div class="note-card" data-note-id="${note.id}">
      <div class="note-card-header">
        <h3>${escapeHtml(note.videoTitle || 'Untitled Note')}</h3>
        <button class="btn-icon-small note-menu" aria-label="More options">
          <i data-lucide="more-vertical"></i>
        </button>
      </div>
      <div class="note-card-meta">
        <span class="note-meta-item">
          <i data-lucide="clock" size="14"></i>
          ${formatDuration(note.videoDuration || 0)}
        </span>
        <span class="note-meta-item">
          <i data-lucide="calendar" size="14"></i>
          ${formatRelativeTime(note.createdAt)}
        </span>
      </div>
      ${note.category ? `
        <div class="note-card-category">
          <i data-lucide="tag" size="12"></i>
          ${escapeHtml(note.category)}
        </div>
      ` : ''}
      ${note.tags && note.tags.length > 0 ? `
        <div class="note-card-tags">
          ${note.tags.slice(0, 3).map(tag => `
            <span class="tag-chip">${escapeHtml(tag)}</span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  // Add click listeners
  container.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.note-menu')) {
        const noteId = card.dataset.noteId;
        openNote(noteId);
      }
    });
  });

  lucide.createIcons();
}

// ==================== Recording Handlers ====================
async function handleStartRecording() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showToast('No active tab found', 'error');
      return;
    }

    // Check if it's a video page
    const isVideoPage = tab.url.includes('youtube.com') ||
                        tab.url.includes('vimeo.com') ||
                        tab.url.includes('dailymotion.com');

    if (!isVideoPage) {
      showToast('Please navigate to a video page', 'warning');
      return;
    }

    // Start recording
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'START_VIDEO_CAPTURE',
      options: {
        autoTranscribe: document.getElementById('autoTranscribe')?.checked,
        autoSummary: document.getElementById('autoSummary')?.checked,
        autoCategorize: document.getElementById('autoCategorize')?.checked
      }
    });

    if (response && response.success) {
      isRecording = true;
      recordingStartTime = Date.now();
      updateRecordingUI(true);
      startRecordingTimer();
      showToast('Recording started', 'success');
    }
  } catch (error) {
    console.error('Error starting recording:', error);
    showToast('Error starting recording', 'error');
  }
}

async function handleStopRecording() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { type: 'STOP_VIDEO_CAPTURE' });
    }

    isRecording = false;
    updateRecordingUI(false);
    stopRecordingTimer();
    showToast('Recording stopped', 'success');

    // Refresh notes
    await loadRecentNotes();
  } catch (error) {
    console.error('Error stopping recording:', error);
    showToast('Error stopping recording', 'error');
  }
}

function updateRecordingUI(recording) {
  const statusCard = document.querySelector('.record-status-card');
  const recordingActive = document.getElementById('recordingActive');
  const startBtn = document.getElementById('startRecordingBtn');

  if (recording) {
    statusCard?.classList.add('recording');
    recordingActive.style.display = 'block';
    startBtn.style.display = 'none';
  } else {
    statusCard?.classList.remove('recording');
    recordingActive.style.display = 'none';
    startBtn.style.display = 'flex';
  }
}

function startRecordingTimer() {
  recordingInterval = setInterval(() => {
    const elapsed = Date.now() - recordingStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const timeEl = document.getElementById('recordingTime');
    if (timeEl) {
      timeEl.textContent = timeStr;
    }
  }, 1000);
}

function stopRecordingTimer() {
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
}

function checkRecordingState() {
  // Check if recording is in progress
  // This would need to be synced with content script state
  updateRecordingUI(isRecording);
}

// ==================== Chat Handlers ====================
async function handleSendChat() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;

  // Add user message to chat
  addChatMessage('user', message);

  // Clear input
  input.value = '';
  input.style.height = 'auto';

  // Show typing indicator
  const typingId = addTypingIndicator();

  try {
    // Get context
    const context = document.getElementById('chatContext')?.value || 'all';

    // Send to AI
    const response = await chrome.runtime.sendMessage({
      type: 'ASK_QUESTION',
      question: message,
      context
    });

    // Remove typing indicator
    removeTypingIndicator(typingId);

    if (response && response.success) {
      addChatMessage('assistant', response.answer);
    } else {
      addChatMessage('assistant', 'Sorry, I encountered an error processing your request.');
    }
  } catch (error) {
    console.error('Chat error:', error);
    removeTypingIndicator(typingId);
    addChatMessage('assistant', 'Sorry, I encountered an error processing your request.');
  }
}

function addChatMessage(role, content) {
  const chatMessages = document.getElementById('chatMessages');
  const welcome = chatMessages.querySelector('.chat-welcome');

  // Hide welcome message
  if (welcome) {
    welcome.style.display = 'none';
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message chat-message-${role}`;
  messageDiv.innerHTML = `
    <div class="chat-message-avatar">
      ${role === 'user' ? '<i data-lucide="user"></i>' : '<i data-lucide="sparkles"></i>'}
    </div>
    <div class="chat-message-content">
      <div class="chat-message-text">${escapeHtml(content)}</div>
      <div class="chat-message-time">${new Date().toLocaleTimeString()}</div>
    </div>
  `;

  chatMessages.appendChild(messageDiv);
  lucide.createIcons();

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Save to history
  chatHistory.push({ role, content, timestamp: Date.now() });
}

function addTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  const typingDiv = document.createElement('div');
  const id = 'typing-' + Date.now();
  typingDiv.id = id;
  typingDiv.className = 'chat-message chat-message-assistant';
  typingDiv.innerHTML = `
    <div class="chat-message-avatar">
      <i data-lucide="sparkles"></i>
    </div>
    <div class="chat-message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  chatMessages.appendChild(typingDiv);
  lucide.createIcons();
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return id;
}

function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) {
    indicator.remove();
  }
}

function loadChatHistory() {
  // Load chat history from storage
  // For now, render existing messages
  const chatMessages = document.getElementById('chatMessages');
  const welcome = chatMessages.querySelector('.chat-welcome');

  if (chatHistory.length > 0) {
    welcome.style.display = 'none';
  }
}

// ==================== Search Handler ====================
let searchTimeout;
function handleSearch(e) {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();

  searchTimeout = setTimeout(async () => {
    if (query.length < 2) {
      // Show all notes if search is cleared
      if (currentView === 'notes') {
        await loadAllNotes();
      }
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEARCH_NOTES',
        query,
        options: { sortBy: 'relevance' }
      });

      if (response && response.success) {
        notes = response.results || [];

        // Update current view
        if (currentView === 'notes') {
          renderNotesList();
        } else if (currentView === 'dashboard') {
          renderRecentActivity();
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, 300);
}

// ==================== Other Handlers ====================
function handleNotifications() {
  showToast('Notifications coming soon!', 'info');
}

function handleExport() {
  switchView('notes');
  showToast('Select a note to export', 'info');
}

function handleFABClick() {
  if (isRecording) {
    handleStopRecording();
  } else {
    switchView('record');
    setTimeout(() => {
      document.getElementById('startRecordingBtn')?.click();
    }, 300);
  }
}

async function handleSync() {
  const syncBtn = document.getElementById('syncBtn');
  const icon = syncBtn.querySelector('i');

  icon.classList.add('rotating');
  await loadStats();
  await loadRecentNotes();
  await checkAPIStatus();
  setTimeout(() => {
    icon.classList.remove('rotating');
    showToast('Synced successfully', 'success');
  }, 1000);
}

function handleSortChange() {
  loadAllNotes();
}

function handleFilterChange() {
  loadAllNotes();
}

async function loadRecentActivity() {
  await loadRecentNotes();
}

async function loadDetailedStats() {
  await loadStats();
  // TODO: Load category breakdown, achievements, etc.
}

function openNote(noteId) {
  // TODO: Implement note viewer
  console.log('Opening note:', noteId);
  showToast('Note viewer coming soon!', 'info');
}

// ==================== API Status ====================
async function checkAPIStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
    const statusDot = document.getElementById('apiStatusDot');
    const statusText = document.getElementById('apiStatusText');

    if (response && response.success && response.stats.api?.activeKeys > 0) {
      statusDot?.classList.add('status-dot-active');
      statusText.textContent = 'API Active';
    } else {
      statusDot?.classList.remove('status-dot-active');
      statusText.textContent = 'No API Keys';
    }
  } catch (error) {
    console.error('Error checking API status:', error);
    const statusText = document.getElementById('apiStatusText');
    statusText.textContent = 'API Error';
  }
}

// ==================== Message Handlers ====================
function handleBackgroundMessage(message) {
  console.log('Message from background:', message);
  // Handle messages from background script
}

function handleRuntimeMessage(message, sender, sendResponse) {
  switch (message.type) {
    case 'FOCUS_SEARCH':
      document.getElementById('searchInput')?.focus();
      break;

    case 'START_RECORDING_FROM_SHORTCUT':
      switchView('record');
      setTimeout(() => {
        handleStartRecording();
      }, 300);
      break;

    case 'RECORDING_STOPPED':
      isRecording = false;
      updateRecordingUI(false);
      stopRecordingTimer();
      loadRecentNotes();
      break;

    case 'NOTE_CREATED':
      loadRecentNotes();
      loadStats();
      showToast('Note saved successfully', 'success');
      break;
  }

  return true;
}

// ==================== Utilities ====================
function animateValue(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);

  if (h === 0) {
    return `${m}m`;
  }
  return `${h}h ${m}m`;
}

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return new Date(timestamp).toLocaleDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const colors = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#06B6D4'
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    background: white;
    border-left: 4px solid ${colors[type]};
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    padding: 12px 16px;
    font-size: 14px;
    z-index: 10000;
    animation: slide-in-right 0.3s ease-out;
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fade-out 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function initializeLucideIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

function startPeriodicRefresh() {
  // Refresh stats every 30 seconds
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadStats();
      checkAPIStatus();
    }
  }, 30000);
}

// ==================== Keyboard Shortcuts ====================
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K - Focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput')?.focus();
  }

  // Escape - Clear search
  if (e.key === 'Escape') {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput === document.activeElement) {
      searchInput.value = '';
      searchInput.blur();
      loadAllNotes();
    }
  }
});

console.log('IlmAI Side Panel Script loaded');
