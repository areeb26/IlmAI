/**
 * Transcription Engine
 * Handles audio transcription using Gemini API with support for Urdu and mixed languages
 */

import { apiKeyManager } from '../background/api-manager.js';

export class TranscriptionEngine {
  constructor() {
    this.isTranscribing = false;
    this.currentJob = null;
    this.queue = [];
    this.quality = 'balanced'; // fast, balanced, accurate
  }

  /**
   * Transcribe audio from video
   */
  async transcribe(audioBlob, options = {}) {
    const {
      language = 'ur',
      quality = this.quality,
      speakerDiarization = false,
      timestamps = true
    } = options;

    try {
      this.isTranscribing = true;

      // Get API key
      const apiKey = await apiKeyManager.getNextKey();
      if (!apiKey) {
        throw new Error('No API key available');
      }

      // Convert audio blob to base64
      const audioData = await this.blobToBase64(audioBlob);

      // Prepare Gemini API call
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);

      // Select model based on quality
      const model = this.getModelForQuality(quality, apiKey.model);
      const genModel = genAI.getGenerativeModel({ model });

      // Create prompt for transcription
      const prompt = this.createTranscriptionPrompt(language, speakerDiarization, timestamps);

      // Make API call
      const result = await genModel.generateContent([
        {
          inlineData: {
            mimeType: audioBlob.type,
            data: audioData
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const transcriptionText = response.text();

      // Parse the response
      const transcription = this.parseTranscription(transcriptionText, timestamps, speakerDiarization);

      // Record success
      await apiKeyManager.recordSuccess(apiKey.id, this.estimateTokens(transcriptionText));

      this.isTranscribing = false;

      return {
        success: true,
        transcription,
        rawText: transcriptionText,
        language,
        duration: this.estimateDuration(audioBlob),
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Transcription error:', error);

      // Record failure
      if (this.currentJob?.apiKeyId) {
        await apiKeyManager.recordFailure(this.currentJob.apiKeyId, error);
      }

      this.isTranscribing = false;

      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Batch transcribe multiple videos
   */
  async batchTranscribe(audioBlobs, options = {}) {
    const results = [];

    for (const audioBlob of audioBlobs) {
      const result = await this.transcribe(audioBlob, options);
      results.push(result);

      // Add delay between requests to avoid rate limiting
      await this.delay(1000);
    }

    return results;
  }

  /**
   * Create transcription prompt based on settings
   */
  createTranscriptionPrompt(language, speakerDiarization, timestamps) {
    let prompt = 'Transcribe the audio accurately';

    if (language === 'ur') {
      prompt += ' in Urdu script (اردو). Preserve all Urdu text exactly as spoken';
    } else if (language === 'ar') {
      prompt += ' in Arabic script with proper diacritics';
    } else if (language === 'mixed') {
      prompt += ' in the appropriate script for each language (Urdu, English, Arabic). Auto-detect the language';
    }

    if (timestamps) {
      prompt += '. Include timestamps in the format [MM:SS] at the beginning of each paragraph or significant section';
    }

    if (speakerDiarization) {
      prompt += '. Identify different speakers and label them as Speaker 1, Speaker 2, etc. Format: [Speaker X]: text';
    }

    prompt += '. Return the transcription in a structured JSON format with the following fields: segments (array of {timestamp, speaker, text, confidence}), language, summary.';

    return prompt;
  }

  /**
   * Parse transcription response
   */
  parseTranscription(text, timestamps, speakerDiarization) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(text);
      return parsed;
    } catch (e) {
      // Fallback: parse as plain text
      return this.parseTextTranscription(text, timestamps, speakerDiarization);
    }
  }

  /**
   * Parse plain text transcription
   */
  parseTextTranscription(text, timestamps, speakerDiarization) {
    const segments = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      let timestamp = null;
      let speaker = null;
      let segmentText = line;

      // Extract timestamp
      if (timestamps) {
        const timestampMatch = line.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
        if (timestampMatch) {
          timestamp = this.parseTimestamp(timestampMatch[1]);
          segmentText = line.replace(timestampMatch[0], '').trim();
        }
      }

      // Extract speaker
      if (speakerDiarization) {
        const speakerMatch = segmentText.match(/\[?(Speaker \d+|متکلم \d+)\]?:/i);
        if (speakerMatch) {
          speaker = speakerMatch[1];
          segmentText = segmentText.replace(speakerMatch[0], '').trim();
        }
      }

      if (segmentText) {
        segments.push({
          timestamp: timestamp || 0,
          speaker: speaker || 'Unknown',
          text: segmentText,
          confidence: 0.9
        });
      }
    }

    return {
      segments,
      language: 'ur',
      summary: segments.map(s => s.text).join(' ').substring(0, 200) + '...'
    };
  }

  /**
   * Parse timestamp string to seconds
   */
  parseTimestamp(timeStr) {
    const parts = timeStr.split(':').map(p => parseInt(p));
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  /**
   * Get model based on quality setting
   */
  getModelForQuality(quality, defaultModel) {
    switch (quality) {
      case 'fast':
        return 'gemini-1.5-flash';
      case 'accurate':
        return 'gemini-1.5-pro';
      case 'balanced':
      default:
        return defaultModel || 'gemini-1.5-flash';
    }
  }

  /**
   * Convert blob to base64
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Estimate duration from audio blob
   */
  estimateDuration(audioBlob) {
    // This is a rough estimate - actual duration would need to be calculated
    // from the audio metadata
    return Math.floor(audioBlob.size / 16000); // Rough estimate
  }

  /**
   * Estimate tokens from text
   */
  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Set transcription quality
   */
  setQuality(quality) {
    const validQualities = ['fast', 'balanced', 'accurate'];
    if (validQualities.includes(quality)) {
      this.quality = quality;
    }
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel current transcription
   */
  cancel() {
    this.isTranscribing = false;
    this.currentJob = null;
  }

  /**
   * Get transcription status
   */
  getStatus() {
    return {
      isTranscribing: this.isTranscribing,
      queueLength: this.queue.length,
      currentJob: this.currentJob
    };
  }
}

// Singleton instance
export const transcriptionEngine = new TranscriptionEngine();
