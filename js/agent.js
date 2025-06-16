// Caput AI Agent Core - Autonomous Planning & Execution Engine
class CaputAgent {
  constructor(config, tools, components = {}) { // Added components for storage, ui
    this.config = config;
    this.tools = tools;
    this.components = components; // Store components (storage, ui)
    this.currentTask = null;
    this.executionLoop = null;
    this.requestQueue = []; // For offline request queuing
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
    this.isOffline = !navigator.onLine; // Initial online status
  }

  async initialize() {
    // Load API key and settings
    this.apiKey = await this.loadApiKey();
    
    // Load user settings
    const settings = await this.loadSettings();
    this.currentMode = settings.efficiencyMode || 'middle';

    // Only throw error if online and no API key
    if (!this.apiKey && !this.isOffline) {
      console.warn('Gemini API キーが設定されていません (オンライン時)');
      // Don't throw here, let the UI handle API key prompt
    } else if (!this.apiKey && this.isOffline) {
      console.warn('Gemini API キーが設定されていません (オフライン)');
    }

    // Load request queue from storage
    if (this.components.storage) {
      try {
        const storedQueue = await this.components.storage.getCacheItem('offlineRequestQueue');
        if (storedQueue && Array.isArray(storedQueue)) {
          this.requestQueue = storedQueue;
          console.log('Offline request queue loaded from storage:', this.requestQueue.length, 'items');
        }
      } catch (error) {
        console.error('Error loading offline request queue:', error);
      }
    } else {
      console.warn('Storage component not available, offline queue persistence disabled.');
    }

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnlineStatusChange(true));
    window.addEventListener('offline', () => this.handleOnlineStatusChange(false));

    // Initial check and processing if online
    if (!this.isOffline) {
        this.processRequestQueue();
    }

    console.log('Caput Agent initialized successfully. Initial online status:', !this.isOffline);
    return true;
  }

  handleOnlineStatusChange(isOnline) {
    this.isOffline = !isOnline;
    console.log(`Network status changed. Agent is now ${isOnline ? 'online' : 'offline'}.`);
    if (isOnline) {
      this.processRequestQueue();
    }
    // Optionally notify UI about online/offline status
    if (this.tools && typeof this.tools.executeTool === 'function') {
        this.tools.executeTool('showNotification', {
            message: `ネットワーク接続が${isOnline ? '回復しました' : '切れました'}。`,
            type: isOnline ? 'success' : 'warning',
            duration: 3000
        }).catch(e => console.warn("Error sending online/offline notification:", e));
    }
  }

  async queueRequest(requestDetails) {
    if (!this.components.storage) {
      console.error('Storage component not available. Cannot queue request:', requestDetails);
      if (typeof this.tools.executeTool === 'function') {
        this.tools.executeTool('showNotification', {
          message: 'オフラインリクエストをキューに追加できませんでした (ストレージエラー)。',
          type: 'error',
          duration: 5000
        }).catch(e => console.warn("Error sending notification:", e));
      }
      return;
    }

    // Add a timestamp and a unique ID for better tracking
    const queuedItem = {
      id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...requestDetails
    };

    this.requestQueue.push(queuedItem);
    console.log('Request queued:', queuedItem);

    try {
      // TTL: 7 days in minutes (7 * 24 * 60)
      await this.components.storage.setCacheItem('offlineRequestQueue', this.requestQueue, 10080);
      if (typeof this.tools.executeTool === 'function') {
        this.tools.executeTool('showNotification', {
          message: `リクエストはキューに追加されました。オンライン時に処理されます。(現在 ${this.requestQueue.length} 件)`,
          type: 'info',
          duration: 3000
        }).catch(e => console.warn("Error sending notification:", e));
      }
    } catch (error) {
      console.error('Failed to save offline request queue:', error);
      if (typeof this.tools.executeTool === 'function') {
        this.tools.executeTool('showNotification', {
          message: 'オフラインリクエストキューの保存に失敗しました。',
          type: 'error',
          duration: 3000
        }).catch(e => console.warn("Error sending notification:", e));
      }
      // Potentially remove the item from the in-memory queue if saving failed, or implement retry for saving
      this.requestQueue.pop(); // Simple rollback
    }
  }

  async processRequestQueue() {
    if (!this.components.storage || this.requestQueue.length === 0) {
      if (this.requestQueue.length > 0) {
         console.log('Storage component not available. Cannot process request queue.');
      }
      return;
    }

    if (this.isOffline) {
      console.log('Cannot process request queue while offline.');
      return;
    }

    console.log('Processing offline request queue:', this.requestQueue.length, 'items');
    if (typeof this.tools.executeTool === 'function') {
      this.tools.executeTool('showNotification', {
        message: `オンラインになりました。キュー内のリクエスト ${this.requestQueue.length} 件を処理します...`,
        type: 'info',
        duration: 3000
      }).catch(e => console.warn("Error sending notification:", e));
    }

    const processingQueue = [...this.requestQueue]; // Process a copy
    this.requestQueue = []; // Clear the main queue, failed items will be re-added

    for (const item of processingQueue) {
      console.log('Attempting to process queued request:', item);
      try {
        let result;
        // TODO: Make this more generic if other function calls than callGemini are queued.
        // For now, assuming all queued items are `callGemini` related.
        if (item.type === 'callGemini') {
          result = await this.callGemini(item.prompt, item.geminiCallType); // geminiCallType was the original 'type' for callGemini
           // If callGemini was successful, the original caller needs to handle the result.
           // This simplified queue processing just retries the Gemini call.
           // A more robust system would re-trigger the original higher-level function.
          console.log(`Queued request ${item.id} (type: ${item.geminiCallType}) processed successfully. Result:`, result);
          // Here, you'd ideally notify the user or update the UI based on the original goal of this call.
          // For now, just a generic success notification.
          if (typeof this.tools.executeTool === 'function') {
            this.tools.executeTool('showNotification', {
              message: `キュー内のリクエスト (${item.geminiCallType}) が正常に処理されました。`,
              type: 'success',
              duration: 3000
            }).catch(e => console.warn("Error sending notification:", e));
          }
        } else {
            console.warn(`Unknown queued request type: ${item.type}. Skipping.`);
            // Re-add to queue if unknown, as we can't process it.
            this.requestQueue.push(item);
            continue;
        }

      } catch (error) {
        console.error(`Failed to process queued request ${item.id}:`, error);
        // If it's an offline error again, or some other persistent issue, re-queue it.
        // Potentially add a retry limit to items.
        item.retries = (item.retries || 0) + 1;
        if (item.retries <= (this.config.OFFLINE_QUEUE_MAX_RETRIES || 3) ) {
            this.requestQueue.push(item); // Re-add to the main queue to try later
            if (typeof this.tools.executeTool === 'function') {
                this.tools.executeTool('showNotification', {
                message: `キューのリクエスト (${item.geminiCallType}) の処理に失敗しました。再試行します。(${item.retries}回目)`,
                type: 'warning',
                duration: 3000
                }).catch(e => console.warn("Error sending notification:", e));
            }
        } else {
             if (typeof this.tools.executeTool === 'function') {
                this.tools.executeTool('showNotification', {
                message: `キューのリクエスト (${item.geminiCallType}) が最大再試行回数に達しました。`,
                type: 'error',
                duration: 5000
                }).catch(e => console.warn("Error sending notification:", e));
            }
        }
      }
    }

    // Persist the updated queue (items that were re-added)
    try {
      await this.components.storage.setCacheItem('offlineRequestQueue', this.requestQueue, 10080);
      if (this.requestQueue.length > 0) {
        console.log('Updated offline request queue saved. Remaining items:', this.requestQueue.length);
      } else {
        console.log('Offline request queue successfully emptied and saved.');
        if (typeof this.tools.executeTool === 'function') {
            this.tools.executeTool('showNotification', {
            message: `キュー内のすべてのリクエストが処理されました。`,
            type: 'success',
            duration: 3000
            }).catch(e => console.warn("Error sending notification:", e));
        }
      }
    } catch (error) {
      console.error('Failed to save updated offline request queue:', error);
    }
  }

  async processGoal(userGoal) {
    try {
      // Step 1: ANALYZE - 目標理解と文脈分析
      await this.showReasoning('分析開始', 'analyzer', 'active', { goal: userGoal });
      let analysis;
      try {
        analysis = await this.analyzeGoal(userGoal);
      } catch (error) {
        if (error.isOffline) {
          console.warn('Offline during analyzeGoal. Queuing request.');
          await this.queueRequest({
            type: 'callGemini', // Specific type for routing in processRequestQueue
            originalAction: 'analyzeGoal', // For context when processing
            // The prompt for analyzeGoal is complex and generated internally.
            // Storing the userGoal and type is enough to re-trigger analyzeGoal.
            geminiCallType: 'analysis', // Corresponds to the 'type' param in callGemini
            userGoal: userGoal, // Necessary to re-trigger this.analyzeGoal(userGoal)
            // No need to store the full prompt if we re-call analyzeGoal directly.
          });
          const queueError = new Error(`オフラインのためゴール分析をキューに追加しました。オンライン時に再開されます。`);
          queueError.isQueued = true;
          throw queueError;
        }
        throw error; // Re-throw other errors
      }


      // Step 2: PLAN - 多段階計画の生成
      await this.showReasoning('計画策定', 'planner', 'active', analysis);
      let plan;
      try {
        plan = await this.generatePlan(analysis);
      } catch (error) {
         if (error.isOffline) {
          console.warn('Offline during generatePlan. Queuing request.');
          await this.queueRequest({
            type: 'callGemini', // Indicates the action to take when processing queue
            originalAction: 'generatePlan',
            geminiCallType: 'planning',
            analysisData: analysis, // Necessary to re-trigger this.generatePlan(analysis)
          });
          const queueError = new Error(`オフラインのため計画生成をキューに追加しました。オンライン時に再開されます。`);
          queueError.isQueued = true;
          throw queueError;
        }
        throw error;
      }

      // Step 3: EXECUTE - ツール実行ループ
      // Note: executePlan itself has logic for offline tool caching and handling Gemini calls within tools.
      // It might throw errors that need to be caught here if a critical tool fails offline and halts the plan.
      await this.showReasoning('実行開始', 'executor', 'active', { steps: plan.steps.length });
      const results = await this.executePlan(plan, userGoal, analysis);

      // Step 4: VERIFY - 結果検証
      await this.showReasoning('検証実行', 'verifier', 'active', { results: results.length });
      let verification;
      try {
        verification = await this.verifyResults(results, analysis.success_criteria);
      } catch (error) {
        if (error.isOffline) {
          console.warn('Offline during verifyResults. Queuing request.');
          await this.queueRequest({
            type: 'callGemini',
            originalAction: 'verifyResults',
            geminiCallType: 'verification',
            resultsData: results, // Context to re-trigger verifyResults
            criteriaData: analysis.success_criteria
          });
          const queueError = new Error(`オフラインのため結果検証をキューに追加しました。オンライン時に再開されます。`);
          queueError.isQueued = true;
          throw queueError;
        }
        throw error;
      }


      // Step 5: DELIVER - 最終成果物の提示
      await this.showReasoning('完了', 'deliverer', 'completed', verification);
      let finalDelivery;
      try {
        // generateSummary within prepareDelivery makes a Gemini call.
        finalDelivery = await this.prepareDelivery(results, verification);
      } catch (error) {
        if (error.isOffline) {
          // As prepareDelivery > generateSummary is a final summarization step,
          // we might choose not to queue it automatically, or queue it with full context.
          // For now, it will just fail and the user gets results without the final summary.
          console.warn('Offline during prepareDelivery (likely generateSummary). This step is not automatically queued.');
          const offlineError = new Error(`オフラインのため最終成果物の準備 (要約生成など) に失敗しました。`);
          offlineError.isOfflineNoQueue = true; // Special flag
          throw offlineError;
        }
        throw error;
      }

      // Check if any part of the original userGoal was queued.
      const goalWasQueued = this.requestQueue.some(item =>
        (item.userGoal === userGoal && item.originalAction === 'analyzeGoal') ||
        (item.analysisData && JSON.stringify(item.analysisData.user_input) === JSON.stringify(userGoal)) // Heuristic for plan
      );

      return {
        success: !goalWasQueued, // Success is true only if nothing was queued for this specific goal.
        analysis,
        plan,
        results,
        verification,
        delivery: finalDelivery,
        stats: this.getSessionStats(),
        isPartialDueToQueue: goalWasQueued
      };

    } catch (error) {
      // If error.isQueued or error.isOfflineNoQueue, it's an error message we constructed.
      // Otherwise, it's an unexpected error.
      if (!error.isQueued && !error.isOfflineNoQueue) {
         await this.showReasoning('エラー発生', 'error_handler', 'error', { error: error.message });
      }
      throw error; // Re-throw the original or modified error.
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

    // No direct try-catch here for offline, processGoal will handle it.
    const response = await this.callGemini(prompt, 'analysis');
    const tokens = this.estimateTokens(prompt + JSON.stringify(response));
    this.updateStats({ tokens });

    return response;
  }

  async generatePlan(analysis) {
    // Validate tools registry
    if (!this.tools) {
      throw new Error('Tools registry not initialized');
    }
    if (typeof this.tools.getToolList !== 'function') {
      throw new Error('Tools registry getToolList method not available');
    }

    // No direct try-catch here for offline, processGoal will handle it.
    const mode = this.config.EFFICIENCY_MODES[this.currentMode];

    let toolsList = 'ツールリストを取得できません';
    try {
      const tools = this.tools.getToolList();
      if (Array.isArray(tools) && tools.length > 0) {
        toolsList = tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
      } else {
        toolsList = '利用可能なツールがありません';
      }
    } catch (error) {
      console.error('Failed to get tool list:', error);
      toolsList = `ツールリスト取得エラー: ${error.message}`;
    }

    const prompt = `
Task Efficiency Mode: ${mode.name}
最大ステップ数: ${mode.maxPlanSteps}
検証回数: ${mode.verificationCount}

ゴール分析結果:
${JSON.stringify(analysis, null, 2)}

利用可能なツール一覧:
${toolsList}

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

    // No direct try-catch here for offline, processGoal will handle it.
    const response = await this.callGemini(prompt, 'planning');
    const tokens = this.estimateTokens(prompt + JSON.stringify(response));
    this.updateStats({ tokens });

    return response;
  }

  async executePlan(plan, userGoal, analysisContext) { // Added userGoal, analysisContext for re-queueing
    const results = [];
    const mode = this.config.EFFICIENCY_MODES[this.currentMode];

    for (let i = 0; i < plan.steps.length && i < mode.maxToolCalls; i++) {
      const currentStepConfig = plan.steps[i]; // Use a modifiable reference for the current step

      // Initialize attemptedTools for the current conceptual step if not already present
      currentStepConfig.attemptedTools = currentStepConfig.attemptedTools || new Set();
      const currentToolNameForExecution = currentStepConfig.tool; // The tool to be executed in this iteration

      // Ensure the first tool to be tried is part of attemptedTools
      // This is crucial if a step is retried due to `i--` from a previous alternative attempt.
      if (!currentStepConfig.attemptedTools.has(currentToolNameForExecution)) {
          currentStepConfig.attemptedTools.add(currentToolNameForExecution);
          // Store the very first tool name if it's not already stored (marks the beginning of attempts for this step)
          if (!currentStepConfig.originalTool) {
              currentStepConfig.originalTool = currentToolNameForExecution;
          }
      }


      try {
        await this.showReasoning(
          `ステップ ${currentStepConfig.step_number}: ${currentStepConfig.action}`,
          currentToolNameForExecution, // Use the tool for the current attempt
          'active',
          { parameters: currentStepConfig.parameters }
        );

        // Check dependencies
        if (currentStepConfig.dependencies && currentStepConfig.dependencies.length > 0) {
          const dependenciesMet = currentStepConfig.dependencies.every(dep =>
            results.some(r => r.step_number === dep && r.success)
          );

          if (!dependenciesMet) {
            throw new Error(`Dependencies not met for step ${currentStepConfig.step_number}`);
          }
        }

        // OFFLINE TOOL CACHING LOGIC
        if (this.isOffline) {
            const isCacheableTool = this.config.CACHEABLE_TOOLS?.includes(currentToolNameForExecution);
            if (isCacheableTool && this.components.storage) {
                const cacheKey = `toolcache_${currentToolNameForExecution}_${JSON.stringify(currentStepConfig.parameters || {})}`;
                const cachedResult = await this.components.storage.getCacheItem(cacheKey);
                if (cachedResult) {
                    console.log(`Using cached result for offline tool: ${currentToolNameForExecution}`);
                    results.push({ ...cachedResult, fromCache: true, step_number: currentStepConfig.step_number });
                     await this.showReasoning(
                        `完了 (キャッシュ): ${currentStepConfig.action}`,
                        currentToolNameForExecution,
                        'completed',
                        { result: cachedResult, fromCache: true }
                    );
                    currentStepConfig.attemptedTools = new Set(); // Reset for this step as it's now "successful"
                    currentStepConfig.originalTool = null; // Clear original tool tracking
                    continue;
                } else {
                    console.warn(`Offline and no cache for ${currentToolNameForExecution}. Step ${currentStepConfig.step_number} cannot be completed with this tool.`);
                    // This will now fall through to the catch block or try alternatives if defined
                    throw {
                        isOffline: true,
                        isCacheMiss: true,
                        message: `Offline and no cached data available for ${currentToolNameForExecution}.`
                    };
                }
            } else if (this.isOffline && currentToolNameForExecution.toLowerCase().includes('gemini')) {
                 throw {
                    isOffline: true,
                    message: `Tool ${currentToolNameForExecution} requires online access.`
                 };
            }
        }

        // Execute tool
        let toolResult;
        if (currentToolNameForExecution === 'callGeminiDirectly') {
            toolResult = {
                success: true,
                data: await this.callGemini(currentStepConfig.parameters.prompt, currentStepConfig.parameters.type || 'general'),
                error: null
            };
        } else {
            toolResult = await this.tools.executeTool(
              currentToolNameForExecution,
              currentStepConfig.parameters,
              { highRiskEnabled: this.settings?.highRiskToolsEnabled || false }
            );
        }

        const stepResult = {
          step_number: currentStepConfig.step_number,
          action: currentStepConfig.action,
          tool: currentToolNameForExecution, // Log the tool that was actually executed
          success: toolResult.success,
          output: toolResult.data,
          error: toolResult.error,
          execution_time: toolResult.metadata?.executionTime,
          timestamp: new Date().toISOString()
        };

        const isCacheableToolOnline = this.config.CACHEABLE_TOOLS?.includes(currentToolNameForExecution);
        if (toolResult.success && isCacheableToolOnline && this.components.storage) {
            const cacheKey = `toolcache_${currentToolNameForExecution}_${JSON.stringify(currentStepConfig.parameters || {})}`;
            await this.components.storage.setCacheItem(cacheKey, stepResult, 1440)
              .catch(e => console.error("Failed to cache tool result:", e));
        }

        results.push(stepResult);
        this.updateStats({ toolCalls: 1 });

        await this.showReasoning(
          `完了: ${currentStepConfig.action}`,
          currentToolNameForExecution,
          stepResult.success ? 'completed' : 'error',
          { result: stepResult }
        );

        currentStepConfig.attemptedTools = new Set(); // Reset for this step after success
        currentStepConfig.originalTool = null; // Clear original tool tracking

        await new Promise(resolve => setTimeout(resolve, 500)); // Short delay

      } catch (error) {
        // Use originalTool for looking up alternatives if it exists, otherwise use the tool that just failed.
        const toolNameToGetAlternatives = currentStepConfig.originalTool || currentToolNameForExecution;
        const alternatives = (this.config.TOOLS?.TOOL_ALTERNATIVES && this.config.TOOLS.TOOL_ALTERNATIVES[toolNameToGetAlternatives]) || [];
        let nextTool = null;

        for (const alt of alternatives) {
          if (!currentStepConfig.attemptedTools.has(alt)) {
            nextTool = alt;
            break;
          }
        }

        // Check if we should abort based on the current error, even before trying alternatives for some error types.
        if (this.shouldAbortOnError(error, currentStepConfig, results)) {
          // Record final failure for this step using originalTool name if available
          const finalErrorResult = {
            step_number: currentStepConfig.step_number, action: currentStepConfig.action,
            tool: currentStepConfig.originalTool || currentToolNameForExecution, // Report original tool
            success: false, error: error.message, timestamp: new Date().toISOString(),
            isOfflineError: error.isOffline || false
          };
          results.push(finalErrorResult);
          await this.showReasoning( `エラー (致命的/最大試行回数): ${currentStepConfig.action}`, currentStepConfig.originalTool || currentToolNameForExecution, 'error', { error: error.message });
          break; // Abort plan execution
        }

        if (nextTool) {
          await this.showReasoning(
            `ツール ${currentToolNameForExecution} 失敗。代替ツール試行: ${nextTool}`,
            nextTool,
            'active',
            { originalTool: currentToolNameForExecution, error: error.message, parameters: currentStepConfig.parameters }
          );
          currentStepConfig.tool = nextTool; // Update the step to use the alternative tool
          // Do NOT add to attemptedTools here, it's added at the start of the iteration.
          i--; // Decrement i to retry the current step with the alternative tool
          continue; // Jump to the next iteration, which will re-process currentStepConfig with the new tool
        } else {
          // No more alternatives, or shouldAbortOnError was true. Record final failure for this step.
          const finalErrorResult = {
            step_number: currentStepConfig.step_number, action: currentStepConfig.action,
            tool: currentStepConfig.originalTool || currentToolNameForExecution, // Report original tool
            success: false, error: error.message, timestamp: new Date().toISOString(),
            isOfflineError: error.isOffline || false,
            attemptedToolsList: Array.from(currentStepConfig.attemptedTools)
          };
          results.push(finalErrorResult);
          await this.showReasoning(
            `エラー (代替なし): ${currentStepConfig.action}`,
            currentStepConfig.originalTool || currentToolNameForExecution,
            'error',
            { error: error.message, attempted: Array.from(currentStepConfig.attemptedTools) }
          );
          // No break here, loop continues to next step unless failureCount from shouldAbortOnError (checked at start of catch) caused a break.
           if (this.shouldAbortOnError(error, currentStepConfig, results)) { // Re-check after adding this failure
                break;
           }
        }
      }
    }
    return results;
  }

  async verifyResults(results, successCriteria) {
    // No direct try-catch here for offline, processGoal will handle it.
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
    // No direct try-catch here for offline, processGoal will handle it.
    const successfulResults = results.filter(r => r.success);
    const artifacts = this.extractArtifacts(successfulResults);

    const summary = await this.generateSummary(results, verification); // This itself calls Gemini

    return {
      summary, // This could be a problem if generateSummary fails offline
      artifacts,
      metrics: {
        steps_completed: successfulResults.length, // Filtered for success
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

    // This is a call to Gemini. If it fails offline, the whole prepareDelivery might fail.
    // processGoal has a try-catch for prepareDelivery, but doesn't queue it by default.
    const response = await this.callGemini(prompt, 'summary');
    const tokens = this.estimateTokens(prompt + response);
    this.updateStats({ tokens });

    return response;
  }
  async callGemini(prompt, type = 'general') {
    if (!this.apiKey && this.isOffline) {
      // Potentially queue this goal if it's a critical user request
      console.warn('API key not available and offline. Goal processing may be queued.');
      // For now, let it proceed to callGemini which will handle the offline error
      // In a more robust implementation, one might queue `processGoal` itself here.
    } else if (!this.apiKey) {
        throw new Error('API key not configured');
    }


    const mode = this.config.EFFICIENCY_MODES[this.currentMode];
    
    // Get user's preferred AI model from settings
    let selectedModel = this.config.API.DEFAULT_MODEL;
    if (window.caputApp && window.caputApp.components.ui && window.caputApp.components.ui.settings) {
      selectedModel = window.caputApp.components.ui.settings.aiModel || selectedModel;
    }
    
    // Use the selected model's endpoint
    const modelConfig = this.config.API.MODELS[selectedModel];
    if (!modelConfig) {
      console.warn(`Model ${selectedModel} not found, using default`);
      selectedModel = this.config.API.DEFAULT_MODEL;
    }
    
    const modelEndpoint = `${this.config.API.GEMINI_ENDPOINT}${this.config.API.MODELS[selectedModel].endpoint}`;

    const controller = new AbortController();
    const timeoutValue = (this.config.API && typeof this.config.API.API_TIMEOUT === 'number') ? this.config.API.API_TIMEOUT : 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutValue);

    let response;
    try {
      response = await fetch(`${modelEndpoint}?key=${this.apiKey}`, { // Ensure apiKey is available
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
        const offlineError = new Error(`Gemini API request timed out after ${timeoutValue}ms. This might be due to network issues.`);
        offlineError.isOffline = true; // Custom property
        offlineError.isTimeout = true;
        throw offlineError;
      }
      // Check for general fetch error (often indicates offline)
      if (error.name === 'TypeError' && error.message.toLowerCase().includes('failed to fetch')) {
        const offlineError = new Error('Network error: Failed to fetch. You might be offline.');
        offlineError.isOffline = true;
        throw offlineError;
      }
      throw error; // Re-throw other errors
    } finally {
      clearTimeout(timeoutId); // Important: clear the timeout
    }

    if (!response.ok) {
      const status = response.status;
      const statusText = response.statusText;
      let errorMsg = `Gemini API error: ${status} ${statusText}.`;
      let isCritical = false;

      // Check for API key related errors (e.g., 401 Unauthorized, 403 Forbidden)
      if (status === 401 || status === 403) {
        errorMsg = `Gemini API error: ${status} ${statusText}. API Key may be invalid or have insufficient permissions.`;
        isCritical = true;
        // Potentially clear the stored API key or prompt user to re-enter
        console.error("Critical API Key Error. Consider clearing stored key or prompting user.");
        // this.clearApiKey(); // Example if such a method exists and is desired
      }

      // Check if it's the service worker's offline response
      if (status === 503) {
        try {
          const errorData = await response.json(); // Try to parse error response from API or SW
          if (errorData.error === 'Offline, request not sent') {
            const offlineError = new Error('Offline: Request not sent by Service Worker.');
            offlineError.isOffline = true;
            offlineError.isServiceWorkerOfflineResponse = true;
            throw offlineError; // Throw immediately for this specific offline case
          } else if (errorData.error && errorData.error.message) {
             // Use detailed error message from API if available
             errorMsg = `Gemini API error: ${status} ${statusText} - ${errorData.error.message}`;
          }
        } catch (e) {
          // Not a JSON response or not our specific offline message, proceed as normal error
        }
      }

      const apiError = new Error(errorMsg);
      if (isCritical) {
        apiError.isCritical = true;
      }
      throw apiError;
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
    // If the error is marked as critical (e.g., invalid API key), abort immediately.
    if (error.isCritical) {
      console.warn(`Aborting due to critical error: ${error.message}`, step);
      return true;
    }

    // If the error is an offline error but the step was part of a process that couldn't be queued
    // (e.g., a tool running when online, but it internally fails due to a sudden network drop
    // and this specific tool call isn't designed to be queued by itself),
    // we might want to abort if we can't proceed.
    // However, most offline errors should be caught before this, and the task queued.
    // This check here handles offline errors that might slip through or occur in non-Gemini calls.
    if (error.isOffline) {
        // If a specific step/tool is vital and cannot run offline and has no cached alternative.
        // For now, we don't make shouldAbortOnError more lenient for offline errors here,
        // as the primary offline handling is queuing at a higher level (processGoal).
        // If an offline error reaches here during executePlan, it means a tool failed,
        // and it might count towards maxFailures unless specific logic for that tool says otherwise.
        console.warn(`Offline error encountered in step ${step.step_number} (${step.tool}). Will count towards max failures unless handled by tool logic.`);
    }

    const failureCount = results.filter(r => !r.success).length;
    // Ensure MAX_CONSECUTIVE_FAILS is being read from the new AGENT_BEHAVIOR config if that's where it moved,
    // or from SAFETY if it's still there. Assuming it's in SAFETY for now as per original code.
    // If it moved to AGENT_BEHAVIOR.MAX_OFFLINE_RETRIES, this would need updating.
    // The config.js has OFFLINE_QUEUE_MAX_RETRIES in AGENT_BEHAVIOR.
    // Let's assume MAX_CONSECUTIVE_FAILS is still for general plan execution failures.
    const maxFailures = (this.config.SAFETY && typeof this.config.SAFETY.MAX_CONSECUTIVE_FAILS === 'number')
                        ? this.config.SAFETY.MAX_CONSECUTIVE_FAILS
                        : 3; // Default from original code

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
    // Prefer CaputStorage if available and encryption is desired, otherwise fallback to localStorage
    if (this.components.storage && typeof this.components.storage.loadApiKey === 'function') {
        try {
            const key = await this.components.storage.loadApiKey();
            if (key) return key;
        } catch (e) {
            console.error("Error loading API key from CaputStorage:", e);
        }
    }
    // Fallback to direct localStorage access (original method)
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
    // Prefer CaputStorage if available, otherwise fallback to localStorage
     if (this.components.storage && typeof this.components.storage.loadSettings === 'function') {
        try {
            // Assuming loadSettings in CaputStorage returns settings in the expected format
            // and handles defaults if nothing is stored.
            return await this.components.storage.loadSettings();
        } catch (e) {
            console.error("Error loading settings from CaputStorage:", e);
        }
    }
    // Fallback to direct localStorage access (original method)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const settingsString = localStorage.getItem(this.config.STORAGE_KEYS.SETTINGS);
        if (settingsString) {
          return { ...(this.config.DEFAULT_SETTINGS || {}), ...JSON.parse(settingsString) };
        }
      }
    } catch (e) {
      console.error("Error loading settings from localStorage:", e);
    }
    return { ...(this.config.DEFAULT_SETTINGS || {}) };
  }

  async setEfficiencyMode(mode) {
    if (this.config.EFFICIENCY_MODES && this.config.EFFICIENCY_MODES[mode]) {
      this.currentMode = mode;
      let currentSettings = await this.loadSettings();
      currentSettings.efficiencyMode = mode;

      if (this.components.storage && typeof this.components.storage.saveSettings === 'function') {
          try {
              await this.components.storage.saveSettings(currentSettings);
          } catch (e) {
              console.error("Error saving efficiency mode to CaputStorage:", e);
          }
      } else {
        // Fallback to direct localStorage access
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(this.config.STORAGE_KEYS.SETTINGS, JSON.stringify(currentSettings));
          }
        } catch (e) {
          console.error("Error saving efficiency mode to localStorage:", e);
        }
      }
      console.log(`Efficiency mode changed to: ${this.config.EFFICIENCY_MODES[mode].name}`);
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
    // this.requestQueue = []; // Decide if reset should clear the queue. Generally, no.
    const previousSessionCount = this.stats.sessionsCount || 0;
    this.stats = {
      tokensUsed: 0,
      toolCallsCount: 0,
      totalCost: 0,
      sessionsCount: previousSessionCount + 1
    };
    console.log(`Agent reset for new session (${this.stats.sessionsCount}). Offline queue remains.`);
  }
}

// Export for global access or modules
if (typeof window !== 'undefined') {
  window.CaputAgent = CaputAgent;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CaputAgent;
}
