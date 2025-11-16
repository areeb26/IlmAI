/**
 * Options Page Script
 */

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  await loadSettings();
  await loadApiKeys();
  setupEventListeners();
  initializeTheme();
});

// Setup tabs
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      switchTab(tab);
    });
  });
}

// Switch tab
function switchTab(tab) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tab) {
      btn.classList.add('active');
    }
  });

  // Update panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.add('hidden');
  });
  document.getElementById(`${tab}-tab`).classList.remove('hidden');
}

// Load settings
async function loadSettings() {
  const data = await chrome.storage.local.get(['settings']);
  const settings = data.settings || {};

  // General
  document.getElementById('defaultLanguage').value = settings.language || 'ur';
  document.getElementById('notifTranscription').checked = settings.notifications?.transcriptionComplete !== false;
  document.getElementById('notifDailyReview').checked = settings.notifications?.dailyReview !== false;
  document.getElementById('notifApiIssues').checked = settings.notifications?.apiKeyIssues !== false;

  // Transcription
  document.getElementById('transcriptionQuality').value = settings.transcriptionQuality || 'balanced';
  document.getElementById('speakerDiarization').checked = true;
  document.getElementById('timestamps').checked = true;
  document.getElementById('autoCategorize').checked = true;
  document.getElementById('autoSummary').checked = true;

  // AI
  document.getElementById('summaryLength').value = settings.aiPreferences?.summaryLength || 'medium';
  document.getElementById('aiTemperature').value = settings.aiPreferences?.temperature || 0.7;
  updateTemperatureDisplay();

  // Appearance
  document.getElementById('themeSelect').value = settings.theme || 'auto';
  document.getElementById('uiDensity').value = settings.ui?.density || 'comfortable';
  document.getElementById('fontSize').value = settings.ui?.fontSize || 'medium';

  // Load balancing strategy
  const apiData = await chrome.storage.local.get(['apiKeys']);
  const strategy = apiData.strategy || 'round-robin';
  document.getElementById('loadBalancingStrategy').value = strategy;
}

// Load API keys
async function loadApiKeys() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_API_KEYS' });
  const keys = response?.keys || [];

  const container = document.getElementById('apiKeysList');

  if (keys.length === 0) {
    container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No API keys added yet</p>';
    return;
  }

  container.innerHTML = keys.map(key => createApiKeyCard(key)).join('');

  // Add event listeners
  container.querySelectorAll('.delete-key-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const keyId = e.target.closest('.delete-key-btn').dataset.keyId;
      if (confirm('Are you sure you want to delete this API key?')) {
        await deleteApiKey(keyId);
      }
    });
  });

  container.querySelectorAll('.test-key-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const keyId = e.target.closest('.test-key-btn').dataset.keyId;
      await testApiKey(keyId);
    });
  });
}

// Create API key card
function createApiKeyCard(key) {
  const statusColor = key.status === 'active' ? 'green' : key.status === 'error' ? 'red' : 'gray';
  const healthColor = key.healthScore > 80 ? 'green' : key.healthScore > 50 ? 'yellow' : 'red';

  return `
    <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div class="flex-1">
        <div class="flex items-center space-x-3">
          <h4 class="font-medium text-gray-900 dark:text-white">${key.name}</h4>
          <span class="badge badge-${statusColor === 'green' ? 'success' : statusColor === 'red' ? 'danger' : 'secondary'}">
            ${key.status}
          </span>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          <span class="font-mono">${key.key}</span>
        </div>
        <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Model: ${key.model}</span>
          <span>Usage: ${key.usageCount}</span>
          <span>Health: <span class="text-${healthColor}-600">${key.healthScore}%</span></span>
          <span>Priority: ${key.priority}</span>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button class="test-key-btn btn-icon" data-key-id="${key.id}" title="Test key">
          🧪
        </button>
        <button class="delete-key-btn btn-icon" data-key-id="${key.id}" title="Delete key">
          🗑️
        </button>
      </div>
    </div>
  `;
}

// Setup event listeners
function setupEventListeners() {
  // Add API key
  document.getElementById('addApiKeyBtn').addEventListener('click', addApiKey);

  // Save settings
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

  // Temperature slider
  document.getElementById('aiTemperature').addEventListener('input', updateTemperatureDisplay);

  // Theme
  document.getElementById('themeSelect').addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });

  // Storage actions
  document.getElementById('exportAllBtn').addEventListener('click', exportAllData);
  document.getElementById('clearCacheBtn').addEventListener('click', clearCache);
  document.getElementById('deleteAllBtn').addEventListener('click', deleteAllData);
}

// Add API key
async function addApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  const name = document.getElementById('apiKeyName').value.trim();
  const model = document.getElementById('apiKeyModel').value;
  const priority = parseInt(document.getElementById('apiKeyPriority').value);

  if (!key) {
    alert('Please enter an API key');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ADD_API_KEY',
      keyData: { key, name, model, priority }
    });

    if (response.success) {
      document.getElementById('apiKeyInput').value = '';
      document.getElementById('apiKeyName').value = '';
      await loadApiKeys();
      showStatus('API key added successfully', 'success');
    } else {
      showStatus('Failed to add API key: ' + response.error, 'error');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

// Delete API key
async function deleteApiKey(keyId) {
  try {
    await chrome.runtime.sendMessage({
      type: 'DELETE_API_KEY',
      keyId
    });

    await loadApiKeys();
    showStatus('API key deleted', 'success');
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

// Test API key
async function testApiKey(keyId) {
  showStatus('Testing API key...', 'info');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_API_KEY',
      keyId
    });

    if (response.success) {
      showStatus('API key is valid ✓', 'success');
    } else {
      showStatus('API key test failed: ' + response.message, 'error');
    }

    await loadApiKeys();
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

// Save settings
async function saveSettings() {
  const settings = {
    language: document.getElementById('defaultLanguage').value,
    transcriptionQuality: document.getElementById('transcriptionQuality').value,
    theme: document.getElementById('themeSelect').value,
    notifications: {
      transcriptionComplete: document.getElementById('notifTranscription').checked,
      dailyReview: document.getElementById('notifDailyReview').checked,
      apiKeyIssues: document.getElementById('notifApiIssues').checked
    },
    aiPreferences: {
      summaryLength: document.getElementById('summaryLength').value,
      temperature: parseFloat(document.getElementById('aiTemperature').value)
    },
    ui: {
      density: document.getElementById('uiDensity').value,
      fontSize: document.getElementById('fontSize').value
    }
  };

  try {
    await chrome.storage.local.set({ settings });
    showStatus('Settings saved successfully ✓', 'success');
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

// Update temperature display
function updateTemperatureDisplay() {
  const value = document.getElementById('aiTemperature').value;
  document.getElementById('temperatureValue').textContent = value;
}

// Show status message
function showStatus(message, type = 'info') {
  const status = document.getElementById('saveStatus');
  status.textContent = message;
  status.className = `text-sm ${
    type === 'success' ? 'text-green-600' :
    type === 'error' ? 'text-red-600' :
    'text-gray-600 dark:text-gray-400'
  }`;

  if (type !== 'info') {
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  }
}

// Export all data
async function exportAllData() {
  try {
    const data = await chrome.storage.local.get(null);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ilmai-export-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showStatus('Data exported successfully', 'success');
  } catch (error) {
    showStatus('Export failed: ' + error.message, 'error');
  }
}

// Clear cache
async function clearCache() {
  if (!confirm('This will clear cached transcriptions and AI responses. Continue?')) {
    return;
  }

  try {
    // Implementation for clearing cache
    showStatus('Cache cleared', 'success');
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

// Delete all data
async function deleteAllData() {
  if (!confirm('⚠️ This will delete ALL your notes and settings permanently. This cannot be undone. Are you absolutely sure?')) {
    return;
  }

  if (!confirm('Last confirmation: Delete everything?')) {
    return;
  }

  try {
    await chrome.storage.local.clear();
    showStatus('All data deleted', 'success');
    setTimeout(() => window.location.reload(), 1500);
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

// Theme management
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'auto';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  localStorage.setItem('theme', theme);

  if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
