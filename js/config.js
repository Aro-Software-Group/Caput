// Caput Configuration
const CAPUT_CONFIG = {
  // API Configuration
  API: {
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/',
    DEFAULT_MODEL: 'gemini-2.0-flash-001',
    MAX_TOKENS: 8192,
    TEMPERATURE: 0.7,
    API_TIMEOUT: 30000, // API request timeout in milliseconds
    
    // Available AI Models
    MODELS: {
      'gemini-2.0-flash-001': {
        name: 'Gemini 2.0 Flash',
        endpoint: 'gemini-2.0-flash-001:generateContent',
        description: '高速で効率的な最新モデル（推奨）',
        maxTokens: 8192,
        cost: 'low'
      },
      'gemini-2.5-flash-preview-05-20': {
        name: 'Gemini 2.5 Flash Preview',
        endpoint: 'gemini-2.5-flash-preview-05-20:generateContent',
        description: '次世代Flash技術のプレビュー版',
        maxTokens: 8192,
        cost: 'low'
      },
      'gemini-2.5-pro-preview-05-06': {
        name: 'Gemini 2.5 Pro Preview',
        endpoint: 'gemini-2.5-pro-preview-05-06:generateContent',
        description: '最高品質の分析・推論性能',
        maxTokens: 8192,
        cost: 'high'
      },
      'gemini-2.0-flash-lite-001': {
        name: 'Gemini 2.0 Flash Lite',
        endpoint: 'gemini-2.0-flash-lite-001:generateContent',
        description: 'より軽量で高速なモデル',
        maxTokens: 4096,
        cost: 'low'
      },
      'gemma-3-27b-it': {
        name: 'Gemma 3 27B',
        endpoint: 'gemma-3-27b-it:generateContent',
        description: 'オープンソースの大規模モデル',
        maxTokens: 8192,
        cost: 'medium'
      },
      'gemma-3n-e4b-it': {
        name: 'Gemma 3N E4B',
        endpoint: 'gemma-3n-e4b-it:generateContent',
        description: 'エッジ最適化されたGemmaモデル',
        maxTokens: 4096,
        cost: 'low'
      }
    }
  },

  // Task Efficiency Modes
  EFFICIENCY_MODES: {
    efficiency_first: {
      name: '効率優先',
      maxPlanSteps: 5,
      preferredModel: 'gemini-1.5-flash',
      verificationCount: 1,
      maxToolCalls: 3,
      description: '3-5ステップ計画、Flash系モデル、1回検証'
    },
    middle: {
      name: 'バランス',
      maxPlanSteps: 10,
      preferredModel: 'auto',
      verificationCount: 2,
      maxToolCalls: 7,
      description: '5-10ステップ計画、Flash⇄Pro自動切替、1-2回検証'
    },
    best_results: {
      name: '最高品質',
      maxPlanSteps: 20,
      preferredModel: 'gemini-pro',
      verificationCount: 3,
      maxToolCalls: 10,
      description: '10+ステップ計画、Pro系モデル、多段検証'
    }
  },

  // Tool Categories
  TOOL_CATEGORIES: {
    SEARCH: 'search',
    CONTENT: 'content',
    ANALYSIS: 'analysis',
    AUTOMATION: 'automation',
    MULTIMEDIA: 'multimedia',
    PRODUCTIVITY: 'productivity',
    SECURITY: 'security',
    INTEGRATION: 'integration'
  },

  // Tools specific configurations
  TOOLS: {
    CACHEABLE_TOOLS: [
        "searchWeb",
        "quickLookup",
        "trendAnalyzer",
        "citationBuilder",
        "chartBuilder",
        "correlationAnalyzer",
        "timeSeriesForecaster",
        "codeExplainer",
        "regexBuilder",
        "taskPlanner"
    ], // List of tool names that are safe to cache
    TOOL_ALTERNATIVES: {
        "searchWeb": ["quickLookup"], // If quickLookup can sometimes substitute a failed web search
        "trendAnalyzer": [],          // No alternatives defined yet
        "generateImage": ["generateImageSDXL", "generateImageDallE"] // Fictional examples
    }
    // Add other tool-specific configs here if needed in the future
  },

  // Safety Configuration
  SAFETY: {
    MAX_TOOL_CALLS_PER_SESSION: 10,
    HIGH_RISK_TOOLS: [
      'scraperBot',
      'threatScanner',
      'codeReviewer',
      'apiConnector',
      'webhookSender'
    ],
    BLOCKED_CONTENT_TYPES: [
      'harmful',
      'illegal',
      'privacy_violating',
      'copyright_infringing'
    ]
  },

  // UI Configuration
  UI: {
    REASONING_UPDATE_INTERVAL: 500,
    AUTO_SAVE_INTERVAL: 30000,
    MAX_CHAT_HISTORY: 100,
    GLASSMORPHISM_ENABLED: true,
    ANIMATIONS_ENABLED: true
  },

  // Storage Keys
  STORAGE_KEYS: {
    API_KEY: 'caput_gemini_api_key',
    USER_NAME: 'caput_user_name',
    SETTINGS: 'caput_settings',
    CHAT_HISTORY: 'caput_chat_history',
    USAGE_STATS: 'caput_usage_stats',
    TASK_HISTORY: 'caput_task_history'
  },

  // Default Settings
  DEFAULT_SETTINGS: {
    theme: 'light',
    efficiencyMode: 'middle',
    aiModel: 'gemini-2.0-flash-001',
    highRiskToolsEnabled: false,
    autoSave: true,
    notificationsEnabled: true,
    language: 'ja'
  },

  // Cost Estimation (JPY per 1K tokens)
  COST_ESTIMATION: {
    'gemini-2.0-flash-001': 0.25,
    'gemini-2.5-flash-preview-05-20': 0.3,
    'gemini-2.5-pro-preview-05-06': 0.75,
    'gemini-2.0-flash-lite-001': 0.15,
    'gemma-3-27b-it': 0.4,
    'gemma-3n-e4b-it': 0.2,
    // Legacy models
    'gemini-pro': 0.5,
    'gemini-1.5-flash': 0.25,
    'gemini-1.5-pro': 0.75
  },

  // Agent Behavior Configuration
  AGENT_BEHAVIOR: {
    OFFLINE_QUEUE_MAX_RETRIES: 5, // Max number of times to retry a queued request when back online
    // Add other agent-level behavior flags or settings here
  }
};

// Export for ES6 modules or global access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CAPUT_CONFIG;
} else {
  window.CAPUT_CONFIG = CAPUT_CONFIG;
}
