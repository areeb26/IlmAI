/**
 * AI Assistant
 * Handles all AI-powered features including Q&A, summarization, and content generation
 */

import { apiKeyManager } from '../background/api-manager.js';

export class AIAssistant {
  constructor() {
    this.conversationHistory = new Map();
    this.maxHistoryLength = 10;
  }

  /**
   * Generate summary from transcription
   */
  async generateSummary(transcription, type = 'medium', options = {}) {
    try {
      const apiKey = await apiKeyManager.getNextKey();
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);
      const model = genAI.getGenerativeModel({ model: apiKey.model });

      let prompt = '';

      switch (type) {
        case 'oneline':
          prompt = `Provide a single-line summary (max 150 characters) of this content in ${options.language || 'Urdu'}:\n\n${transcription}`;
          break;

        case 'executive':
          prompt = `Provide an executive summary with 3-5 key bullet points in ${options.language || 'Urdu'}:\n\n${transcription}`;
          break;

        case 'detailed':
          prompt = `Provide a detailed summary organized by sections in ${options.language || 'Urdu'}. Include:\n- Main topics\n- Key concepts\n- Important details\n\nContent:\n${transcription}`;
          break;

        default:
          prompt = `Provide a medium-length summary (2-3 paragraphs) in ${options.language || 'Urdu'}:\n\n${transcription}`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      await apiKeyManager.recordSuccess(apiKey.id, this.estimateTokens(summary));

      return { success: true, summary };

    } catch (error) {
      console.error('Summary generation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract key points from content
   */
  async extractKeyPoints(transcription, maxPoints = 10) {
    try {
      const apiKey = await apiKeyManager.getNextKey();
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);
      const model = genAI.getGenerativeModel({
        model: apiKey.model,
        generationConfig: { response_mime_type: "application/json" }
      });

      const prompt = `Extract the ${maxPoints} most important key points from this content. Return as JSON array with format: [{point: string, importance: number, timestamp: string}]\n\nContent:\n${transcription}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const keyPoints = JSON.parse(response.text());

      await apiKeyManager.recordSuccess(apiKey.id);

      return { success: true, keyPoints };

    } catch (error) {
      console.error('Key points extraction error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-categorize content
   */
  async categorizeContent(transcription, title) {
    try {
      const apiKey = await apiKeyManager.getNextKey();
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);
      const model = genAI.getGenerativeModel({
        model: apiKey.model,
        generationConfig: { response_mime_type: "application/json" }
      });

      const prompt = `Analyze this content and provide categorization. Return JSON with:
{
  "category": "main category",
  "subcategories": ["sub1", "sub2"],
  "tags": ["tag1", "tag2", "tag3"],
  "language": "detected language code",
  "topics": ["topic1", "topic2"]
}

Available categories: Islamic Studies, History, Science, Technology, Business, Education, Health, Arts, Literature, Current Affairs, Philosophy, Other

Title: ${title}
Content: ${transcription.substring(0, 2000)}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const categorization = JSON.parse(response.text());

      await apiKeyManager.recordSuccess(apiKey.id);

      return { success: true, ...categorization };

    } catch (error) {
      console.error('Categorization error:', error);
      return {
        success: false,
        category: 'Uncategorized',
        subcategories: [],
        tags: [],
        language: 'ur',
        topics: []
      };
    }
  }

  /**
   * Extract entities (names, dates, verses, hadith, etc.)
   */
  async extractEntities(transcription) {
    try {
      const apiKey = await apiKeyManager.getNextKey();
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);
      const model = genAI.getGenerativeModel({
        model: apiKey.model,
        generationConfig: { response_mime_type: "application/json" }
      });

      const prompt = `Extract all entities from this Urdu/Islamic content. Return JSON with:
{
  "people": ["names of people mentioned"],
  "places": ["places/locations"],
  "organizations": ["organizations/institutions"],
  "dates": ["dates and time periods"],
  "verses": ["Quranic verse references"],
  "hadith": ["Hadith references"],
  "islamicTerms": ["Islamic terminology"]
}

Content:\n${transcription}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const entities = JSON.parse(response.text());

      await apiKeyManager.recordSuccess(apiKey.id);

      return { success: true, entities };

    } catch (error) {
      console.error('Entity extraction error:', error);
      return {
        success: false,
        entities: {
          people: [],
          places: [],
          organizations: [],
          dates: [],
          verses: [],
          hadith: [],
          islamicTerms: []
        }
      };
    }
  }

  /**
   * NotebookLM-style Q&A
   */
  async askQuestion(question, context, conversationId = null) {
    try {
      const apiKey = await apiKeyManager.getNextKey();
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);
      const model = genAI.getGenerativeModel({ model: apiKey.model });

      // Get conversation history
      const history = conversationId ? this.conversationHistory.get(conversationId) || [] : [];

      // Build context with history
      let fullPrompt = `You are an AI assistant helping with Urdu video notes. Answer questions based strictly on the provided context. Always cite timestamps when referencing specific parts.\n\nContext:\n${context}\n\n`;

      if (history.length > 0) {
        fullPrompt += 'Previous conversation:\n';
        history.forEach(({ q, a }) => {
          fullPrompt += `Q: ${q}\nA: ${a}\n\n`;
        });
      }

      fullPrompt += `Question: ${question}\n\nAnswer:`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const answer = response.text();

      // Save to conversation history
      if (conversationId) {
        history.push({ q: question, a: answer, timestamp: Date.now() });
        if (history.length > this.maxHistoryLength) {
          history.shift();
        }
        this.conversationHistory.set(conversationId, history);
      }

      await apiKeyManager.recordSuccess(apiKey.id);

      return {
        success: true,
        answer,
        conversationId: conversationId || this.generateId()
      };

    } catch (error) {
      console.error('Q&A error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate flashcards
   */
  async generateFlashcards(transcription, count = 10) {
    try {
      const apiKey = await apiKeyManager.getNextKey();
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);
      const model = genAI.getGenerativeModel({
        model: apiKey.model,
        generationConfig: { response_mime_type: "application/json" }
      });

      const prompt = `Create ${count} flashcards from this content. Return JSON array:
[{
  "front": "question or term",
  "back": "answer or definition",
  "category": "category",
  "difficulty": "easy|medium|hard"
}]

Content:\n${transcription}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const flashcards = JSON.parse(response.text());

      await apiKeyManager.recordSuccess(apiKey.id);

      return { success: true, flashcards };

    } catch (error) {
      console.error('Flashcard generation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate quiz
   */
  async generateQuiz(transcription, options = {}) {
    const { questionCount = 10, types = ['mcq', 'tf', 'fill'] } = options;

    try {
      const apiKey = await apiKeyManager.getNextKey();
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);
      const model = genAI.getGenerativeModel({
        model: apiKey.model,
        generationConfig: { response_mime_type: "application/json" }
      });

      const prompt = `Create a quiz with ${questionCount} questions from this content. Include question types: ${types.join(', ')}. Return JSON:
{
  "questions": [{
    "type": "mcq|tf|fill",
    "question": "question text",
    "options": ["option1", "option2"] (for MCQ),
    "correctAnswer": "answer",
    "explanation": "explanation"
  }]
}

Content:\n${transcription}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const quiz = JSON.parse(response.text());

      await apiKeyManager.recordSuccess(apiKey.id);

      return { success: true, quiz };

    } catch (error) {
      console.error('Quiz generation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate study guide
   */
  async generateStudyGuide(transcription) {
    try {
      const apiKey = await apiKeyManager.getNextKey();
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);
      const model = genAI.getGenerativeModel({ model: apiKey.model });

      const prompt = `Create a comprehensive study guide from this content. Include:
1. Overview
2. Key Concepts (with definitions)
3. Important Points
4. Practice Questions
5. Further Reading Suggestions

Content:\n${transcription}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const studyGuide = response.text();

      await apiKeyManager.recordSuccess(apiKey.id);

      return { success: true, studyGuide };

    } catch (error) {
      console.error('Study guide generation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Translate content
   */
  async translate(text, fromLang, toLang) {
    try {
      const apiKey = await apiKeyManager.getNextKey();
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.key);
      const model = genAI.getGenerativeModel({ model: apiKey.model });

      const langNames = {
        ur: 'Urdu',
        en: 'English',
        ar: 'Arabic'
      };

      const prompt = `Translate the following text from ${langNames[fromLang]} to ${langNames[toLang]}. Preserve the meaning and tone:\n\n${text}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translation = response.text();

      await apiKeyManager.recordSuccess(apiKey.id);

      return { success: true, translation };

    } catch (error) {
      console.error('Translation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId) {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Estimate tokens
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const aiAssistant = new AIAssistant();
