// Caput Storage Manager - Local Data Management & Encryption
class CaputStorage {
  constructor() {
    this.isSupported = this.checkSupport();
    this.encryptionKey = null;
    this.initialize();
  }

  checkSupport() {
    return typeof Storage !== 'undefined' && 
           typeof indexedDB !== 'undefined' && 
           typeof crypto !== 'undefined';
  }

  async initialize() {
    if (!this.isSupported) {
      console.warn('Storage features not fully supported in this browser');
      return;
    }

    // Generate or retrieve encryption key
    await this.initializeEncryption();
    
    // Set up periodic cleanup
    this.setupCleanup();
    
    console.log('Caput Storage initialized');
  }

  async initializeEncryption() {
    let keyData = localStorage.getItem('caput_encryption_key');
    
    if (!keyData) {
      // Generate new encryption key
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      const exported = await crypto.subtle.exportKey('jwk', key);
      localStorage.setItem('caput_encryption_key', JSON.stringify(exported));
      this.encryptionKey = key;
    } else {
      // Load existing key
      const keyJson = JSON.parse(keyData);
      this.encryptionKey = await crypto.subtle.importKey(
        'jwk',
        keyJson,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    }
  }

  async encrypt(data) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(JSON.stringify(data));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      this.encryptionKey,
      dataBytes
    );

    return {
      data: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
      timestamp: Date.now()
    };
  }

  async decrypt(encryptedData) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const dataArray = new Uint8Array(encryptedData.data);
    const ivArray = new Uint8Array(encryptedData.iv);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      this.encryptionKey,
      dataArray
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decrypted);
    return JSON.parse(jsonString);
  }

  // Secure API Key Storage
  async saveApiKey(apiKey) {
    if (!apiKey) {
      throw new Error('API key cannot be empty');
    }

    const encrypted = await this.encrypt({ apiKey });
    localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.API_KEY, JSON.stringify(encrypted));
    
    // Also store a hash for validation
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    localStorage.setItem('caput_api_key_hash', JSON.stringify(hashArray));
  }

  async loadApiKey() {
    const encryptedData = localStorage.getItem(CAPUT_CONFIG.STORAGE_KEYS.API_KEY);
    if (!encryptedData) {
      return null;
    }

    try {
      const parsed = JSON.parse(encryptedData);
      const decrypted = await this.decrypt(parsed);
      return decrypted.apiKey;
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return null;
    }
  }

  async validateApiKey(apiKey) {
    const storedHash = localStorage.getItem('caput_api_key_hash');
    if (!storedHash) {
      return false;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return JSON.stringify(hashArray) === storedHash;
  }

  clearApiKey() {
    localStorage.removeItem(CAPUT_CONFIG.STORAGE_KEYS.API_KEY);
    localStorage.removeItem('caput_api_key_hash');
  }

  // User name management
  saveUserName(name) {
    if (name) {
      localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.USER_NAME, name);
    }
  }

  loadUserName() {
    return localStorage.getItem(CAPUT_CONFIG.STORAGE_KEYS.USER_NAME) || null;
  }

  clearUserName() {
    localStorage.removeItem(CAPUT_CONFIG.STORAGE_KEYS.USER_NAME);
  }

  // Settings Management
  saveSettings(settings) {
    const sanitized = this.sanitizeSettings(settings);
    localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(sanitized));
  }

  loadSettings() {
    const stored = localStorage.getItem(CAPUT_CONFIG.STORAGE_KEYS.SETTINGS);
    if (!stored) {
      return CAPUT_CONFIG.DEFAULT_SETTINGS;
    }

    try {
      const settings = JSON.parse(stored);
      return { ...CAPUT_CONFIG.DEFAULT_SETTINGS, ...settings };
    } catch (error) {
      console.error('Failed to parse settings:', error);
      return CAPUT_CONFIG.DEFAULT_SETTINGS;
    }
  }

  sanitizeSettings(settings) {
    const allowedKeys = Object.keys(CAPUT_CONFIG.DEFAULT_SETTINGS);
    const sanitized = {};

    allowedKeys.forEach(key => {
      if (settings.hasOwnProperty(key)) {
        sanitized[key] = settings[key];
      }
    });

    return sanitized;
  }

  // Chat History Management
  async saveChatHistory(history) {
    if (!Array.isArray(history)) {
      throw new Error('History must be an array');
    }

    // Limit history size
    const maxHistory = CAPUT_CONFIG.UI.MAX_CHAT_HISTORY;
    const limitedHistory = history.slice(-maxHistory);

    const encrypted = await this.encrypt(limitedHistory);
    localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(encrypted));
  }

  async loadChatHistory() {
    const encryptedData = localStorage.getItem(CAPUT_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
    if (!encryptedData) {
      return [];
    }

    try {
      const parsed = JSON.parse(encryptedData);
      return await this.decrypt(parsed);
    } catch (error) {
      console.error('Failed to decrypt chat history:', error);
      return [];
    }
  }

  clearChatHistory() {
    localStorage.removeItem(CAPUT_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
  }

  // Usage Statistics
  async saveUsageStats(stats) {
    const encrypted = await this.encrypt(stats);
    localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.USAGE_STATS, JSON.stringify(encrypted));
  }

  async loadUsageStats() {
    const encryptedData = localStorage.getItem(CAPUT_CONFIG.STORAGE_KEYS.USAGE_STATS);
    if (!encryptedData) {
      return {
        tokensUsed: 0,
        toolCallsCount: 0,
        totalCost: 0,
        sessionsCount: 0,
        lastReset: new Date().toISOString()
      };
    }

    try {
      const parsed = JSON.parse(encryptedData);
      return await this.decrypt(parsed);
    } catch (error) {
      console.error('Failed to decrypt usage stats:', error);
      return {
        tokensUsed: 0,
        toolCallsCount: 0,
        totalCost: 0,
        sessionsCount: 0,
        lastReset: new Date().toISOString()
      };
    }
  }

  // Task History Management
  async saveTaskHistory(tasks) {
    const encrypted = await this.encrypt(tasks);
    localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.TASK_HISTORY, JSON.stringify(encrypted));
  }

  async loadTaskHistory() {
    const encryptedData = localStorage.getItem(CAPUT_CONFIG.STORAGE_KEYS.TASK_HISTORY);
    if (!encryptedData) {
      return [];
    }

    try {
      const parsed = JSON.parse(encryptedData);
      return await this.decrypt(parsed);
    } catch (error) {
      console.error('Failed to decrypt task history:', error);
      return [];
    }
  }

  // IndexedDB for Large Files
  async initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CaputDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('artifacts')) {
          const artifactStore = db.createObjectStore('artifacts', { keyPath: 'id' });
          artifactStore.createIndex('timestamp', 'timestamp', { unique: false });
          artifactStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expires', 'expires', { unique: false });
        }
      };
    });
  }

  async saveArtifact(artifact) {
    const db = await this.initializeIndexedDB();
    const transaction = db.transaction(['artifacts'], 'readwrite');
    const store = transaction.objectStore('artifacts');

    const record = {
      id: `artifact_${Date.now()}_${Math.random()}`,
      ...artifact,
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.add(record);
      request.onsuccess = () => resolve(record.id);
      request.onerror = () => reject(request.error);
    });
  }

  async loadArtifacts(limit = 50) {
    const db = await this.initializeIndexedDB();
    const transaction = db.transaction(['artifacts'], 'readonly');
    const store = transaction.objectStore('artifacts');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const artifacts = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          artifacts.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(artifacts);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Cache Management - For storing temporary data, potentially for offline use.
  // Data stored here can be accessed even if the user is offline.
  // Example uses: caching results of GET API calls, temporary tool states.

  /**
   * Saves or updates an item in the IndexedDB cache.
   * @param {string} key - The unique key for the cache item.
   * @param {*} value - The value to store (can be any structured-clonable type).
   * @param {number} [ttlMinutes=60] - Time-to-live in minutes. After this duration, the item is considered expired.
   * @returns {Promise<boolean>} True if successful, rejects on error.
   */
  async setCacheItem(key, value, ttlMinutes = 60) {
    const db = await this.initializeIndexedDB();
    const transaction = db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + ttlMinutes);

    const record = {
      key,
      value,
      expires: expires.getTime(),
      created: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getCacheItem(key) {
    const db = await this.initializeIndexedDB();
    const transaction = db.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() > record.expires) {
          this.deleteCacheItem(key);
          resolve(null);
          return;
        }

        resolve(record.value);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteCacheItem(key) {
    const db = await this.initializeIndexedDB();
    const transaction = db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup and Maintenance
  setupCleanup() {
    // Clean up expired cache items every 30 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 30 * 60 * 1000);

    // Clean up old artifacts every hour
    setInterval(() => {
      this.cleanupOldArtifacts();
    }, 60 * 60 * 1000);
  }

  async cleanupExpiredCache() {
    try {
      const db = await this.initializeIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expires');

      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);

      index.openCursor(range).onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error);
    }
  }

  async cleanupOldArtifacts(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const db = await this.initializeIndexedDB();
      const transaction = db.transaction(['artifacts'], 'readwrite');
      const store = transaction.objectStore('artifacts');
      const index = store.index('timestamp');

      const cutoff = new Date(Date.now() - maxAge).toISOString();
      const range = IDBKeyRange.upperBound(cutoff);

      index.openCursor(range).onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('Failed to cleanup old artifacts:', error);
    }
  }

  // Export/Import Functions
  async exportData() {
    const data = {
      settings: this.loadSettings(),
      chatHistory: await this.loadChatHistory(),
      usageStats: await this.loadUsageStats(),
      taskHistory: await this.loadTaskHistory(),
      artifacts: await this.loadArtifacts(1000),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      if (data.version !== '1.0') {
        throw new Error('Unsupported data format version');
      }

      // Import settings
      if (data.settings) {
        this.saveSettings(data.settings);
      }

      // Import chat history
      if (data.chatHistory) {
        await this.saveChatHistory(data.chatHistory);
      }

      // Import usage stats
      if (data.usageStats) {
        await this.saveUsageStats(data.usageStats);
      }

      // Import task history
      if (data.taskHistory) {
        await this.saveTaskHistory(data.taskHistory);
      }

      // Import artifacts
      if (data.artifacts && Array.isArray(data.artifacts)) {
        for (const artifact of data.artifacts) {
          await this.saveArtifact(artifact);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  // Complete Data Wipe
  async clearAllData() {
    // Clear localStorage
    Object.values(CAPUT_CONFIG.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem('caput_encryption_key');
    localStorage.removeItem('caput_api_key_hash');

    // Clear IndexedDB
    try {
      const db = await this.initializeIndexedDB();
      const transaction = db.transaction(['artifacts', 'cache'], 'readwrite');
      
      transaction.objectStore('artifacts').clear();
      transaction.objectStore('cache').clear();
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }

    // Reinitialize encryption
    await this.initializeEncryption();
  }

  // Storage Usage Statistics
  getStorageUsage() {
    let localStorageSize = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorageSize += localStorage[key].length;
      }
    }

    return {
      localStorage: {
        used: localStorageSize,
        usedFormatted: this.formatBytes(localStorageSize),
        limit: 5 * 1024 * 1024, // ~5MB typical limit
        limitFormatted: '5 MB'
      }
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.CaputStorage = CaputStorage;
}
