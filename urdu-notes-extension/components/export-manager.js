/**
 * Export Manager
 * Handles exporting notes to various formats
 */

export class ExportManager {
  constructor() {
    this.supportedFormats = ['pdf', 'markdown', 'html', 'docx', 'json', 'txt', 'csv'];
  }

  /**
   * Export note to specified format
   */
  async exportNote(note, format, options = {}) {
    switch (format) {
      case 'json':
        return this.exportAsJSON(note);
      case 'markdown':
        return this.exportAsMarkdown(note);
      case 'html':
        return this.exportAsHTML(note);
      case 'txt':
        return this.exportAsText(note);
      case 'csv':
        return this.exportAsCSV(note);
      case 'pdf':
        return this.exportAsPDF(note);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export multiple notes
   */
  async exportMultipleNotes(notes, format, options = {}) {
    const exports = [];
    for (const note of notes) {
      const exported = await this.exportNote(note, format, options);
      exports.push(exported);
    }
    return exports;
  }

  /**
   * Export as JSON
   */
  exportAsJSON(note) {
    const data = JSON.stringify(note, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    return {
      blob,
      filename: `${this.sanitizeFilename(note.videoTitle)}.json`,
      mimeType: 'application/json'
    };
  }

  /**
   * Export as Markdown
   */
  exportAsMarkdown(note) {
    let markdown = `# ${note.videoTitle}\n\n`;
    markdown += `**Date:** ${new Date(note.timestamp).toLocaleDateString()}\n`;
    markdown += `**Category:** ${note.category}\n`;
    markdown += `**Tags:** ${note.tags.join(', ')}\n`;
    markdown += `**Video URL:** ${note.videoUrl}\n\n`;

    if (note.content.summary.oneLine) {
      markdown += `## Summary\n\n${note.content.summary.oneLine}\n\n`;
    }

    if (note.content.keyPoints && note.content.keyPoints.length > 0) {
      markdown += `## Key Points\n\n`;
      note.content.keyPoints.forEach(point => {
        markdown += `- ${point}\n`;
      });
      markdown += '\n';
    }

    markdown += `## Transcription\n\n`;

    if (note.content.formattedTranscription && note.content.formattedTranscription.length > 0) {
      note.content.formattedTranscription.forEach(segment => {
        const time = this.formatTimestamp(segment.timestamp);
        const speaker = segment.speaker !== 'Unknown' ? `**${segment.speaker}:** ` : '';
        markdown += `[${time}] ${speaker}${segment.text}\n\n`;
      });
    } else {
      markdown += note.content.rawTranscription;
    }

    if (note.annotations && note.annotations.length > 0) {
      markdown += `\n## Annotations\n\n`;
      note.annotations.forEach(annotation => {
        const time = this.formatTimestamp(annotation.timestamp);
        markdown += `### [${time}] ${annotation.type}\n${annotation.text}\n\n`;
      });
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    return {
      blob,
      filename: `${this.sanitizeFilename(note.videoTitle)}.md`,
      mimeType: 'text/markdown'
    };
  }

  /**
   * Export as HTML
   */
  exportAsHTML(note) {
    let html = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(note.videoTitle)}</title>
  <style>
    body {
      font-family: 'Noto Nastaliq Urdu', 'Arial', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      background: #f9fafb;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .metadata {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .timestamp {
      color: #667eea;
      font-weight: bold;
      margin-left: 10px;
    }
    .speaker {
      color: #764ba2;
      font-weight: bold;
    }
    .tag {
      display: inline-block;
      background: #e0e7ff;
      color: #4c51bf;
      padding: 4px 12px;
      border-radius: 16px;
      margin: 4px;
      font-size: 0.875rem;
    }
    h1, h2, h3 { color: #1f2937; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.escapeHtml(note.videoTitle)}</h1>
  </div>

  <div class="metadata">
    <p><strong>تاریخ:</strong> ${new Date(note.timestamp).toLocaleDateString('ur-PK')}</p>
    <p><strong>زمرہ:</strong> ${this.escapeHtml(note.category)}</p>
    <p><strong>ٹیگز:</strong> ${note.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</p>
    <p><strong>ویڈیو:</strong> <a href="${this.escapeHtml(note.videoUrl)}" target="_blank">لنک</a></p>
  </div>`;

    if (note.content.summary.oneLine) {
      html += `
  <div class="section">
    <h2>خلاصہ</h2>
    <p>${this.escapeHtml(note.content.summary.oneLine)}</p>
  </div>`;
    }

    if (note.content.keyPoints && note.content.keyPoints.length > 0) {
      html += `
  <div class="section">
    <h2>اہم نکات</h2>
    <ul>`;
      note.content.keyPoints.forEach(point => {
        html += `<li>${this.escapeHtml(point)}</li>`;
      });
      html += `</ul>
  </div>`;
    }

    html += `
  <div class="section">
    <h2>نقل</h2>`;

    if (note.content.formattedTranscription && note.content.formattedTranscription.length > 0) {
      note.content.formattedTranscription.forEach(segment => {
        const time = this.formatTimestamp(segment.timestamp);
        const speaker = segment.speaker !== 'Unknown' ? `<span class="speaker">${this.escapeHtml(segment.speaker)}:</span> ` : '';
        html += `<p><span class="timestamp">[${time}]</span> ${speaker}${this.escapeHtml(segment.text)}</p>`;
      });
    } else {
      html += `<p>${this.escapeHtml(note.content.rawTranscription)}</p>`;
    }

    html += `
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    return {
      blob,
      filename: `${this.sanitizeFilename(note.videoTitle)}.html`,
      mimeType: 'text/html'
    };
  }

  /**
   * Export as plain text
   */
  exportAsText(note) {
    let text = `${note.videoTitle}\n${'='.repeat(note.videoTitle.length)}\n\n`;
    text += `Date: ${new Date(note.timestamp).toLocaleDateString()}\n`;
    text += `Category: ${note.category}\n`;
    text += `Tags: ${note.tags.join(', ')}\n`;
    text += `URL: ${note.videoUrl}\n\n`;

    if (note.content.summary.oneLine) {
      text += `SUMMARY\n-------\n${note.content.summary.oneLine}\n\n`;
    }

    text += `TRANSCRIPTION\n-------------\n`;
    text += note.content.rawTranscription;

    const blob = new Blob([text], { type: 'text/plain' });
    return {
      blob,
      filename: `${this.sanitizeFilename(note.videoTitle)}.txt`,
      mimeType: 'text/plain'
    };
  }

  /**
   * Export as CSV
   */
  exportAsCSV(note) {
    let csv = 'Timestamp,Speaker,Text\n';

    if (note.content.formattedTranscription && note.content.formattedTranscription.length > 0) {
      note.content.formattedTranscription.forEach(segment => {
        const time = this.formatTimestamp(segment.timestamp);
        const speaker = segment.speaker || 'Unknown';
        const text = segment.text.replace(/"/g, '""'); // Escape quotes
        csv += `"${time}","${speaker}","${text}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    return {
      blob,
      filename: `${this.sanitizeFilename(note.videoTitle)}.csv`,
      mimeType: 'text/csv'
    };
  }

  /**
   * Export as PDF (basic implementation using HTML)
   */
  exportAsPDF(note) {
    // For a real PDF, you'd use a library like jsPDF
    // This is a simplified version that exports HTML for printing
    const htmlExport = this.exportAsHTML(note);
    return {
      ...htmlExport,
      filename: `${this.sanitizeFilename(note.videoTitle)}_print.html`,
      isPrintable: true
    };
  }

  /**
   * Download exported file
   */
  async download(exportResult) {
    const url = URL.createObjectURL(exportResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format timestamp
   */
  formatTimestamp(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

// Singleton instance
export const exportManager = new ExportManager();
