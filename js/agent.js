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

        // TODO: For large tasks, consider summarizing or truncating stepResult.output
        // if it's excessively large, to manage memory.
        // The full output can still be passed to subsequent dependent steps if necessary.
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

    const controller = new AbortController();
    const timeoutValue = (this.config.API && typeof this.config.API.API_TIMEOUT === 'number') ? this.config.API.API_TIMEOUT : 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutValue);

    let response;
    try {
      response = await fetch(`${modelEndpoint}?key=${this.apiKey}`, {
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
        }),
        signal: controller.signal // Added: AbortController signal
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Gemini API request timed out after ${timeoutValue}ms`);
      }
      throw error; // Re-throw other fetch errors
    } finally {
      clearTimeout(timeoutId); // Important: clear the timeout
    }

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`); // Include status
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      // Log the problematic response for debugging
      console.error("Invalid response from Gemini API. Data:", JSON.stringify(data, null, 2));
      throw new Error('Invalid response structure from Gemini API');
    }

    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        return JSON.parse(text);
      } catch (e) {
        // Log the problematic text for debugging if JSON parsing fails
        console.warn("Gemini API response looked like JSON but failed to parse. Text:", text);
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
        const modelDetails = this.config.EFFICIENCY_MODES[this.currentMode];
        const modelKey = (modelDetails && modelDetails.preferredModel && this.config.COST_ESTIMATION[modelDetails.preferredModel])
                       ? modelDetails.preferredModel
                       : 'gemini-pro'; // Fallback
        const costPerToken = this.config.COST_ESTIMATION[modelKey] || 0.5; // Default cost
        this.stats.totalCost += (updates[key] / 1000) * costPerToken;
      } else if (key === 'toolCalls') {
        this.stats.toolCallsCount += updates[key];
      }
    });

    // Update UI dashboard
    if (this.tools && typeof this.tools.executeTool === 'function') {
        this.tools.executeTool('usageDashboard', {
        tokens: this.stats.tokensUsed,
        cost: parseFloat(this.stats.totalCost.toFixed(2)),
        tool_calls: this.stats.toolCallsCount
        }).catch(e => console.error("Error updating usage dashboard:", e));
    }
  }

  estimateTokens(text) {
    // Rough estimation, might need refinement based on language and model
    return Math.ceil((text || '').length / 1.5); // Adjusted for potentially denser tokenization, ensure text is not null
  }

  shouldAbortOnError(error, step, results) {
    const failureCount = results.filter(r => !r.success).length;
    const maxFailures = (this.config.SAFETY && typeof this.config.SAFETY.MAX_CONSECUTIVE_FAILS === 'number')
                        ? this.config.SAFETY.MAX_CONSECUTIVE_FAILS
                        : 3;
    return failureCount >= maxFailures;
  }

  extractArtifacts(results) {
    const artifacts = [];
    results.forEach(result => {
      if (result.success && result.output) {
        if (typeof result.output === 'string' && result.output.length > 100) {
             artifacts.push({
                type: 'text',
                title: `Text Output (${result.tool || 'Unknown Tool'})`,
                content: result.output.substring(0, 500) + (result.output.length > 500 ? '...' : ''),
                full_content_ref: result.step_number
            });
        } else if (typeof result.output === 'object') {
            Object.keys(result.output).forEach(key => {
                const value = result.output[key];
                if (key.includes('html') && typeof value === 'string') {
                  artifacts.push({ type: 'html', title: `HTML Content (${key})`, content: value, preview_url: result.output.preview_url });
                } else if (key.includes('svg') && typeof value === 'string') {
                  artifacts.push({ type: 'svg', title: `SVG Image (${key})`, content: value });
                } else if ((key.includes('markdown') || key.includes('article')) && typeof value === 'string') {
                  artifacts.push({ type: 'markdown', title: `Markdown Document (${key})`, content: value });
                } else if (key.includes('url') && typeof value === 'string' && value.startsWith('http')) {
                   artifacts.push({ type: 'link', title: `Link (${key})`, url: value });
                } else if (Array.isArray(value) && value.length > 0) {
                    artifacts.push({ type: 'list', title: `List Data (${key})`, items: value.slice(0,10) });
                }
            });
        }
      }
    });
    return artifacts;
  }

  extractSources(results) {
    const sources = new Set();
    results.forEach(result => {
      if (result.success && result.output) {
        const outputSources = result.output.sources;
        if (Array.isArray(outputSources)) {
          outputSources.forEach(source => {
            if (typeof source === 'string' && source.startsWith('http')) {
              sources.add(source);
            } else if (typeof source === 'object' && source && typeof source.url === 'string' && source.url.startsWith('http')) {
              sources.add(source.url);
            }
          });
        } else if (typeof result.output.source_url === 'string' && result.output.source_url.startsWith('http')) {
           sources.add(result.output.source_url);
        }
      }
    });
    return Array.from(sources);
  }

  calculateCostBreakdown() {
    const mode = this.config.EFFICIENCY_MODES[this.currentMode];
    let modelKey = 'gemini-pro'; // Default fallback
    if (mode) {
        modelKey = mode.preferredModel === 'auto'
                    ? 'gemini-1.5-flash' // Default for 'auto'
                    : mode.preferredModel;
    }
    const costPer1kTokens = this.config.COST_ESTIMATION[modelKey] || this.config.COST_ESTIMATION['gemini-pro'] || 0.5;

    return {
      model_used: modelKey,
      tokens_used: this.stats.tokensUsed,
      cost_per_1k_tokens_jpy: costPer1kTokens,
      total_cost_jpy: parseFloat(this.stats.totalCost.toFixed(2)),
      tool_calls_count: this.stats.toolCallsCount
    };
  }

  getSessionStats() {
    return {
      ...this.stats,
      totalCost: parseFloat(this.stats.totalCost.toFixed(2))
    };
  }

  async loadApiKey() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(this.config.STORAGE_KEYS.API_KEY);
      }
    } catch (e) {
      console.error("Error loading API key from localStorage:", e);
    }
    return null;
  }

  async loadSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const settingsString = localStorage.getItem(this.config.STORAGE_KEYS.SETTINGS);
        if (settingsString) {
          return JSON.parse(settingsString);
        }
      }
    } catch (e) {
      console.error("Error loading settings from localStorage:", e);
    }
    return { ...(this.config.DEFAULT_SETTINGS || {}) }; // Return a copy, ensure DEFAULT_SETTINGS exists
  }

  async setEfficiencyMode(mode) { // Made async to align with potential future async operations like saving settings
    if (this.config.EFFICIENCY_MODES && this.config.EFFICIENCY_MODES[mode]) {
      this.currentMode = mode;
      const currentSettings = await this.loadSettings(); // await is good practice if loadSettings could become async
      currentSettings.efficiencyMode = mode;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(this.config.STORAGE_KEYS.SETTINGS, JSON.stringify(currentSettings));
        }
        console.log(`Efficiency mode changed to: ${this.config.EFFICIENCY_MODES[mode].name}`);
      } catch (e) {
        console.error("Error saving efficiency mode to localStorage:", e);
      }
    } else {
      console.warn(`Attempted to set invalid efficiency mode: ${mode}`);
    }
  }

  clearMemory() {
    this.memory = {
      shortTerm: [],
      longTerm: [],
      context: {}
    };
    console.log("Agent memory cleared.");
  }

  reset() {
    this.currentTask = null;
    this.clearMemory();
    const previousSessionCount = this.stats.sessionsCount || 0; // Ensure previousSessionCount is a number
    this.stats = {
      tokensUsed: 0,
      toolCallsCount: 0,
      totalCost: 0,
      sessionsCount: previousSessionCount + 1
    };
    console.log(`Agent reset for new session (${this.stats.sessionsCount}).`);
  }
}

// Export for global access or modules
if (typeof window !== 'undefined') {
  window.CaputAgent = CaputAgent;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CaputAgent;
}
