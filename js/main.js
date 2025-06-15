// Expose ModularToolsRegistry from global window if missing
if (typeof ModularToolsRegistry === 'undefined' && typeof window !== 'undefined' && window.ModularToolsRegistry) {
  var ModularToolsRegistry = window.ModularToolsRegistry;
}

// Caput Main Application - Bootstrap & Initialization
class CaputApp {
  constructor() {
    this.isInitialized = false;
    this.components = {};
    this.version = '1.0.0';
  }

  async initialize() {
    try {
      console.log(`Caput v${this.version} initializing...`);

      // Check browser compatibility
      this.checkCompatibility();

      // Initialize storage system
      this.components.storage = new CaputStorage();
      await this.components.storage.initialize();      // Initialize modular tools registry
      this.components.tools = new ModularToolsRegistry();
      await this.components.tools.initialize();

      // Initialize AI agent
      this.components.agent = new CaputAgent(CAPUT_CONFIG, this.components.tools);
        // Initialize UI controller
      this.components.ui = new CaputUI();
      await this.components.ui.initialize();

      // Make UI globally accessible for tools
      window.caputUI = this.components.ui;

      // Display tools information
      this.components.ui.displayToolsInfo();

      // Check onboarding requirements
      const apiKey = await this.components.storage.loadApiKey();
      const userName = this.components.storage.loadUserName();

      if (!apiKey || !userName) {
        this.components.ui.showOnboarding();
      } else {
        try {
          await this.components.agent.initialize();
          this.showWelcomeMessage();
        } catch (error) {
          this.showApiKeyPrompt();
        }
      }

      // Set up global error handling
      this.setupErrorHandling();

      // Set up auto-save
      this.setupAutoSave();

      // Make agent globally accessible
      window.caputAgent = this.components.agent;

      this.isInitialized = true;
      console.log('Caput initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Caput:', error);
      this.showFatalError(error);
    }
  }

  checkCompatibility() {
    const requirements = [
      { feature: 'localStorage', test: () => typeof Storage !== 'undefined' },
      { feature: 'IndexedDB', test: () => typeof indexedDB !== 'undefined' },
      { feature: 'Crypto API', test: () => typeof crypto !== 'undefined' && crypto.subtle },
      { feature: 'Fetch API', test: () => typeof fetch !== 'undefined' },
      { feature: 'ES6 Classes', test: () => typeof class {} === 'function' },
      { feature: 'Promise', test: () => typeof Promise !== 'undefined' },
      { feature: 'TextEncoder', test: () => typeof TextEncoder !== 'undefined' }
    ];

    const unsupported = requirements.filter(req => !req.test());

    if (unsupported.length > 0) {
      const missing = unsupported.map(req => req.feature).join(', ');
      throw new Error(`Browser compatibility check failed. Missing: ${missing}`);
    }

    console.log('Browser compatibility check passed');
  }

  setupErrorHandling() {
    // Track event listeners for cleanup
    this.errorHandlers = [];
    
    // Error message translations
    const errorMessages = {
      ja: {
        unexpectedError: '予期しないエラーが発生しました。詳細: {details}',
        systemError: 'システムエラーが発生しました: {error}',
        networkRestored: 'インターネット接続が復旧しました',
        networkLost: 'インターネット接続が失われました',
        retryMessage: '再試行しますか？'
      },
      en: {
        unexpectedError: 'An unexpected error occurred. Details: {details}',
        systemError: 'System error occurred: {error}',
        networkRestored: 'Internet connection restored',
        networkLost: 'Internet connection lost',
        retryMessage: 'Would you like to retry?'
      }
    };
    
    const lang = navigator.language.startsWith('ja') ? 'ja' : 'en';
    const messages = errorMessages[lang];
    
    // Global error handler with enhanced logging
    const errorHandler = (event) => {
      const errorDetails = {
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      };
      
      console.error('Global error:', errorDetails);
      
      // Log to error tracking service if available
      if (window.errorTracker) {
        window.errorTracker.logError(errorDetails);
      }
      
      this.components.ui?.showNotification(
        messages.unexpectedError.replace('{details}', errorDetails.message),
        'error',
        {
          duration: 5000,
          action: {
            label: messages.retryMessage,
            callback: () => window.location.reload()
          }
        }
      );
    };
    
    window.addEventListener('error', errorHandler);
    this.errorHandlers.push({ type: 'error', handler: errorHandler });

    // Unhandled promise rejection handler
    const rejectionHandler = (event) => {
      const errorInfo = {
        reason: event.reason?.message || event.reason || 'Unknown rejection',
        promise: event.promise,
        timestamp: new Date().toISOString()
      };
      
      console.error('Unhandled promise rejection:', errorInfo);
      
      this.components.ui?.showNotification(
        messages.systemError.replace('{error}', errorInfo.reason),
        'error',
        { duration: 5000 }
      );
      event.preventDefault();
    };
    
    window.addEventListener('unhandledrejection', rejectionHandler);
    this.errorHandlers.push({ type: 'unhandledrejection', handler: rejectionHandler });

    // Network error detection with debounce
    let networkTimeout;
    const networkOnlineHandler = () => {
      clearTimeout(networkTimeout);
      networkTimeout = setTimeout(() => {
        this.components.ui?.showNotification(messages.networkRestored, 'success');
        // Retry failed operations if any
        this.retryFailedOperations();
      }, 1000);
    };
    
    const networkOfflineHandler = () => {
      clearTimeout(networkTimeout);
      this.components.ui?.showNotification(messages.networkLost, 'warning');
    };
    
    window.addEventListener('online', networkOnlineHandler);
    window.addEventListener('offline', networkOfflineHandler);
    this.errorHandlers.push(
      { type: 'online', handler: networkOnlineHandler },
      { type: 'offline', handler: networkOfflineHandler }
    );
  }
  
  // New method to retry failed operations
  retryFailedOperations() {
    if (this.failedOperations && this.failedOperations.length > 0) {
      console.log('Retrying failed operations...');
      this.failedOperations.forEach(op => {
        if (op.retry) {
          op.retry();
        }
      });
      this.failedOperations = [];
    }
  }

  setupAutoSave() {
    const autoSaveInterval = CAPUT_CONFIG.UI.AUTO_SAVE_INTERVAL;
    
    // Store interval ID for cleanup
    this.autoSaveIntervalId = setInterval(async () => {
      // Check if document is visible to avoid saving when tab is inactive
      if (document.visibilityState === 'hidden') {
        return;
      }
      
      try {
        if (this.components.ui && this.components.storage) {
          // Batch save operations
          const savePromises = [
            this.components.storage.saveChatHistory(this.components.ui.chatHistory),
            this.components.storage.saveUsageStats(this.components.agent.getSessionStats())
          ];
          
          // Add more save operations if needed
          if (this.components.ui.settings) {
            savePromises.push(
              this.components.storage.saveSettings(this.components.ui.settings)
            );
          }
          
          await Promise.all(savePromises);
          console.log('Auto-save completed');
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Queue for retry when connection is restored
        if (!this.failedOperations) {
          this.failedOperations = [];
        }
        this.failedOperations.push({
          type: 'autoSave',
          retry: () => this.performAutoSave()
        });
      }
    }, autoSaveInterval);
    
    // Save immediately when tab becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.performAutoSave();
      }
    });
  }
  
  async performAutoSave() {
    try {
      if (this.components.ui && this.components.storage) {
        await Promise.all([
          this.components.storage.saveChatHistory(this.components.ui.chatHistory),
          this.components.storage.saveUsageStats(this.components.agent.getSessionStats())
        ]);
      }
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  }

  showWelcomeMessage() {
    // Welcome message is already in HTML, just update status
    const statusIndicator = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-indicator span');
    
    if (statusIndicator && statusText) {
      statusIndicator.className = 'status-dot ready';
      statusText.textContent = '準備完了';
    }
  }

  showApiKeyPrompt() {
    const statusIndicator = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-indicator span');
    
    if (statusIndicator && statusText) {
      statusIndicator.className = 'status-dot error';
      statusText.textContent = 'API キー設定が必要';
    }

    // Show notification to set up API key
    setTimeout(() => {
      this.components.ui?.showNotification(
        'Gemini API キーを設定してください。設定ボタンをクリックして設定を開いてください。',
        'warning'
      );
    }, 2000);
  }

  showFatalError(error) {
    // Create error overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const errorBox = document.createElement('div');
    errorBox.style.cssText = `
      background: #1a1a1a;
      padding: 2rem;
      border-radius: 8px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;

    errorBox.innerHTML = `
      <h2 style="color: #ff6b6b; margin-bottom: 1rem;">
        <i class="fas fa-exclamation-triangle"></i>
        アプリケーション初期化エラー
      </h2>
      <p style="margin-bottom: 1rem; line-height: 1.6;">
        Caputの初期化中にエラーが発生しました。<br>
        ブラウザの互換性またはストレージの問題が考えられます。
      </p>
      <details style="margin-bottom: 1rem; text-align: left;">
        <summary style="cursor: pointer; color: #ffd93d;">技術的詳細</summary>
        <pre style="background: #000; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; overflow: auto; font-size: 0.8rem;">${error.message}</pre>
      </details>
      <button onclick="location.reload()" style="
        background: #007AFF;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      ">
        再読み込み
      </button>
    `;

    overlay.appendChild(errorBox);
    document.body.appendChild(overlay);
  }

  // Utility methods for global access
  getComponent(name) {
    return this.components[name];
  }

  async reinitialize() {
    // Clean up existing components
    this.cleanup();
    
    // Clear the initialized flag
    this.isInitialized = false;
    
    // Reinitialize
    await this.initialize();
  }

  cleanup() {
    console.log('Cleaning up Caput resources...');
    
    // Clean up auto-save interval
    if (this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId);
      this.autoSaveIntervalId = null;
    }
    
    // Clean up error handlers
    if (this.errorHandlers && this.errorHandlers.length > 0) {
      this.errorHandlers.forEach(({ type, handler }) => {
        window.removeEventListener(type, handler);
      });
      this.errorHandlers = [];
    }
    
    // Clean up components
    if (this.components.storage) {
      // Ensure final save before cleanup
      this.performAutoSave().finally(() => {
        if (this.components.storage.cleanup) {
          this.components.storage.cleanup();
        }
      });
    }
    
    if (this.components.ui && this.components.ui.cleanup) {
      this.components.ui.cleanup();
    }
    
    if (this.components.agent && this.components.agent.cleanup) {
      this.components.agent.cleanup();
    }
    
    if (this.components.tools && this.components.tools.cleanup) {
      this.components.tools.cleanup();
    }
    
    // Clear global references
    if (window.caputUI === this.components.ui) {
      window.caputUI = null;
    }
    if (window.caputAgent === this.components.agent) {
      window.caputAgent = null;
    }
    
    this.components = {};
    this.isInitialized = false;
  }

  // Export functions for developer tools
  async exportData() {
    if (!this.components.storage) {
      throw new Error('Storage not initialized');
    }
    
    const data = await this.components.storage.exportData();
    
    // Create download
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `caput_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return data;
  }

  async importData(file) {
    if (!this.components.storage) {
      throw new Error('Storage not initialized');
    }
    
    const text = await file.text();
    await this.components.storage.importData(text);
    
    // Reload the application to apply imported data
    location.reload();
  }

  // Debug and development helpers
  getStats() {
    return {
      version: this.version,
      initialized: this.isInitialized,
      components: Object.keys(this.components),
      storage: this.components.storage?.getStorageUsage(),
      agent: this.components.agent?.getSessionStats(),
      tools: this.components.tools?.getExecutionHistory().length
    };
  }

  async runDiagnostics() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      version: this.version,
      userAgent: navigator.userAgent,
      compatibility: {},
      storage: {},
      api: {},
      performance: {}
    };

    // Test browser features
    const features = [
      'localStorage', 'indexedDB', 'crypto', 'fetch', 
      'TextEncoder', 'Promise', 'class'
    ];
    
    features.forEach(feature => {
      try {
        switch (feature) {
          case 'localStorage':
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            diagnostics.compatibility[feature] = true;
            break;
          case 'indexedDB':
            diagnostics.compatibility[feature] = typeof indexedDB !== 'undefined';
            break;
          case 'crypto':
            diagnostics.compatibility[feature] = typeof crypto !== 'undefined' && !!crypto.subtle;
            break;
          case 'fetch':
            diagnostics.compatibility[feature] = typeof fetch !== 'undefined';
            break;
          case 'TextEncoder':
            new TextEncoder();
            diagnostics.compatibility[feature] = true;
            break;
          case 'Promise':
            diagnostics.compatibility[feature] = typeof Promise !== 'undefined';
            break;
          case 'class':
            diagnostics.compatibility[feature] = typeof class {} === 'function';
            break;
        }
      } catch (error) {
        diagnostics.compatibility[feature] = false;
      }
    });

    // Test storage
    if (this.components.storage) {
      diagnostics.storage = this.components.storage.getStorageUsage();
    }

    // Test API connectivity (if API key is available)
    if (this.components.agent && this.components.agent.apiKey) {
      try {
        const testResponse = await this.components.agent.callGemini('Hello', 'diagnostic');
        diagnostics.api.connectivity = true;
        diagnostics.api.responseLength = testResponse.length;
      } catch (error) {
        diagnostics.api.connectivity = false;
        diagnostics.api.error = error.message;
      }
    }

    // Performance metrics
    if (performance && performance.now) {
      diagnostics.performance.timestamp = performance.now();
      if (performance.memory) {
        diagnostics.performance.memory = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
    }

    return diagnostics;
  }
}

// Global app instance
let caputApp = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  caputApp = new CaputApp();
  await caputApp.initialize();
  
  // Make globally accessible for debugging
  window.caputApp = caputApp;
});

// Service Worker registration for PWA features (future enhancement)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Note: Service worker implementation would go here for offline support
    console.log('Service Worker support detected (not implemented yet)');
  });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaputApp;
}
