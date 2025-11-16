/**
 * Advanced API Key Manager
 * Handles multiple Gemini API keys with rotation, load balancing, and health monitoring
 */

export class APIKeyManager {
  constructor() {
    this.keys = [];
    this.currentKeyIndex = 0;
    this.loadBalancingStrategy = 'round-robin'; // round-robin, least-used, health-weighted, priority
    this.circuitBreaker = new Map(); // Track failures per key
    this.maxFailures = 3;
    this.recoveryTimeout = 60000; // 1 minute
  }

  /**
   * Initialize API keys from storage
   */
  async initialize() {
    const data = await chrome.storage.local.get(['apiKeys']);
    this.keys = data.apiKeys || [];

    // Initialize circuit breaker for each key
    this.keys.forEach(key => {
      if (!this.circuitBreaker.has(key.id)) {
        this.circuitBreaker.set(key.id, {
          failures: 0,
          lastFailure: null,
          status: 'closed' // closed, open, half-open
        });
      }
    });
  }

  /**
   * Add a new API key
   */
  async addKey(keyData) {
    const newKey = {
      id: this.generateId(),
      key: keyData.key,
      name: keyData.name || `API Key ${this.keys.length + 1}`,
      model: keyData.model || 'gemini-1.5-flash',
      status: 'active',
      priority: keyData.priority || this.keys.length,
      usageCount: 0,
      lastUsed: null,
      dailyLimit: keyData.dailyLimit || null,
      monthlyLimit: keyData.monthlyLimit || null,
      costEstimate: 0,
      errorLog: [],
      healthScore: 100,
      createdAt: Date.now()
    };

    this.keys.push(newKey);
    this.circuitBreaker.set(newKey.id, {
      failures: 0,
      lastFailure: null,
      status: 'closed'
    });

    await this.saveKeys();
    return newKey;
  }

  /**
   * Remove an API key
   */
  async removeKey(keyId) {
    this.keys = this.keys.filter(k => k.id !== keyId);
    this.circuitBreaker.delete(keyId);
    await this.saveKeys();
  }

  /**
   * Update API key
   */
  async updateKey(keyId, updates) {
    const key = this.keys.find(k => k.id === keyId);
    if (key) {
      Object.assign(key, updates);
      await this.saveKeys();
    }
  }

  /**
   * Get next available key based on load balancing strategy
   */
  async getNextKey() {
    const availableKeys = this.keys.filter(key => {
      const breaker = this.circuitBreaker.get(key.id);

      // Check circuit breaker status
      if (breaker.status === 'open') {
        // Check if recovery timeout has passed
        if (Date.now() - breaker.lastFailure > this.recoveryTimeout) {
          breaker.status = 'half-open';
        } else {
          return false;
        }
      }

      // Check if key is active
      if (key.status !== 'active') return false;

      // Check daily/monthly limits
      if (this.isLimitExceeded(key)) return false;

      return true;
    });

    if (availableKeys.length === 0) {
      throw new Error('No available API keys. Please add or check your API key configuration.');
    }

    let selectedKey;

    switch (this.loadBalancingStrategy) {
      case 'round-robin':
        selectedKey = this.roundRobin(availableKeys);
        break;

      case 'least-used':
        selectedKey = this.leastUsed(availableKeys);
        break;

      case 'health-weighted':
        selectedKey = this.healthWeighted(availableKeys);
        break;

      case 'priority':
        selectedKey = this.priority(availableKeys);
        break;

      default:
        selectedKey = availableKeys[0];
    }

    return selectedKey;
  }

  /**
   * Round-robin selection
   */
  roundRobin(keys) {
    const key = keys[this.currentKeyIndex % keys.length];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % keys.length;
    return key;
  }

  /**
   * Least-used selection
   */
  leastUsed(keys) {
    return keys.reduce((min, key) =>
      key.usageCount < min.usageCount ? key : min
    );
  }

  /**
   * Health-weighted selection
   */
  healthWeighted(keys) {
    const totalHealth = keys.reduce((sum, key) => sum + key.healthScore, 0);
    let random = Math.random() * totalHealth;

    for (const key of keys) {
      random -= key.healthScore;
      if (random <= 0) return key;
    }

    return keys[0];
  }

  /**
   * Priority-based selection
   */
  priority(keys) {
    return keys.sort((a, b) => a.priority - b.priority)[0];
  }

  /**
   * Record successful API call
   */
  async recordSuccess(keyId, tokensUsed = 0) {
    const key = this.keys.find(k => k.id === keyId);
    if (!key) return;

    key.usageCount++;
    key.lastUsed = Date.now();
    key.costEstimate += this.estimateCost(tokensUsed, key.model);

    // Update health score
    key.healthScore = Math.min(100, key.healthScore + 1);

    // Reset circuit breaker
    const breaker = this.circuitBreaker.get(keyId);
    if (breaker) {
      breaker.failures = 0;
      breaker.status = 'closed';
    }

    await this.saveKeys();
  }

  /**
   * Record failed API call
   */
  async recordFailure(keyId, error) {
    const key = this.keys.find(k => k.id === keyId);
    if (!key) return;

    // Log error
    key.errorLog.push({
      timestamp: Date.now(),
      error: error.message,
      code: error.code
    });

    // Keep only last 100 errors
    if (key.errorLog.length > 100) {
      key.errorLog = key.errorLog.slice(-100);
    }

    // Update health score
    key.healthScore = Math.max(0, key.healthScore - 10);

    // Update circuit breaker
    const breaker = this.circuitBreaker.get(keyId);
    if (breaker) {
      breaker.failures++;
      breaker.lastFailure = Date.now();

      if (breaker.failures >= this.maxFailures) {
        breaker.status = 'open';
        console.warn(`Circuit breaker opened for key ${key.name}`);
      }
    }

    await this.saveKeys();
  }

  /**
   * Check if usage limit is exceeded
   */
  isLimitExceeded(key) {
    // This is a simplified check - in production, track actual usage
    return false;
  }

  /**
   * Estimate cost based on tokens and model
   */
  estimateCost(tokens, model) {
    const pricing = {
      'gemini-1.5-flash': 0.000000075, // $0.075 per 1M tokens
      'gemini-1.5-pro': 0.00000125,    // $1.25 per 1M tokens
      'gemini-2.0-flash': 0.000000075
    };

    return (pricing[model] || 0) * tokens;
  }

  /**
   * Test an API key
   */
  async testKey(keyId) {
    const key = this.keys.find(k => k.id === keyId);
    if (!key) throw new Error('Key not found');

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(key.key);
      const model = genAI.getGenerativeModel({ model: key.model });

      await model.generateContent('Test');

      key.status = 'active';
      await this.recordSuccess(keyId);
      return { success: true, message: 'Key is valid' };
    } catch (error) {
      key.status = 'error';
      await this.recordFailure(keyId, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Test all keys
   */
  async testAllKeys() {
    const results = [];
    for (const key of this.keys) {
      const result = await this.testKey(key.id);
      results.push({ keyId: key.id, name: key.name, ...result });
    }
    return results;
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      totalKeys: this.keys.length,
      activeKeys: this.keys.filter(k => k.status === 'active').length,
      totalUsage: this.keys.reduce((sum, k) => sum + k.usageCount, 0),
      totalCost: this.keys.reduce((sum, k) => sum + k.costEstimate, 0),
      averageHealth: this.keys.reduce((sum, k) => sum + k.healthScore, 0) / this.keys.length
    };
  }

  /**
   * Set load balancing strategy
   */
  setStrategy(strategy) {
    const validStrategies = ['round-robin', 'least-used', 'health-weighted', 'priority'];
    if (validStrategies.includes(strategy)) {
      this.loadBalancingStrategy = strategy;
    }
  }

  /**
   * Save keys to storage
   */
  async saveKeys() {
    await chrome.storage.local.set({ apiKeys: this.keys });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export key configuration (without actual keys)
   */
  exportConfig() {
    return this.keys.map(key => ({
      name: key.name,
      model: key.model,
      priority: key.priority,
      dailyLimit: key.dailyLimit,
      monthlyLimit: key.monthlyLimit
    }));
  }

  /**
   * Get all keys (for management UI)
   */
  getAllKeys() {
    return this.keys.map(key => ({
      ...key,
      key: this.maskKey(key.key) // Mask the actual key
    }));
  }

  /**
   * Mask API key for display
   */
  maskKey(key) {
    if (!key || key.length < 8) return '****';
    return key.substring(0, 8) + '****' + key.substring(key.length - 4);
  }
}

// Singleton instance
export const apiKeyManager = new APIKeyManager();
