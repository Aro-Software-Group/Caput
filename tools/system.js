// System and Meta Tools
class SystemTools {
  constructor() {
    this.toolName = 'SystemTools';
    this.category = 'system';
  }

  getTools() {
    return {
      showReasoning: {
        name: '思考表示',
        category: 'system',
        description: '思考タイムラインを表示',
        riskLevel: 'low',
        execute: this.showReasoning.bind(this)
      },
      usageDashboard: {
        name: '使用状況表示',
        category: 'system',
        description: 'トークン・コスト・ツール回数集計',
        riskLevel: 'low',
        execute: this.usageDashboard.bind(this)
      },
      systemDiagnostics: {
        name: 'システム診断',
        category: 'system',
        description: 'システムパフォーマンスの診断',
        riskLevel: 'low',
        execute: this.systemDiagnostics.bind(this)
      },
      memoryManager: {
        name: 'メモリ管理',
        category: 'system',
        description: 'メモリ使用量の最適化',
        riskLevel: 'low',
        execute: this.memoryManager.bind(this)
      },
      configManager: {
        name: '設定管理',
        category: 'system',
        description: 'システム設定の管理',
        riskLevel: 'low',
        execute: this.configManager.bind(this)
      },
      performanceProfiler: {
        name: 'パフォーマンス測定',
        category: 'system',
        description: 'システムパフォーマンスの測定',
        riskLevel: 'low',
        execute: this.performanceProfiler.bind(this)
      }
    };
  }

  async showReasoning(params) {
    const { taskId, includeSteps = true } = params;
    
    await this.simulateDelay(500, 1500);
    
    // Get reasoning from global agent if available
    const reasoningSteps = window.caputAgent ? 
      window.caputAgent.getReasoningSteps?.(taskId) : null;

    const mockReasoning = [
      {
        step: 1,
        type: 'analysis',
        description: 'ユーザーの要求を分析しています',
        timestamp: new Date(Date.now() - 5000).toISOString(),
        duration: 1200,
        confidence: 0.95
      },
      {
        step: 2,
        type: 'planning',
        description: '実行計画を策定しています',
        timestamp: new Date(Date.now() - 3000).toISOString(),
        duration: 800,
        confidence: 0.88
      },
      {
        step: 3,
        type: 'execution',
        description: 'ツールを実行中です',
        timestamp: new Date(Date.now() - 1000).toISOString(),
        duration: 2000,
        confidence: 0.92
      }
    ];

    const reasoning = reasoningSteps || mockReasoning;

    return {
      taskId: taskId || 'current_task',
      totalSteps: reasoning.length,
      averageConfidence: reasoning.reduce((sum, step) => sum + step.confidence, 0) / reasoning.length,
      totalDuration: reasoning.reduce((sum, step) => sum + step.duration, 0),
      steps: includeSteps ? reasoning : null,
      summary: {
        analysisTime: reasoning.filter(s => s.type === 'analysis').reduce((sum, s) => sum + s.duration, 0),
        planningTime: reasoning.filter(s => s.type === 'planning').reduce((sum, s) => sum + s.duration, 0),
        executionTime: reasoning.filter(s => s.type === 'execution').reduce((sum, s) => sum + s.duration, 0)
      }
    };
  }

  async usageDashboard(params) {
    const { timeRange = '24h', includeDetails = true } = params;
    
    await this.simulateDelay(800, 2000);
    
    // Get usage data from storage or create mock data
    const usage = {
      timeRange,
      period: {
        start: new Date(Date.now() - 86400000).toISOString(),
        end: new Date().toISOString()
      },
      tokens: {
        total: 15420,
        input: 12340,
        output: 3080,
        cost: 0.045 // USD
      },
      tools: {
        totalCalls: 47,
        uniqueTools: 12,
        averageResponseTime: 2340, // ms
        topUsed: [
          { name: 'searchWeb', calls: 8, avgTime: 2100 },
          { name: 'blogWriter', calls: 6, avgTime: 4500 },
          { name: 'chartBuilder', calls: 5, avgTime: 1800 }
        ]
      },
      performance: {
        averageThinkingTime: 1800,
        successRate: 0.94,
        errorRate: 0.06,
        cacheHitRate: 0.23
      },
      sessions: {
        total: 8,
        averageDuration: 18.5, // minutes
        longestSession: 45.2,
        shortestSession: 3.1
      }
    };

    if (includeDetails) {
      usage.details = {
        hourlyBreakdown: this.generateHourlyUsage(),
        toolCategories: {
          content: 15,
          analysis: 12,
          search: 10,
          productivity: 8,
          security: 2
        },
        errorLog: [
          { time: new Date(Date.now() - 3600000).toISOString(), tool: 'apiConnector', error: 'Network timeout' },
          { time: new Date(Date.now() - 7200000).toISOString(), tool: 'pdfReader', error: 'File format not supported' }
        ]
      };
    }

    return usage;
  }

  async systemDiagnostics(params) {
    const { includePerformance = true, includeSecurity = false } = params;
    
    await this.simulateDelay(2000, 4000);
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      systemHealth: 'good', // good, warning, critical
      components: {
        ui: { status: 'operational', responseTime: 45 },
        agent: { status: 'operational', memoryUsage: '234MB' },
        tools: { status: 'operational', loadedTools: 67 },
        storage: { status: 'operational', usage: '45%' }
      },
      browser: {
        name: navigator.userAgent.split(' ')[0],
        version: navigator.userAgent,
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        } : 'not available',
        online: navigator.onLine
      }
    };

    if (includePerformance) {
      diagnostics.performance = {
        pageLoadTime: Math.round(performance.now()),
        resourceCount: performance.getEntriesByType('resource').length,
        timing: performance.timing ? {
          domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          pageLoad: performance.timing.loadEventEnd - performance.timing.navigationStart
        } : 'not available'
      };
    }

    if (includeSecurity) {
      diagnostics.security = {
        https: location.protocol === 'https:',
        localStorage: typeof Storage !== 'undefined',
        webgl: !!document.createElement('canvas').getContext('webgl'),
        cookiesEnabled: navigator.cookieEnabled
      };
    }

    return diagnostics;
  }

  async memoryManager(params) {
    const { operation = 'status', aggressive = false } = params;
    
    await this.simulateDelay(1000, 2500);
    
    const operations = {
      status: () => ({
        currentUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'unknown',
        availableMemory: performance.memory ? Math.round((performance.memory.jsHeapSizeLimit - performance.memory.usedJSHeapSize) / 1024 / 1024) + 'MB' : 'unknown',
        memoryLeaks: 0,
        gcSuggested: false
      }),
      cleanup: () => {
        // Simulate cleanup
        if (window.gc) window.gc(); // Manual garbage collection if available
        return {
          freedMemory: Math.round(Math.random() * 50) + 10 + 'MB',
          remainingObjects: Math.floor(Math.random() * 1000) + 500,
          gcExecuted: true
        };
      },
      optimize: () => ({
        cacheCleared: true,
        unusedObjectsRemoved: Math.floor(Math.random() * 100) + 50,
        memoryDefragmented: true,
        performanceImprovement: Math.round(Math.random() * 20) + 5 + '%'
      })
    };

    const result = operations[operation] ? operations[operation]() : operations.status();

    return {
      operation,
      aggressive,
      timestamp: new Date().toISOString(),
      ...result,
      recommendations: operation === 'status' ? [
        'Regular cleanup recommended',
        'Monitor for memory leaks',
        'Consider reducing cache size'
      ] : []
    };
  }

  async configManager(params) {
    const { action, key, value, section = 'general' } = params;
    
    await this.simulateDelay(300, 1000);
    
    const config = window.caputStorage ? 
      await window.caputStorage.getConfig?.() : 
      this.getDefaultConfig();

    const actions = {
      get: () => ({
        key,
        value: config[section]?.[key] || null,
        section,
        exists: !!config[section]?.[key]
      }),
      set: () => {
        if (window.caputStorage) {
          window.caputStorage.setConfig?.(section, key, value);
        }
        return {
          key,
          value,
          section,
          previousValue: config[section]?.[key] || null,
          updated: true
        };
      },
      list: () => ({
        section,
        config: config[section] || {},
        totalKeys: Object.keys(config[section] || {}).length
      }),
      reset: () => {
        if (window.caputStorage) {
          window.caputStorage.resetConfig?.(section);
        }
        return {
          section,
          reset: true,
          restoredToDefaults: true
        };
      }
    };

    const result = actions[action] ? actions[action]() : actions.get();

    return {
      action,
      timestamp: new Date().toISOString(),
      ...result
    };
  }

  async performanceProfiler(params) {
    const { duration = 5000, includeDetails = true } = params;
    
    const startTime = performance.now();
    await this.simulateDelay(Math.min(duration, 5000), Math.min(duration, 5000));
    const endTime = performance.now();

    const profile = {
      duration: Math.round(endTime - startTime),
      timestamp: new Date().toISOString(),
      metrics: {
        fps: Math.round(60 + Math.random() * 10), // Simulated FPS
        cpuUsage: Math.round(Math.random() * 50) + 20,
        memoryGrowth: Math.round(Math.random() * 10) + 'MB',
        networkLatency: Math.round(Math.random() * 100) + 50
      }
    };

    if (includeDetails) {
      profile.details = {
        domUpdates: Math.floor(Math.random() * 100) + 20,
        eventListeners: Math.floor(Math.random() * 50) + 10,
        asyncOperations: Math.floor(Math.random() * 20) + 5,
        cacheHits: Math.floor(Math.random() * 30) + 10,
        recommendations: [
          'Optimize DOM manipulation',
          'Reduce event listener count',
          'Implement request caching'
        ]
      };
    }

    return profile;
  }

  // Helper methods
  generateHourlyUsage() {
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      hours.push({
        hour: new Date(Date.now() - i * 3600000).getHours(),
        calls: Math.floor(Math.random() * 10),
        tokens: Math.floor(Math.random() * 1000) + 100
      });
    }
    return hours;
  }

  getDefaultConfig() {
    return {
      general: {
        theme: 'dark',
        language: 'ja',
        autoSave: true
      },
      agent: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
      },
      ui: {
        showReasoning: true,
        compactMode: false,
        animations: true
      }
    };
  }

  // Utility method for simulating processing delays
  async simulateDelay(minMs, maxMs) {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SystemTools;
}

// Export for browser globals
if (typeof window !== 'undefined') {
  window.SystemTools = SystemTools;
}
