// Caput Configuration
const CAPUT_CONFIG = {
  // API Configuration
  API: {
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    GEMINI_FLASH_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    DEFAULT_MODEL: 'gemini-pro',
    MAX_TOKENS: 8192,
    TEMPERATURE: 0.7,
    API_TIMEOUT: 30000 // Added: API request timeout in milliseconds
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
    highRiskToolsEnabled: false,
    autoSave: true,
    notificationsEnabled: true,
    language: 'ja'
  },

  // Cost Estimation (JPY per 1K tokens)
  COST_ESTIMATION: {
    'gemini-pro': 0.5,
    'gemini-1.5-flash': 0.25,
    'gemini-1.5-pro': 0.75
  }
};

// Export for ES6 modules or global access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CAPUT_CONFIG;
} else {
  window.CAPUT_CONFIG = CAPUT_CONFIG;
}
