/**
 * Content Script
 * Handles video detection and UI injection
 */

import { audioCapture } from './audio-capture.js';

let isCapturing = false;
let captureOverlay = null;
let floatingIndicator = null;

// Initialize floating indicator on page load
function initializeFloatingIndicator() {
  // Don't inject on restricted pages
  if (window.location.href.startsWith('chrome://') ||
      window.location.href.startsWith('edge://') ||
      window.location.href.startsWith('chrome-extension://')) {
    return;
  }

  createFloatingIndicator();
}

// Create floating indicator
function createFloatingIndicator() {
  // Remove existing indicator if any
  if (floatingIndicator) {
    floatingIndicator.remove();
  }

  floatingIndicator = document.createElement('div');
  floatingIndicator.id = 'ilmai-floating-indicator';
  floatingIndicator.innerHTML = `
    <div class="ilmai-indicator-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
      </svg>
    </div>
    <div class="ilmai-indicator-label">IlmAI</div>
  `;

  floatingIndicator.title = 'Toggle IlmAI Side Panel (Ctrl+Shift+I)';

  document.body.appendChild(floatingIndicator);

  // Add click listener
  floatingIndicator.addEventListener('click', toggleSidePanel);

  // Inject indicator styles
  injectIndicatorStyles();
}

// Toggle side panel
async function toggleSidePanel() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_SIDEPANEL' });

    if (response && response.success) {
      // Add visual feedback
      floatingIndicator.classList.add('ilmai-indicator-active');
      setTimeout(() => {
        floatingIndicator.classList.remove('ilmai-indicator-active');
      }, 300);
    }
  } catch (error) {
    console.error('Error toggling side panel:', error);
  }
}

// Inject indicator styles
function injectIndicatorStyles() {
  if (document.getElementById('ilmai-indicator-styles')) return;

  const style = document.createElement('style');
  style.id = 'ilmai-indicator-styles';
  style.textContent = `
    #ilmai-floating-indicator {
      position: fixed;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      z-index: 999998;
      cursor: pointer;
      background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);
      color: white;
      border-radius: 0 12px 12px 0;
      padding: 12px 8px;
      box-shadow: 4px 0 16px rgba(37, 99, 235, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
    }

    #ilmai-floating-indicator:hover {
      padding-right: 16px;
      box-shadow: 6px 0 24px rgba(37, 99, 235, 0.4);
      background: linear-gradient(135deg, #3b82f6 0%, #2563EB 100%);
    }

    #ilmai-floating-indicator:active,
    #ilmai-floating-indicator.ilmai-indicator-active {
      transform: translateY(-50%) scale(0.95);
    }

    .ilmai-indicator-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }

    .ilmai-indicator-icon svg {
      width: 20px;
      height: 20px;
      stroke: white;
    }

    .ilmai-indicator-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      opacity: 0.9;
    }

    @media (prefers-reduced-motion: reduce) {
      #ilmai-floating-indicator {
        transition: none;
      }
    }

    /* Hide on very small screens */
    @media (max-width: 640px) {
      #ilmai-floating-indicator {
        display: none;
      }
    }
  `;

  document.head.appendChild(style);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_VIDEO_CAPTURE') {
    startVideoCapture();
    sendResponse({ success: true });
  } else if (message.type === 'STOP_VIDEO_CAPTURE') {
    stopVideoCapture();
    sendResponse({ success: true });
  } else if (message.type === 'FOCUS_SEARCH') {
    // Focus search in sidepanel (handled by sidepanel)
  } else if (message.type === 'OPEN_COMMAND_PALETTE') {
    openCommandPalette();
  } else if (message.type === 'INJECT_FLOATING_INDICATOR') {
    initializeFloatingIndicator();
    sendResponse({ success: true });
  }

  return true;
});

// Start video capture
async function startVideoCapture() {
  if (isCapturing) {
    console.log('Already capturing');
    return;
  }

  try {
    // Detect video on page
    const videoInfo = detectVideo();

    if (!videoInfo) {
      showNotification('No video detected on this page', 'error');
      return;
    }

    // Create overlay
    createCaptureOverlay(videoInfo);

    // Start audio capture
    const result = await audioCapture.startCapture({ quality: 'balanced' });

    if (result.success) {
      isCapturing = true;
      updateOverlayStatus('capturing');
      showNotification('Capturing audio...', 'success');
    } else {
      showNotification('Failed to start capture: ' + result.error, 'error');
      removeCaptureOverlay();
    }
  } catch (error) {
    console.error('Video capture error:', error);
    showNotification('Error: ' + error.message, 'error');
    removeCaptureOverlay();
  }
}

// Stop video capture
async function stopVideoCapture() {
  if (!isCapturing) return;

  try {
    updateOverlayStatus('processing');

    // Stop audio capture and get blob
    const audioBlob = await audioCapture.stopCapture();

    // Send to background for transcription
    const videoInfo = detectVideo();

    chrome.runtime.sendMessage({
      type: 'START_TRANSCRIPTION',
      data: {
        audioBlob,
        options: {
          language: 'ur',
          speakerDiarization: true,
          timestamps: true
        }
      }
    }, async (response) => {
      if (response.success) {
        // Save note
        const notebookId = await getDefaultNotebookId();

        chrome.runtime.sendMessage({
          type: 'SAVE_NOTE',
          data: {
            notebookId,
            videoUrl: videoInfo.url,
            videoTitle: videoInfo.title,
            videoId: videoInfo.id,
            thumbnail: videoInfo.thumbnail,
            duration: videoInfo.duration,
            rawTranscription: response.transcription.rawText,
            formattedTranscription: response.transcription.segments || [],
            language: response.language,
            autoCategorize: true,
            generateSummary: true
          }
        }, (saveResponse) => {
          if (saveResponse.success) {
            showNotification('Note saved successfully!', 'success');
            removeCaptureOverlay();
          } else {
            showNotification('Failed to save note: ' + saveResponse.error, 'error');
          }
        });
      } else {
        showNotification('Transcription failed: ' + response.error, 'error');
      }

      isCapturing = false;
      removeCaptureOverlay();
    });
  } catch (error) {
    console.error('Stop capture error:', error);
    showNotification('Error: ' + error.message, 'error');
    isCapturing = false;
    removeCaptureOverlay();
  }
}

// Detect video on page
function detectVideo() {
  const url = window.location.href;

  // YouTube
  if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer, h1.title');
    const title = titleElement ? titleElement.textContent.trim() : 'YouTube Video';

    return {
      platform: 'youtube',
      url: url,
      id: videoId,
      title: title,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: 0 // Will be calculated from audio
    };
  }

  // Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    const titleElement = document.querySelector('h1');
    const title = titleElement ? titleElement.textContent.trim() : 'Vimeo Video';

    return {
      platform: 'vimeo',
      url: url,
      id: videoId,
      title: title,
      thumbnail: '',
      duration: 0
    };
  }

  // Generic video element
  const videoElement = document.querySelector('video');
  if (videoElement) {
    return {
      platform: 'generic',
      url: url,
      id: '',
      title: document.title || 'Video',
      thumbnail: '',
      duration: videoElement.duration || 0
    };
  }

  return null;
}

// Create capture overlay
function createCaptureOverlay(videoInfo) {
  captureOverlay = document.createElement('div');
  captureOverlay.id = 'ilmai-capture-overlay';
  captureOverlay.innerHTML = `
    <div class="ilmai-overlay-container">
      <div class="ilmai-overlay-content">
        <div class="ilmai-overlay-header">
          <img src="${chrome.runtime.getURL('assets/icons/icon48.png')}" alt="IlmAI" class="ilmai-logo">
          <h3>IlmAI - Capturing</h3>
        </div>
        <div class="ilmai-overlay-body">
          <div class="ilmai-video-info">
            <h4>${videoInfo.title}</h4>
            <p>${videoInfo.platform}</p>
          </div>
          <div class="ilmai-status" id="ilmai-status">
            <div class="ilmai-spinner"></div>
            <p>Initializing capture...</p>
          </div>
          <div class="ilmai-timer" id="ilmai-timer">0:00</div>
        </div>
        <div class="ilmai-overlay-footer">
          <button id="ilmai-stop-btn" class="ilmai-btn ilmai-btn-danger">Stop & Transcribe</button>
          <button id="ilmai-cancel-btn" class="ilmai-btn ilmai-btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(captureOverlay);

  // Add event listeners
  document.getElementById('ilmai-stop-btn').addEventListener('click', stopVideoCapture);
  document.getElementById('ilmai-cancel-btn').addEventListener('click', () => {
    audioCapture.stopCapture();
    isCapturing = false;
    removeCaptureOverlay();
  });

  // Start timer
  startCaptureTimer();

  // Inject styles
  injectOverlayStyles();
}

// Remove capture overlay
function removeCaptureOverlay() {
  if (captureOverlay) {
    captureOverlay.remove();
    captureOverlay = null;
  }
}

// Update overlay status
function updateOverlayStatus(status) {
  const statusElement = document.getElementById('ilmai-status');
  if (!statusElement) return;

  if (status === 'capturing') {
    statusElement.innerHTML = `
      <div class="ilmai-recording-indicator"></div>
      <p>Recording audio...</p>
    `;
  } else if (status === 'processing') {
    statusElement.innerHTML = `
      <div class="ilmai-spinner"></div>
      <p>Processing and transcribing...</p>
    `;
  }
}

// Start capture timer
function startCaptureTimer() {
  let seconds = 0;
  const timerElement = document.getElementById('ilmai-timer');

  const interval = setInterval(() => {
    if (!isCapturing) {
      clearInterval(interval);
      return;
    }

    seconds++;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

// Inject overlay styles
function injectOverlayStyles() {
  if (document.getElementById('ilmai-overlay-styles')) return;

  const style = document.createElement('style');
  style.id = 'ilmai-overlay-styles';
  style.textContent = `
    #ilmai-capture-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .ilmai-overlay-container {
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .ilmai-overlay-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .ilmai-logo {
      width: 40px;
      height: 40px;
    }

    .ilmai-overlay-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }

    .ilmai-video-info {
      background: #f3f4f6;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .ilmai-video-info h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .ilmai-video-info p {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
    }

    .ilmai-status {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
      background: #eff6ff;
      border-radius: 8px;
    }

    .ilmai-status p {
      margin: 0;
      color: #1e40af;
      font-weight: 500;
    }

    .ilmai-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #dbeafe;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: ilmai-spin 1s linear infinite;
    }

    .ilmai-recording-indicator {
      width: 24px;
      height: 24px;
      background: #ef4444;
      border-radius: 50%;
      animation: ilmai-pulse 1.5s ease-in-out infinite;
    }

    @keyframes ilmai-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes ilmai-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .ilmai-timer {
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      color: #1f2937;
      font-family: 'Courier New', monospace;
      margin-bottom: 20px;
    }

    .ilmai-overlay-footer {
      display: flex;
      gap: 12px;
    }

    .ilmai-btn {
      flex: 1;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ilmai-btn-danger {
      background: #ef4444;
      color: white;
    }

    .ilmai-btn-danger:hover {
      background: #dc2626;
    }

    .ilmai-btn-secondary {
      background: #e5e7eb;
      color: #374151;
    }

    .ilmai-btn-secondary:hover {
      background: #d1d5db;
    }
  `;

  document.head.appendChild(style);
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `ilmai-notification ilmai-notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('ilmai-notification-show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('ilmai-notification-show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);

  // Inject notification styles
  if (!document.getElementById('ilmai-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'ilmai-notification-styles';
    style.textContent = `
      .ilmai-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        background: white;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 1000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s;
      }

      .ilmai-notification-show {
        opacity: 1;
        transform: translateX(0);
      }

      .ilmai-notification-success {
        background: #10b981;
        color: white;
      }

      .ilmai-notification-error {
        background: #ef4444;
        color: white;
      }

      .ilmai-notification-info {
        background: #3b82f6;
        color: white;
      }
    `;
    document.head.appendChild(style);
  }
}

// Get default notebook ID
async function getDefaultNotebookId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['notebooks'], (data) => {
      const notebooks = data.notebooks || [];
      if (notebooks.length > 0) {
        resolve(notebooks[0].id);
      } else {
        // Create default notebook
        chrome.runtime.sendMessage({
          type: 'CREATE_NOTEBOOK',
          data: { name: 'My Notes' }
        }, (response) => {
          resolve(response.notebook.id);
        });
      }
    });
  });
}

// Open command palette
function openCommandPalette() {
  // Implementation for command palette
  console.log('Opening command palette...');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFloatingIndicator);
} else {
  initializeFloatingIndicator();
}

console.log('IlmAI content script loaded');
