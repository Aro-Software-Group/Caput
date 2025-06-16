// Caput Main Application - Bootstrap & Initialization
class CaputApp {
  constructor() {
    this.isInitialized = false;
    this.components = {};
    this.version = '1.0.2-beta';
  }
  async initialize() {
    if (this.isInitialized) {
      console.log('Caput already initialized, skipping...');
      return;
    }

    try {
      console.log(`Caput v${this.version} initializing...`);

      // Check browser compatibility
      this.checkCompatibility();      // Initialize storage system
      this.components.storage = new CaputStorage();
      await this.components.storage.initialize();
      
      // Initialize modular tools registry
      this.components.tools = new ModularToolsRegistry();
      await this.components.tools.initialize();

      // Initialize UI controller
      this.components.ui = new CaputUI();
      await this.components.ui.initialize();      // Initialize AI agent with all components
      if (!this.components.tools) {
        throw new Error('Tools registry not initialized');
      }
      
      this.components.agent = new CaputAgent(CAPUT_CONFIG, this.components.tools, {
        storage: this.components.storage,
        ui: this.components.ui
      });

      // Validate tools registry
      if (typeof this.components.tools.getToolList !== 'function') {
        console.error('Tools registry missing getToolList method');
      }// Make UI globally accessible for tools
      window.caputUI = this.components.ui;
      
      // Make app globally accessible for debugging
      window.caputApp = this;

      // Display tools information
      this.components.ui.displayToolsInfo();      // Check onboarding requirements
      const apiKey = await this.components.storage.loadApiKey();
      const userName = this.components.storage.loadUserName();

      if (!apiKey || !userName) {
        console.log('API key or username missing, showing onboarding');
        this.components.ui.showOnboarding();
      } else {
        try {
          await this.components.agent.initialize();
          this.showWelcomeMessage();
        } catch (error) {
          console.error('Agent initialization failed:', error);
          this.showApiKeyPrompt();
        }
      }

      // Set up global error handling
      this.setupErrorHandling();

      // Set up auto-save
      this.setupAutoSave();      // Make agent globally accessible
      window.caputAgent = this.components.agent;
      // Make app globally accessible
      window.caputApp = this;

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
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fatal-error';
    errorDiv.innerHTML = `
      <h2>致命的なエラーが発生しました</h2>
      <p>${error.message}</p>
      <button onclick="location.reload()">再読み込み</button>
    `;
    document.body.appendChild(errorDiv);
    console.error('Fatal error:', error);
  }
  
  // Cleanup method for proper resource management
  cleanup() {
    // Clear intervals
    if (this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId);
    }
    
    // Remove event listeners
    if (this.errorHandlers) {
      this.errorHandlers.forEach(handler => {
        if (handler.element && handler.event && handler.callback) {
          handler.element.removeEventListener(handler.event, handler.callback);
        }
      });
    }
    
    // Clear agent
    if (this.components.agent) {
      this.components.agent.reset();
    }
    
    console.log('Caput app cleaned up');
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
let isInitializing = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  if (isInitializing || caputApp) {
    console.log('Caput App already initializing or initialized, skipping...');
    return;
  }
  
  isInitializing = true;
  
  try {
    caputApp = new CaputApp();
    await caputApp.initialize();
    
    // Make globally accessible for debugging
    window.caputApp = caputApp;
    
    console.log('Caput App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Caput App:', error);
  } finally {
    isInitializing = false;
  }
});

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js')
      .then(() => console.log('Service Worker registered'))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaputApp;
}
