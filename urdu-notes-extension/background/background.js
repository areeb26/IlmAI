/**
 * Background Service Worker
 * Handles extension lifecycle, tab capture, and coordination
 */

import { apiKeyManager } from './api-manager.js';
import { storageManager } from '../components/storage-manager.js';
import { transcriptionEngine } from '../components/transcription-engine.js';
import { aiAssistant } from '../components/ai-assistant.js';

// Initialize on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('IlmAI Extension installed', details);

  // Initialize storage
  await storageManager.initialize();
  await apiKeyManager.initialize();

  // Set up context menus
  chrome.contextMenus.create({
    id: 'capture-video',
    title: 'Capture and Transcribe This Video',
    contexts: ['video']
  });

  chrome.contextMenus.create({
    id: 'quick-note',
    title: 'Quick Note from Selection',
    contexts: ['selection']
  });

  // Set up alarms for periodic tasks
  chrome.alarms.create('daily-review', {
    periodInMinutes: 1440 // 24 hours
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'capture-video') {
    await startVideoCapture(tab.id, info.srcUrl);
  } else if (info.menuItemId === 'quick-note') {
    await createQuickNote(tab.id, info.selectionText);
  }
});

// Handle messages from content scripts and popups
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'REQUEST_TAB_CAPTURE':
        await handleTabCaptureRequest(sender.tab.id, sendResponse);
        break;

      case 'START_TRANSCRIPTION':
        await handleStartTranscription(message.data, sendResponse);
        break;

      case 'STOP_TRANSCRIPTION':
        await handleStopTranscription(sendResponse);
        break;

      case 'SAVE_NOTE':
        await handleSaveNote(message.data, sendResponse);
        break;

      case 'GET_NOTE':
        await handleGetNote(message.noteId, sendResponse);
        break;

      case 'SEARCH_NOTES':
        await handleSearchNotes(message.query, message.options, sendResponse);
        break;

      case 'GENERATE_SUMMARY':
        await handleGenerateSummary(message.noteId, message.type, sendResponse);
        break;

      case 'ASK_QUESTION':
        await handleAskQuestion(message.question, message.noteId, sendResponse);
        break;

      case 'GENERATE_FLASHCARDS':
        await handleGenerateFlashcards(message.noteId, message.count, sendResponse);
        break;

      case 'EXPORT_NOTE':
        await handleExportNote(message.noteId, message.format, sendResponse);
        break;

      case 'ADD_API_KEY':
        await handleAddApiKey(message.keyData, sendResponse);
        break;

      case 'TEST_API_KEY':
        await handleTestApiKey(message.keyId, sendResponse);
        break;

      case 'GET_STATS':
        await handleGetStats(sendResponse);
        break;

      case 'OPEN_SIDEPANEL':
        await chrome.sidePanel.open({ tabId: sender.tab.id });
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Tab capture request handler
async function handleTabCaptureRequest(tabId, sendResponse) {
  try {
    const streamId = await new Promise((resolve) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
        resolve(id);
      });
    });

    sendResponse({ success: true, streamId });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Start transcription
async function handleStartTranscription(data, sendResponse) {
  try {
    const result = await transcriptionEngine.transcribe(data.audioBlob, data.options);
    sendResponse(result);
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Stop transcription
async function handleStopTranscription(sendResponse) {
  transcriptionEngine.cancel();
  sendResponse({ success: true });
}

// Save note
async function handleSaveNote(noteData, sendResponse) {
  try {
    const note = await storageManager.createNote(noteData.notebookId, noteData);

    // Auto-categorize if requested
    if (noteData.autoCategorize) {
      const categorization = await aiAssistant.categorizeContent(
        note.content.rawTranscription,
        note.videoTitle
      );

      if (categorization.success) {
        await storageManager.updateNote(note.id, {
          category: categorization.category,
          subcategories: categorization.subcategories,
          tags: categorization.tags
        });
      }
    }

    // Generate summary if requested
    if (noteData.generateSummary) {
      const summary = await aiAssistant.generateSummary(
        note.content.rawTranscription,
        'medium'
      );

      if (summary.success) {
        await storageManager.updateNote(note.id, {
          'content.summary.detailed': summary.summary
        });
      }
    }

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/assets/icons/icon128.png',
      title: 'Note Saved',
      message: `"${noteData.videoTitle}" has been saved successfully.`
    });

    sendResponse({ success: true, note });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get note
async function handleGetNote(noteId, sendResponse) {
  try {
    const note = await storageManager.getNote(noteId);
    sendResponse({ success: true, note });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Search notes
async function handleSearchNotes(query, options, sendResponse) {
  try {
    const results = await storageManager.search(query, options);
    sendResponse({ success: true, results });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Generate summary
async function handleGenerateSummary(noteId, type, sendResponse) {
  try {
    const note = await storageManager.getNote(noteId);
    const result = await aiAssistant.generateSummary(note.content.rawTranscription, type);

    if (result.success) {
      await storageManager.updateNote(noteId, {
        [`content.summary.${type}`]: result.summary
      });
    }

    sendResponse(result);
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Ask question
async function handleAskQuestion(question, noteId, sendResponse) {
  try {
    const note = await storageManager.getNote(noteId);
    const context = note.content.rawTranscription;
    const result = await aiAssistant.askQuestion(question, context);
    sendResponse(result);
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Generate flashcards
async function handleGenerateFlashcards(noteId, count, sendResponse) {
  try {
    const note = await storageManager.getNote(noteId);
    const result = await aiAssistant.generateFlashcards(note.content.rawTranscription, count);

    if (result.success) {
      await storageManager.updateNote(noteId, {
        'aiGenerated.flashcards': result.flashcards
      });
    }

    sendResponse(result);
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Export note
async function handleExportNote(noteId, format, sendResponse) {
  try {
    const note = await storageManager.getNote(noteId);
    const { exportManager } = await import('../components/export-manager.js');
    const result = await exportManager.exportNote(note, format);
    sendResponse({ success: true, result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Add API key
async function handleAddApiKey(keyData, sendResponse) {
  try {
    const result = await apiKeyManager.addKey(keyData);
    sendResponse({ success: true, key: result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Test API key
async function handleTestApiKey(keyId, sendResponse) {
  try {
    const result = await apiKeyManager.testKey(keyId);
    sendResponse(result);
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get statistics
async function handleGetStats(sendResponse) {
  try {
    const apiStats = apiKeyManager.getStats();
    const analyticsData = await chrome.storage.local.get(['analytics']);
    const analytics = analyticsData.analytics || {};

    sendResponse({
      success: true,
      stats: {
        api: apiStats,
        analytics
      }
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Start video capture
async function startVideoCapture(tabId, videoUrl) {
  chrome.tabs.sendMessage(tabId, {
    type: 'START_VIDEO_CAPTURE',
    videoUrl
  });
}

// Create quick note
async function createQuickNote(tabId, text) {
  // Implementation for quick notes
  console.log('Creating quick note:', text);
}

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'daily-review') {
    // Send daily review notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/assets/icons/icon128.png',
      title: 'Daily Review Reminder',
      message: 'Time to review your notes!'
    });
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  switch (command) {
    case 'quick-capture':
      chrome.action.openPopup();
      break;

    case 'toggle-sidepanel':
      await chrome.sidePanel.open({ tabId: tab.id });
      break;

    case 'search':
      await chrome.sidePanel.open({ tabId: tab.id });
      chrome.tabs.sendMessage(tab.id, { type: 'FOCUS_SEARCH' });
      break;

    case 'command-palette':
      chrome.tabs.sendMessage(tab.id, { type: 'OPEN_COMMAND_PALETTE' });
      break;
  }
});

console.log('IlmAI Background Service Worker loaded');
