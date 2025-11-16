/**
 * Enhanced Popup Script
 * Beautiful, interactive popup functionality
 */

// State
let stats = {
  totalVideos: 0,
  totalHours: '0h 0m',
  totalCategories: 0
};

let recentNotes = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadRecentNotes();
  setupEventListeners();
  initializeLucideIcons();
});

// Load statistics
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });

    if (response && response.success) {
      stats = {
        totalVideos: response.stats.analytics?.totalVideos || 0,
        totalHours: formatDuration(response.stats.analytics?.totalHours || 0),
        totalCategories: Object.keys(response.stats.analytics?.categoryCounts || {}).length || 0
      };

      updateStatsDisplay();
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Update stats display
function updateStatsDisplay() {
  const videosEl = document.getElementById('totalVideos');
  const hoursEl = document.getElementById('totalHours');
  const categoriesEl = document.getElementById('totalCategories');

  if (videosEl) animateValue(videosEl, 0, stats.totalVideos, 800);
  if (hoursEl) hoursEl.textContent = stats.totalHours;
  if (categoriesEl) animateValue(categoriesEl, 0, stats.totalCategories, 800);
}

// Animate number value
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

// Load recent notes
async function loadRecentNotes() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SEARCH_NOTES',
      query: '',
      options: { limit: 3, sortBy: 'date' }
    });

    if (response && response.success) {
      recentNotes = response.results || [];
      renderRecentNotes();
    }
  } catch (error) {
    console.error('Error loading recent notes:', error);
  }
}

// Render recent notes
function renderRecentNotes() {
  const container = document.getElementById('recentNotes');
  if (!container || recentNotes.length === 0) return;

  // Notes are already in HTML, just add interactivity
  const noteItems = container.querySelectorAll('.note-item');
  noteItems.forEach((item, index) => {
    item.addEventListener('click', () => openNote(recentNotes[index]?.id));
  });
}

// Format duration
function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m}m`;
}

// Setup event listeners
function setupEventListeners() {
  // Record button
  const recordBtn = document.getElementById('recordBtn');
  recordBtn?.addEventListener('click', handleStartRecording);

  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  settingsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Notifications button
  const notificationBtn = document.getElementById('notificationBtn');
  notificationBtn?.addEventListener('click', handleNotifications);

  // View all button
  const viewAllBtn = document.getElementById('viewAllBtn');
  viewAllBtn?.addEventListener('click', handleViewAll);

  // Open sidepanel
  const openSidepanelBtn = document.getElementById('openSidepanelBtn');
  openSidepanelBtn?.addEventListener('click', handleOpenSidepanel);

  // AI Assistant
  const aiAssistantBtn = document.getElementById('aiAssistantBtn');
  aiAssistantBtn?.addEventListener('click', handleAIAssistant);

  // Search
  const searchInput = document.getElementById('searchInput');
  searchInput?.addEventListener('input', handleSearch);

  // Help link
  const helpLink = document.getElementById('helpLink');
  helpLink?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/ilmai/urdu-notes-extension' });
  });
}

// Handle start recording
async function handleStartRecording() {
  try {
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

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { type: 'START_VIDEO_CAPTURE' });

    showToast('Starting recording...', 'success');
    window.close();
  } catch (error) {
    console.error('Error starting recording:', error);
    showToast('Error starting recording', 'error');
  }
}

// Handle notifications
function handleNotifications() {
  showToast('Opening notifications...', 'info');
  // TODO: Implement notifications panel
}

// Handle view all
async function handleViewAll() {
  handleOpenSidepanel();
}

// Handle open sidepanel
async function handleOpenSidepanel() {
  try {
    await chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
    window.close();
  } catch (error) {
    console.error('Error opening sidepanel:', error);
    showToast('Error opening sidepanel', 'error');
  }
}

// Handle AI Assistant
function handleAIAssistant() {
  handleOpenSidepanel();
  // TODO: Send message to open AI assistant tab
}

// Handle search
let searchTimeout;
function handleSearch(e) {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();

  if (query.length < 2) return;

  searchTimeout = setTimeout(async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEARCH_NOTES',
        query,
        options: { sortBy: 'relevance' }
      });

      if (response && response.success) {
        // TODO: Show search results
        console.log('Search results:', response.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, 300);
}

// Open note
function openNote(noteId) {
  if (!noteId) return;

  // TODO: Implement note opening
  handleOpenSidepanel();
}

// Show toast notification
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

// Initialize Lucide icons
function initializeLucideIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K - Search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput')?.focus();
  }

  // Ctrl/Cmd + R - Start recording
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    handleStartRecording();
  }

  // Ctrl/Cmd + S - Settings
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  }
});

// Check API status
async function checkAPIStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');

    if (response && response.success && response.stats.api?.activeKeys > 0) {
      statusDot?.classList.add('status-dot-active');
      statusText.textContent = 'API Active';
    } else {
      statusDot?.classList.remove('status-dot-active');
      statusText.textContent = 'No API Keys';
    }
  } catch (error) {
    console.error('Error checking API status:', error);
  }
}

// Refresh data periodically
setInterval(() => {
  loadStats();
  checkAPIStatus();
}, 30000); // Every 30 seconds
