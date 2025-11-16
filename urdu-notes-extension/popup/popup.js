/**
 * Popup Script
 * Handles quick actions and current page interaction
 */

// Get current tab info
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Update page info
async function updatePageInfo() {
  try {
    const tab = await getCurrentTab();

    document.getElementById('pageTitle').textContent = tab.title || 'Untitled';
    document.getElementById('pageUrl').textContent = new URL(tab.url).hostname;

    // Set thumbnail if available
    if (tab.favIconUrl) {
      const thumbnail = document.getElementById('pageThumbnail');
      thumbnail.style.backgroundImage = `url(${tab.favIconUrl})`;
      thumbnail.style.backgroundSize = 'contain';
      thumbnail.style.backgroundRepeat = 'no-repeat';
      thumbnail.style.backgroundPosition = 'center';
    }
  } catch (error) {
    console.error('Error updating page info:', error);
  }
}

// Update stats
async function updateStats() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });

    if (response.success) {
      const { stats } = response;

      document.getElementById('totalNotes').textContent = stats.analytics.totalVideos || 0;
      document.getElementById('totalHours').textContent = Math.floor(stats.analytics.totalHours || 0);

      // API status
      const apiStatus = document.getElementById('apiStatus');
      if (stats.api.activeKeys > 0) {
        apiStatus.textContent = '✓';
        apiStatus.className = 'text-lg font-bold text-green-600 dark:text-green-400';
      } else {
        apiStatus.textContent = '!';
        apiStatus.className = 'text-lg font-bold text-red-600 dark:text-red-400';
      }
    }
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// Capture and transcribe
document.getElementById('captureBtn').addEventListener('click', async () => {
  try {
    const tab = await getCurrentTab();

    // Check if it's a video page
    const isVideoPage = tab.url.includes('youtube.com') ||
                        tab.url.includes('vimeo.com') ||
                        tab.url.includes('dailymotion.com');

    if (!isVideoPage) {
      alert('Please navigate to a video page (YouTube, Vimeo, etc.) to capture audio.');
      return;
    }

    // Inject content script if not already injected
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content.js']
    });

    // Send capture message
    chrome.tabs.sendMessage(tab.id, { type: 'START_VIDEO_CAPTURE' });

    // Close popup
    window.close();
  } catch (error) {
    console.error('Capture error:', error);
    alert('Error starting capture: ' + error.message);
  }
});

// Open sidepanel
document.getElementById('openSidepanelBtn').addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
    window.close();
  } catch (error) {
    console.error('Error opening sidepanel:', error);
  }
});

// Search
document.getElementById('searchBtn').addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
    const tab = await getCurrentTab();
    chrome.tabs.sendMessage(tab.id, { type: 'FOCUS_SEARCH' });
    window.close();
  } catch (error) {
    console.error('Error opening search:', error);
  }
});

// Settings
document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

// Help link
document.getElementById('helpLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://github.com/ilmai/urdu-notes-extension' });
  window.close();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updatePageInfo();
  updateStats();

  // Check theme
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (darkMode) {
    document.documentElement.classList.add('dark');
  }
});
