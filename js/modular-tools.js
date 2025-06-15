// Modular Tools Registry - Dynamic Tool Loading System
class ModularToolsRegistry {
  constructor() {
    this.toolInstances = new Map();
    this.toolRegistry = new Map();
    this.executionHistory = [];
    this.loadedModules = new Set();
  }

  async initialize() {
    console.log('Initializing Modular Tools Registry...');
    
    // Tool modules to load
    const toolModules = [
      { name: 'SearchTools', file: '../tools/search.js' },
      { name: 'ContentTools', file: '../tools/content.js' },
      { name: 'AnalysisTools', file: '../tools/analysis.js' },
      { name: 'ProductivityTools', file: '../tools/productivity.js' },
      { name: 'DocumentTools', file: '../tools/document.js' },
      { name: 'AutomationTools', file: '../tools/automation.js' },
      { name: 'SecurityTools', file: '../tools/security.js' },
      { name: 'IntegrationTools', file: '../tools/integration.js' },
      { name: 'SystemTools', file: '../tools/system.js' }
    ];

    // Load all tool modules
    for (const module of toolModules) {
      try {
        await this.loadToolModule(module.name, module.file);
      } catch (error) {
        console.warn(`Failed to load tool module ${module.name}:`, error);
      }
    }

    console.log(`Modular Tools Registry initialized: ${this.toolRegistry.size} tools from ${this.loadedModules.size} modules`);
    return this;
  }

  async loadToolModule(moduleName, filePath) {
    try {
      // Load the script dynamically
      await this.loadScript(filePath);
      
      // Get the tool class from global scope
      const ToolClass = window[moduleName];
      if (!ToolClass) {
        throw new Error(`Tool class ${moduleName} not found in global scope`);
      }

      // Create instance
      const toolInstance = new ToolClass();
      this.toolInstances.set(moduleName, toolInstance);

      // Register all tools from this module
      const tools = toolInstance.getTools();
      for (const [toolName, toolConfig] of Object.entries(tools)) {
        this.registerTool(toolName, {
          ...toolConfig,
          module: moduleName,
          instance: toolInstance
        });
      }

      this.loadedModules.add(moduleName);
      console.log(`Loaded ${moduleName}: ${Object.keys(tools).length} tools`);
      
    } catch (error) {
      console.error(`Error loading tool module ${moduleName}:`, error);
      throw error;
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  }

  registerTool(name, config) {
    this.toolRegistry.set(name, {
      ...config,
      registeredAt: new Date(),
      callCount: 0
    });
  }

  async executeTool(toolName, parameters, context = {}) {
    const tool = this.toolRegistry.get(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found`);
    }

    // Check risk level and permissions
    if (tool.riskLevel === 'high' && !context.highRiskEnabled) {
      throw new Error(`High-risk tool "${toolName}" requires explicit permission`);
    }

    // Increment call count
    tool.callCount++;

    const executionStart = performance.now();
    
    try {
      // Execute the tool
      const result = await tool.execute(parameters, context);
      
      const executionTime = performance.now() - executionStart;
      
      // Log execution
      this.executionHistory.push({
        toolName,
        parameters,
        result,
        executionTime,
        timestamp: new Date(),
        success: true,
        module: tool.module
      });

      return {
        success: true,
        data: result,
        metadata: {
          toolName,
          module: tool.module,
          executionTime,
          callCount: tool.callCount
        }
      };
    } catch (error) {
      const executionTime = performance.now() - executionStart;
      
      this.executionHistory.push({
        toolName,
        parameters,
        error: error.message,
        executionTime,
        timestamp: new Date(),
        success: false,
        module: tool.module
      });

      return {
        success: false,
        error: error.message,
        metadata: {
          toolName,
          module: tool.module,
          executionTime,
          callCount: tool.callCount
        }
      };
    }
  }

  // Get all available tools
  getAllTools() {
    return Array.from(this.toolRegistry.entries()).map(([name, config]) => ({
      name,
      displayName: config.name,
      category: config.category,
      description: config.description,
      riskLevel: config.riskLevel,
      module: config.module,
      callCount: config.callCount
    }));
  }

  // Get tools by category
  getToolsByCategory(category) {
    return this.getAllTools().filter(tool => tool.category === category);
  }

  // Get tools by module
  getToolsByModule(moduleName) {
    return this.getAllTools().filter(tool => tool.module === moduleName);
  }

  // Get tool categories
  getCategories() {
    const categories = new Set();
    this.toolRegistry.forEach(tool => categories.add(tool.category));
    return Array.from(categories).sort();
  }

  // Get loaded modules
  getLoadedModules() {
    return Array.from(this.loadedModules);
  }

  // Get execution history
  getExecutionHistory() {
    return this.executionHistory;
  }

  // Clear execution history
  clearHistory() {
    this.executionHistory = [];
  }

  // Get tool usage statistics
  getUsageStats() {
    const totalCalls = this.executionHistory.length;
    const successfulCalls = this.executionHistory.filter(h => h.success).length;
    const avgExecutionTime = totalCalls > 0 
      ? this.executionHistory.reduce((sum, h) => sum + h.executionTime, 0) / totalCalls 
      : 0;

    const toolUsage = {};
    this.executionHistory.forEach(history => {
      if (!toolUsage[history.toolName]) {
        toolUsage[history.toolName] = { calls: 0, totalTime: 0, errors: 0 };
      }
      toolUsage[history.toolName].calls++;
      toolUsage[history.toolName].totalTime += history.executionTime;
      if (!history.success) {
        toolUsage[history.toolName].errors++;
      }
    });

    const moduleUsage = {};
    this.executionHistory.forEach(history => {
      if (!moduleUsage[history.module]) {
        moduleUsage[history.module] = { calls: 0, totalTime: 0, errors: 0 };
      }
      moduleUsage[history.module].calls++;
      moduleUsage[history.module].totalTime += history.executionTime;
      if (!history.success) {
        moduleUsage[history.module].errors++;
      }
    });

    return {
      total: {
        calls: totalCalls,
        successful: successfulCalls,
        failed: totalCalls - successfulCalls,
        successRate: totalCalls > 0 ? (successfulCalls / totalCalls) : 0,
        avgExecutionTime: Math.round(avgExecutionTime)
      },
      tools: toolUsage,
      modules: moduleUsage,
      mostUsedTool: totalCalls > 0 
        ? Object.entries(toolUsage).sort(([,a], [,b]) => b.calls - a.calls)[0]?.[0]
        : null,
      mostUsedModule: totalCalls > 0 
        ? Object.entries(moduleUsage).sort(([,a], [,b]) => b.calls - a.calls)[0]?.[0]
        : null
    };
  }

  // Reload a specific module
  async reloadModule(moduleName) {
    if (!this.loadedModules.has(moduleName)) {
      throw new Error(`Module ${moduleName} is not loaded`);
    }

    // Remove existing tools from this module
    const toolsToRemove = [];
    this.toolRegistry.forEach((tool, name) => {
      if (tool.module === moduleName) {
        toolsToRemove.push(name);
      }
    });

    toolsToRemove.forEach(name => this.toolRegistry.delete(name));
    this.toolInstances.delete(moduleName);
    this.loadedModules.delete(moduleName);

    // Reload the module
    const moduleMap = {
      'SearchTools': '../tools/search.js',
      'ContentTools': '../tools/content.js',
      'AnalysisTools': '../tools/analysis.js',
      'ProductivityTools': '../tools/productivity.js',
      'DocumentTools': '../tools/document.js',
      'AutomationTools': '../tools/automation.js',
      'SecurityTools': '../tools/security.js',
      'IntegrationTools': '../tools/integration.js',
      'SystemTools': '../tools/system.js'
    };

    if (moduleMap[moduleName]) {
      await this.loadToolModule(moduleName, moduleMap[moduleName]);
      console.log(`Module ${moduleName} reloaded successfully`);
    } else {
      throw new Error(`Unknown module: ${moduleName}`);
    }
  }

  // Health check for all modules
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      totalModules: this.loadedModules.size,
      totalTools: this.toolRegistry.size,
      modules: {}
    };

    for (const moduleName of this.loadedModules) {
      const instance = this.toolInstances.get(moduleName);
      const moduleTools = this.getToolsByModule(moduleName);
      
      health.modules[moduleName] = {
        loaded: !!instance,
        toolCount: moduleTools.length,
        totalCalls: moduleTools.reduce((sum, tool) => sum + tool.callCount, 0),
        status: instance ? 'healthy' : 'error'
      };
    }

    return health;
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.ModularToolsRegistry = ModularToolsRegistry;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModularToolsRegistry;
}
