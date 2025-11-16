/**
 * Settings Page JavaScript
 * Handles all settings interactions and persistence
 */

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  lucide.createIcons();
});

// Load saved settings
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get(['settings']);
    if (settings.settings) {
      applySettings(settings.settings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Apply settings to UI
function applySettings(settings) {
  // Theme
  if (settings.theme) {
    document.querySelector(`.theme-btn[data-theme="${settings.theme}"]`)?.classList.add('active');
  }

  // Font size
  if (settings.fontSize) {
    document.getElementById('fontSizeSlider').value = settings.fontSize;
    document.getElementById('fontSizeValue').textContent = settings.fontSize + 'px';
  }

  // Other settings...
}

// Setup event listeners
function setupEventListeners() {
  // Section headers (accordion)
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const chevron = header.querySelector('.chevron');

      // Toggle this section
      const isOpen = !content.classList.contains('hidden');

      if (isOpen) {
        content.classList.add('hidden');
        header.setAttribute('aria-expanded', 'false');
      } else {
        content.classList.remove('hidden');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Theme selection
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettings();
    });
  });

  // Color swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      saveSettings();
    });
  });

  // Font size slider
  const fontSizeSlider = document.getElementById('fontSizeSlider');
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', (e) => {
      document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
    });
    fontSizeSlider.addEventListener('change', saveSettings);
  }

  // Confidence slider
  const confidenceSlider = document.getElementById('confidenceSlider');
  if (confidenceSlider) {
    confidenceSlider.addEventListener('input', (e) => {
      document.getElementById('confidenceValue').textContent = e.target.value + '%';
    });
    confidenceSlider.addEventListener('change', saveSettings);
  }

  // Radio groups
  document.querySelectorAll('.radio-label').forEach(label => {
    label.addEventListener('click', () => {
      const group = label.closest('.radio-group');
      group.querySelectorAll('.radio-label').forEach(l => l.classList.remove('active'));
      label.classList.add('active');
      saveSettings();
    });
  });

  // Toggle switches
  document.querySelectorAll('.toggle-switch input').forEach(toggle => {
    toggle.addEventListener('change', saveSettings);
  });

  // Select inputs
  document.querySelectorAll('.select-input').forEach(select => {
    select.addEventListener('change', saveSettings);
  });

  // Save button
  document.getElementById('saveBtn')?.addEventListener('click', () => {
    saveSettings();
    showToast('Settings saved successfully!', 'success');
  });
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      theme: document.querySelector('.theme-btn.active')?.dataset.theme || 'light',
      accentColor: document.querySelector('.color-swatch.active')?.dataset.color || 'blue',
      fontSize: document.getElementById('fontSizeSlider')?.value || 16,
      density: document.querySelector('.radio-label.active input[name="density"]')?.value || 'comfortable',
      quality: document.querySelector('.radio-label.active input[name="quality"]')?.value || 'balanced',
      autoDetectLanguage: document.querySelector('input[type="checkbox"]:checked') !== null,
      // Add more settings as needed
    };

    await chrome.storage.local.set({ settings });
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings', 'error');
  }
}

// Toast notification
function showToast(message, type = 'info') {
  const colors = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#06B6D4'
  };

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: white;
    border-left: 4px solid ${colors[type]};
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    padding: 16px 20px;
    font-size: 14px;
    font-weight: 600;
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

// CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fade-out {
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
`;
document.head.appendChild(style);

console.log('Settings page loaded');
