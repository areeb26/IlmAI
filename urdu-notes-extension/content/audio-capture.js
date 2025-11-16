/**
 * Audio Capture System
 * Captures audio from videos on any website
 */

export class AudioCapture {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isCapturing = false;
  }

  /**
   * Start capturing audio from the current tab
   */
  async startCapture(options = {}) {
    try {
      // Request tab capture
      const streamId = await this.requestTabCapture();

      if (!streamId) {
        throw new Error('Failed to get stream ID');
      }

      // Get media stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId
          }
        },
        video: false
      });

      // Set up media recorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: options.quality === 'high' ? 128000 : 64000
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.onCaptureComplete(audioBlob);
      };

      this.mediaRecorder.start(1000); // Capture in 1-second chunks
      this.isCapturing = true;

      return { success: true };

    } catch (error) {
      console.error('Audio capture error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop capturing audio
   */
  async stopCapture() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.isCapturing = false;

    return new Blob(this.audioChunks, { type: this.getSupportedMimeType() });
  }

  /**
   * Request tab capture permission
   */
  async requestTabCapture() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'REQUEST_TAB_CAPTURE'
      }, (response) => {
        if (response && response.streamId) {
          resolve(response.streamId);
        } else {
          reject(new Error('Failed to get stream ID'));
        }
      });
    });
  }

  /**
   * Get supported MIME type
   */
  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  }

  /**
   * Callback when capture completes
   */
  onCaptureComplete(audioBlob) {
    // Send to background script for processing
    chrome.runtime.sendMessage({
      type: 'AUDIO_CAPTURED',
      audioBlob
    });
  }

  /**
   * Get capture status
   */
  getStatus() {
    return {
      isCapturing: this.isCapturing,
      duration: this.audioChunks.length,
      size: this.audioChunks.reduce((sum, chunk) => sum + chunk.size, 0)
    };
  }

  /**
   * Pause capture
   */
  pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume capture
   */
  resume() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }
}

// Export singleton
export const audioCapture = new AudioCapture();
