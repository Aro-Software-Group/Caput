// Caput AI Agent Core - Autonomous Planning & Execution Engine
class CaputAgent {
  constructor(config, tools) {
    this.config = config;
    this.tools = tools;
    this.currentTask = null;
    this.executionLoop = null;
    this.memory = {
      shortTerm: [],
      longTerm: [],
      context: {}
    };
    this.stats = {
      tokensUsed: 0,
      toolCallsCount: 0,
      totalCost: 0,
      sessionsCount: 0
    };
    this.currentMode = 'middle';
    this.apiKey = null;
  }

  async initialize() {
    // Load API key and settings
    this.apiKey = await this.loadApiKey();
    if (!this.apiKey) {
      throw new Error('Gemini API キーが設定されていません');
    }
    
    // Load user settings
    const settings = await this.loadSettings();
    this.currentMode = settings.efficiencyMode || 'middle';
    
    console.log('Caput Agent initialized successfully');
    return true;
  }

  async processGoal(userGoal) {
    try {
      // Step 1: ANALYZE - 目標理解と文脈分析
      await this.showReasoning('分析開始', 'analyzer', 'active', { goal: userGoal });
      const analysis = await this.analyzeGoal(userGoal);
      
      // Step 2: PLAN - 多段階計画の生成
      await this.showReasoning('計画策定', 'planner', 'active', analysis);
      const plan = await this.generatePlan(analysis);
      
      // Step 3: EXECUTE - ツール実行ループ
      await this.showReasoning('実行開始', 'executor', 'active', { steps: plan.steps.length });
      const results = await this.executePlan(plan);
      
      // Step 4: VERIFY - 結果検証
      await this.showReasoning('検証実行', 'verifier', 'active', { results: results.length });
      const verification = await this.verifyResults(results, analysis.success_criteria);
      
      // Step 5: DELIVER - 最終成果物の提示
      await this.showReasoning('完了', 'deliverer', 'completed', verification);
      const finalDelivery = await this.prepareDelivery(results, verification);
      
      return {
        success: true,
        analysis,
        plan,
        results,
        verification,
        delivery: finalDelivery,
        stats: this.getSessionStats()
      };
      
    } catch (error) {
      await this.showReasoning('エラー発生', 'error_handler', 'error', { error: error.message });
      throw error;
    }
  }

  async analyzeGoal(userGoal) {
    const prompt = `
あなたは自律型AIエージェント「Caput」の分析エンジンです。
ユーザーのゴールを分析し、実行可能な計画のための情報を抽出してください。

ユーザーゴール: "${userGoal}"

以下の形式でJSON応答してください：
{
  "goal_type": "ゴールの種類 (情報収集/コンテンツ生成/分析/自動化/その他)",
  "complexity": "複雑さレベル (simple/medium/complex)",
  "required_tools": ["必要なツール名のリスト"],
  "success_criteria": ["成功基準のリスト"],
  "estimated_steps": "予想ステップ数",
  "risks": ["潜在的なリスクや注意点"],
  "context_needed": ["必要な追加情報"]
}`;

    const response = await this.callGemini(prompt, 'analysis');
    const tokens = this.estimateTokens(prompt + JSON.stringify(response));
    this.updateStats({ tokens });
    
    return response;
  }

  async generatePlan(analysis) {
    const mode = this.config.EFFICIENCY_MODES[this.currentMode];
    
    const prompt = `
Task Efficiency Mode: ${mode.name}
最大ステップ数: ${mode.maxPlanSteps}
検証回数: ${mode.verificationCount}

ゴール分析結果:
${JSON.stringify(analysis, null, 2)}

利用可能なツール一覧:
${this.tools.getToolList().map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

上記の制約の範囲で、効率的な実行計画を生成してください。
以下の形式でJSON応答：

{
  "steps": [
    {
      "step_number": 1,
      "action": "実行するアクション",
      "tool": "使用ツール名",
      "parameters": {"key": "value"},
      "expected_output": "期待される出力",
      "dependencies": ["依存する前ステップ番号"]
    }
  ],
  "parallel_execution": ["並列実行可能なステップ番号"],
  "verification_points": ["検証ポイントの説明"],
  "estimated_time": "予想実行時間(分)",
  "resource_requirements": ["必要なリソース"]
}`;

    const response = await this.callGemini(prompt, 'planning');
    const tokens = this.estimateTokens(prompt + JSON.stringify(response));
    this.updateStats({ tokens });
    
    return response;
  }

  async executePlan(plan) {
    const results = [];
    const mode = this.config.EFFICIENCY_MODES[this.currentMode];
    
    for (let i = 0; i < plan.steps.length && i < mode.maxToolCalls; i++) {
      const step = plan.steps[i];
      
      try {
        await this.showReasoning(
          `ステップ ${step.step_number}: ${step.action}`,
          step.tool,
          'active',
          { parameters: step.parameters }
        );
        
        // Check dependencies
        if (step.dependencies && step.dependencies.length > 0) {
          const dependenciesMet = step.dependencies.every(dep => 
            results.some(r => r.step_number === dep && r.success)
          );
          
          if (!dependenciesMet) {
            throw new Error(`Dependencies not met for step ${step.step_number}`);
          }
        }
        
        // Execute tool
        const toolResult = await this.tools.executeTool(
          step.tool,
          step.parameters,
          { highRiskEnabled: this.settings?.highRiskToolsEnabled || false }
        );
        
        const stepResult = {
          step_number: step.step_number,
          action: step.action,
          tool: step.tool,
          success: toolResult.success,
          output: toolResult.data,
          error: toolResult.error,
          execution_time: toolResult.metadata?.executionTime,
          timestamp: new Date().toISOString()
        };
        
        results.push(stepResult);
        this.updateStats({ toolCalls: 1 });
        
        await this.showReasoning(
          `完了: ${step.action}`,
          step.tool,
          stepResult.success ? 'completed' : 'error',
          { result: stepResult }
        );
        
        // Short delay between steps
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        const errorResult = {
          step_number: step.step_number,
          action: step.action,
          tool: step.tool,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        results.push(errorResult);
        
        await this.showReasoning(
          `エラー: ${step.action}`,
          step.tool,
          'error',
          { error: error.message }
        );
        
        // Decide whether to continue or abort
        if (this.shouldAbortOnError(error, step, results)) {
          break;
        }
      }
    }
    
    return results;
  }

  async verifyResults(results, successCriteria) {
    const prompt = `
実行結果の検証を行ってください。

成功基準:
${successCriteria.map(criteria => `- ${criteria}`).join('\n')}

実行結果:
${JSON.stringify(results, null, 2)}

以下の形式でJSON応答：
{
  "overall_success": true/false,
  "criteria_met": ["満たされた基準"],
  "criteria_failed": ["満たされなかった基準"],
  "quality_score": 0-100,
  "recommendations": ["改善提案"],
  "next_actions": ["追加で必要なアクション"]
}`;

    const response = await this.callGemini(prompt, 'verification');
    const tokens = this.estimateTokens(prompt + JSON.stringify(response));
    this.updateStats({ tokens });
    
    return response;
  }

  async prepareDelivery(results, verification) {
    const successfulResults = results.filter(r => r.success);
    const artifacts = this.extractArtifacts(successfulResults);
    
    const summary = await this.generateSummary(results, verification);
    
    return {
      summary,
      artifacts,
      metrics: {
        steps_completed: successfulResults.length,
        total_steps: results.length,
        success_rate: successfulResults.length / results.length,
        quality_score: verification.quality_score,
        execution_time: results.reduce((sum, r) => sum + (r.execution_time || 0), 0)
      },
      sources: this.extractSources(successfulResults),
      cost_breakdown: this.calculateCostBreakdown()
    };
  }

  async generateSummary(results, verification) {
    const prompt = `
以下の実行結果と検証結果を基に、ユーザー向けの分かりやすい要約を生成してください。

実行結果: ${JSON.stringify(results, null, 2)}
検証結果: ${JSON.stringify(verification, null, 2)}

要約は以下の要素を含めてください：
- 実行したタスクの概要
- 主要な成果物
- 品質評価
- 今後のアクション提案

自然で読みやすい日本語で回答してください。`;

    const response = await this.callGemini(prompt, 'summary');
    const tokens = this.estimateTokens(prompt + response);
    this.updateStats({ tokens });
    
    return response;
  }

  async callGemini(prompt, type = 'general') {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const mode = this.config.EFFICIENCY_MODES[this.currentMode];
    const modelEndpoint = mode.preferredModel === 'gemini-1.5-flash' 
      ? this.config.API.GEMINI_FLASH_ENDPOINT
      : this.config.API.GEMINI_ENDPOINT;

    const response = await fetch(`${modelEndpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: this.config.API.TEMPERATURE,
          maxOutputTokens: this.config.API.MAX_TOKENS
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Invalid response from Gemini API');
    }

    // Try to parse as JSON if it looks like JSON
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        return JSON.parse(text);
      } catch (e) {
        // If JSON parsing fails, return as text
        return text;
      }
    }
    
    return text;
  }

  async showReasoning(event, tool, status, metadata = {}) {
    await this.tools.executeTool('showReasoning', {
      event,
      tool,
      status,
      metadata
    });
  }

  updateStats(updates) {
    Object.keys(updates).forEach(key => {
      if (key === 'tokens') {
        this.stats.tokensUsed += updates[key];
        const model = this.config.EFFICIENCY_MODES[this.currentMode].preferredModel;
        const costPerToken = this.config.COST_ESTIMATION[model] || 0.5;
        this.stats.totalCost += (updates[key] / 1000) * costPerToken;
      } else if (key === 'toolCalls') {
        this.stats.toolCallsCount += updates[key];
      }
    });

    // Update UI dashboard
    this.tools.executeTool('usageDashboard', {
      tokens: this.stats.tokensUsed,
      cost: this.stats.totalCost,
      tool_calls: this.stats.toolCallsCount
    });
  }

  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for Japanese text
    return Math.ceil(text.length / 4);
  }

  shouldAbortOnError(error, step, results) {
    const failureCount = results.filter(r => !r.success).length;
    return failureCount >= 3; // Abort after 3 consecutive failures
  }

  extractArtifacts(results) {
    const artifacts = [];
    
    results.forEach(result => {
      if (result.output) {
        // Extract HTML, CSV, SVG, etc.
        if (result.output.html) {
          artifacts.push({
            type: 'html',
            title: `Landing Page (${result.tool})`,
            content: result.output.html,
            preview_url: result.output.preview_url
          });
        }
        
        if (result.output.svg) {
          artifacts.push({
            type: 'svg',
            title: `Chart (${result.tool})`,
            content: result.output.svg
          });
        }
        
        if (result.output.article) {
          artifacts.push({
            type: 'markdown',
            title: `Article (${result.tool})`,
            content: result.output.article
          });
        }
      }
    });
    
    return artifacts;
  }

  extractSources(results) {
    const sources = [];
    
    results.forEach(result => {
      if (result.output && result.output.sources) {
        sources.push(...result.output.sources);
      }
    });
    
    return [...new Set(sources)]; // Remove duplicates
  }

  calculateCostBreakdown() {
    const mode = this.config.EFFICIENCY_MODES[this.currentMode];
    const model = mode.preferredModel;
    const costPerToken = this.config.COST_ESTIMATION[model] || 0.5;
    
    return {
      model: model,
      tokens_used: this.stats.tokensUsed,
      cost_per_1k_tokens: costPerToken,
      total_cost_jpy: this.stats.totalCost,
      tool_calls: this.stats.toolCallsCount
    };
  }

  getSessionStats() {
    return { ...this.stats };
  }

  async loadApiKey() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.config.STORAGE_KEYS.API_KEY);
    }
    return null;
  }

  async loadSettings() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const settings = localStorage.getItem(this.config.STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : this.config.DEFAULT_SETTINGS;
    }
    return this.config.DEFAULT_SETTINGS;
  }

  setEfficiencyMode(mode) {
    if (this.config.EFFICIENCY_MODES[mode]) {
      this.currentMode = mode;
      console.log(`Efficiency mode changed to: ${mode}`);
    }
  }

  clearMemory() {
    this.memory = {
      shortTerm: [],
      longTerm: [],
      context: {}
    };
  }

  reset() {
    this.currentTask = null;
    this.executionLoop = null;
    this.clearMemory();
    this.stats = {
      tokensUsed: 0,
      toolCallsCount: 0,
      totalCost: 0,
      sessionsCount: this.stats.sessionsCount + 1
    };
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.CaputAgent = CaputAgent;
}
