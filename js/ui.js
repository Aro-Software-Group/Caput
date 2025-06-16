// Caput UI Controller - Interface Management & User Experience
class CaputUI {
  constructor() {
    this.elements = {};
    this.reasoningSteps = [];
    this.chatHistory = [];
    this.taskBoard = {
      pending: [],
      doing: [],
      done: []
    };
    this.settings = {
      theme: 'light',
      efficiencyMode: 'middle',
      highRiskToolsEnabled: false
    };
    this.isProcessing = false;
  }  async initialize() {
    console.log('=== CaputUI Initialize Start ===');
    this.bindElements();
    this.attachEventListeners();
    await this.loadSettings();
    this.setupTheme();
    this.initializeTaskBoard();
    this.setupMobileSupport();
    
    console.log('=== CaputUI Initialize Complete ===');
    console.log('Settings button element:', this.elements.settingsBtn);
    console.log('Settings modal element:', this.elements.settingsModal);
  }  bindElements() {
    console.log('=== Binding UI elements ===');
    
    this.elements = {
      // Header
      efficiencyModeSelect: document.getElementById('efficiency-mode'),
      settingsBtn: document.getElementById('settings-btn'),
      
      // Chat Interface
      chatMessages: document.getElementById('chat-messages'),
      userInput: document.getElementById('user-input'),
      sendBtn: document.getElementById('send-btn'),
      
      // Reasoning Panel
      reasoningContent: document.getElementById('reasoning-content'),
      reasoningCollapse: document.getElementById('reasoning-collapse'),
      
      // Usage Dashboard
      tokenCount: document.getElementById('token-count'),
      costEstimate: document.getElementById('cost-estimate'),
      toolCount: document.getElementById('tool-count'),
      
      // Task Board
      taskBoard: document.getElementById('task-board'),
      toggleBoard: document.getElementById('toggle-board'),
      pendingTasks: document.getElementById('pending-tasks'),
      doingTasks: document.getElementById('doing-tasks'),
      doneTasks: document.getElementById('done-tasks'),
      pendingCount: document.getElementById('pending-count'),
      doingCount: document.getElementById('doing-count'),
      doneCount: document.getElementById('done-count'),        // Settings Modal
      settingsModal: document.getElementById('settings-modal'),
      closeSettings: document.getElementById('close-settings'),
      geminiApiKey: document.getElementById('gemini-api-key'),
      userName: document.getElementById('user-name'),
      themeSelector: document.getElementById('theme-selector'),
      aiModelSelector: document.getElementById('ai-model-selector'),
      efficiencyModeSelect: document.getElementById('efficiency-mode-selector'),
      enableScraping: document.getElementById('enable-scraping'),
      enableSecurity: document.getElementById('enable-security'),
      saveSettings: document.getElementById('save-settings'),
      clearHistory: document.getElementById('clear-history'),
      settingsMessage: document.getElementById('settings-message'),

      // Onboarding Modal
      onboardingModal: document.getElementById('onboarding-modal'),
      onboardingUsername: document.getElementById('onboarding-username'),
      onboardingApiKey: document.getElementById('onboarding-api-key'),
      onboardingSave: document.getElementById('onboarding-save'),
      
      // Loading Overlay
      loadingOverlay: document.getElementById('loading-overlay')
    };

    // Log missing elements for debugging
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) {
        console.warn(`Element not found: ${key} (${key})`);
      }
    });    console.log('Elements bound:', Object.keys(this.elements).filter(key => this.elements[key]));
  }

  attachEventListeners() {
    // Chat functionality
    this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
    this.elements.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });    // Settings - Enhanced event listeners with touch support
    if (this.elements.settingsBtn) {
      console.log('Settings button found, adding event listeners');
      // Add both click and touchstart for better mobile responsiveness
      this.elements.settingsBtn.addEventListener('click', (e) => {
        console.log('Settings button clicked');
        e.preventDefault();
        this.showSettings();
      });
      this.elements.settingsBtn.addEventListener('touchstart', (e) => {
        console.log('Settings button touched');
        e.preventDefault();
        this.showSettings();
      }, { passive: false });
    } else {
      console.error('Settings button element not found!');
    }
    if (this.elements.closeSettings) {
      this.elements.closeSettings.addEventListener('click', () => this.hideSettings());
    }    if (this.elements.saveSettings) {
      this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
    }
    if (this.elements.clearHistory) {
      this.elements.clearHistory.addEventListener('click', () => this.clearChatHistory());
    }

    // Efficiency mode
    if (this.elements.efficiencyModeSelect) {
      this.elements.efficiencyModeSelect.addEventListener('change', (e) => {
        this.changeEfficiencyMode(e.target.value);
      });
    }

    // Task board toggle
    if (this.elements.toggleBoard) {
      this.elements.toggleBoard.addEventListener('click', () => this.toggleTaskBoard());
    }

    // Reasoning panel collapse
    if (this.elements.reasoningCollapse) {
      this.elements.reasoningCollapse.addEventListener('click', () => this.toggleReasoningPanel());
    }

    // Theme handling
    if (this.elements.themeSelector) {
      this.elements.themeSelector.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
      });
    }

    // Modal click outside to close
    if (this.elements.settingsModal) {
      this.elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === this.elements.settingsModal) {
          this.hideSettings();
        }
      });
    }

    // Onboarding modal save
    if (this.elements.onboardingSave) {
      this.elements.onboardingSave.addEventListener('click', () => this.saveOnboarding());
    }

    if (this.elements.onboardingModal) {
      this.elements.onboardingModal.addEventListener('click', (e) => {
        if (e.target === this.elements.onboardingModal) {
          this.hideOnboarding();
        }
      });
    }

    // Auto-resize textarea
    if (this.elements.userInput) {
      this.elements.userInput.addEventListener('input', () => {
        this.autoResizeTextarea(this.elements.userInput);
      });
    }
  }

  async sendMessage() {
    const message = this.elements.userInput.value.trim();
    if (!message || this.isProcessing) return;

    this.isProcessing = true;
    this.elements.sendBtn.disabled = true;
    this.elements.userInput.value = '';    // Add user message to chat
    this.addChatMessage(message, 'user');

    // Show typing indicator
    this.showTypingIndicator();
    this.clearReasoningPanel();    try {
      // Initialize agent if needed
      if (!window.caputAgent) {
        throw new Error('AI エージェントが初期化されていません');
      }

      // Check if API key is available
      if (!window.caputAgent.apiKey && navigator.onLine) {
        throw new Error('API キーが設定されていません。設定画面でAPI キーを入力してください。');
      }

      // Process the goal
      const result = await window.caputAgent.processGoal(message);
      
      // Hide typing indicator
      this.hideTypingIndicator();

      // Display results
      await this.displayResults(result);
    } catch (error) {
      this.hideTypingIndicator();
      
      // Handle different types of errors
      let errorMessage = error.message;
      if (error.isQueued) {
        errorMessage = 'オフラインのため、リクエストをキューに追加しました。オンライン時に処理されます。';
        this.addChatMessage(errorMessage, 'agent', 'warning');
      } else if (error.isOfflineNoQueue) {
        this.addChatMessage(errorMessage, 'agent', 'warning');
      } else {
        this.addChatMessage(`エラーが発生しました: ${errorMessage}`, 'agent', 'error');
      }
      
      this.addReasoningStep({
        event: 'エラー',
        tool: 'system',
        status: 'error',
        metadata: { error: errorMessage },
        timestamp: new Date()
      });
    } finally {
      this.isProcessing = false;
      this.elements.sendBtn.disabled = false;
    }
  }
  addChatMessage(content, sender = 'agent', type = 'normal') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = document.createElement('div');
    avatar.className = sender === 'user' ? 'user-avatar' : 'agent-avatar';
    avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (type === 'error') {
      messageContent.style.borderLeft = '3px solid var(--error-red)';
      if (sender === 'agent') {
        messageContent.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
      }
    } else if (type === 'success') {
      messageContent.style.borderLeft = '3px solid var(--success-green)';
      if (sender === 'agent') {
        messageContent.style.backgroundColor = 'rgba(52, 199, 89, 0.1)';
      }
    }

    // Parse markdown-like content
    const formattedContent = this.formatMessageContent(content);
    messageContent.innerHTML = formattedContent;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    this.elements.chatMessages.appendChild(messageDiv);
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;

    // Save to history
    this.chatHistory.push({
      content,
      sender,
      type,
      timestamp: new Date().toISOString()
    });  }

  formatMessageContent(content) {
    if (typeof content === 'object') {
      content = JSON.stringify(content, null, 2);
    }

    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  async displayResults(result) {
    if (!result.success) {
      this.addChatMessage('タスクの実行に失敗しました。', 'agent', 'error');
      return;
    }

    // Display summary
    this.addChatMessage(result.delivery.summary, 'agent', 'success');

    // Display artifacts
    if (result.delivery.artifacts && result.delivery.artifacts.length > 0) {
      this.displayArtifacts(result.delivery.artifacts);
    }

    // Display metrics
    this.displayMetrics(result.delivery.metrics, result.delivery.cost_breakdown);

    // Update task board
    this.updateTaskBoardFromResults(result.results);
  }

  displayArtifacts(artifacts) {
    artifacts.forEach(artifact => {
      const artifactDiv = document.createElement('div');
      artifactDiv.className = 'artifact-container';
      artifactDiv.style.cssText = `
        margin: 16px 0;
        padding: 16px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--background-secondary);
      `;

      const title = document.createElement('h4');
      title.textContent = artifact.title;
      title.style.cssText = `
        margin-bottom: 12px;
        color: var(--primary-blue);
        font-size: 14px;
        font-weight: 600;
      `;

      artifactDiv.appendChild(title);

      if (artifact.type === 'html' && artifact.preview_url) {
        const iframe = document.createElement('iframe');
        iframe.src = artifact.preview_url;
        iframe.style.cssText = `
          width: 100%;
          height: 300px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
        `;
        artifactDiv.appendChild(iframe);
      } else if (artifact.type === 'svg') {
        const svgContainer = document.createElement('div');
        svgContainer.innerHTML = artifact.content;
        svgContainer.style.cssText = `
          text-align: center;
          padding: 16px;
          background: white;
          border-radius: var(--radius-sm);
        `;
        artifactDiv.appendChild(svgContainer);
      } else if (artifact.type === 'markdown') {
        const textArea = document.createElement('textarea');
        textArea.value = artifact.content;
        textArea.readOnly = true;
        textArea.style.cssText = `
          width: 100%;
          height: 200px;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 12px;
          resize: vertical;
        `;
        artifactDiv.appendChild(textArea);
      }

      // Add download button
      const downloadBtn = document.createElement('button');
      downloadBtn.textContent = 'ダウンロード';
      downloadBtn.className = 'btn secondary';
      downloadBtn.style.marginTop = '8px';
      downloadBtn.onclick = () => this.downloadArtifact(artifact);
      artifactDiv.appendChild(downloadBtn);

      this.elements.chatMessages.appendChild(artifactDiv);
    });
  }

  displayMetrics(metrics, costBreakdown) {
    const metricsDiv = document.createElement('div');
    metricsDiv.className = 'metrics-display';
    metricsDiv.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      background: var(--background-tertiary);
      border-radius: var(--radius-md);
      font-size: 14px;
    `;

    metricsDiv.innerHTML = `
      <h4 style="margin-bottom: 12px; color: var(--text-primary);">実行結果サマリー</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
        <div>
          <div style="color: var(--text-secondary);">完了ステップ</div>
          <div style="font-weight: 600; color: var(--primary-blue);">${metrics.steps_completed}/${metrics.total_steps}</div>
        </div>
        <div>
          <div style="color: var(--text-secondary);">成功率</div>
          <div style="font-weight: 600; color: var(--success-green);">${Math.round(metrics.success_rate * 100)}%</div>
        </div>
        <div>
          <div style="color: var(--text-secondary);">品質スコア</div>
          <div style="font-weight: 600; color: var(--primary-blue);">${metrics.quality_score}/100</div>
        </div>
        <div>
          <div style="color: var(--text-secondary);">実行時間</div>
          <div style="font-weight: 600;">${Math.round(metrics.execution_time)}ms</div>
        </div>
        <div>
          <div style="color: var(--text-secondary);">推定コスト</div>
          <div style="font-weight: 600; color: var(--warning-orange);">¥${costBreakdown.total_cost_jpy.toFixed(2)}</div>
        </div>
      </div>
    `;

    this.elements.chatMessages.appendChild(metricsDiv);
  }

  addReasoningStep(step) {
    this.reasoningSteps.push(step);

    // Remove placeholder if it exists
    const placeholder = this.elements.reasoningContent.querySelector('.reasoning-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    const stepDiv = document.createElement('div');
    stepDiv.className = `reasoning-step ${step.status}`;

    const title = document.createElement('div');
    title.className = 'step-title';
    title.textContent = `${step.event} (${step.tool})`;

    const description = document.createElement('div');
    description.className = 'step-description';
    description.textContent = step.metadata ? JSON.stringify(step.metadata, null, 2) : '';

    stepDiv.appendChild(title);
    stepDiv.appendChild(description);

    this.elements.reasoningContent.appendChild(stepDiv);
    this.elements.reasoningContent.scrollTop = this.elements.reasoningContent.scrollHeight;

    // Auto-expand reasoning panel if collapsed
    if (this.elements.reasoningContent.style.display === 'none') {
      this.toggleReasoningPanel();
    }
  }

  clearReasoningPanel() {
    this.reasoningSteps = [];
    this.elements.reasoningContent.innerHTML = `
      <div class="reasoning-placeholder">
        <i class="fas fa-brain"></i>
        <p>AI エージェントが思考中...</p>
      </div>
    `;
  }

  updateUsageStats(stats) {
    this.elements.tokenCount.textContent = stats.tokens.toLocaleString();
    this.elements.costEstimate.textContent = `¥${stats.cost.toFixed(2)}`;
    this.elements.toolCount.textContent = stats.toolCalls.toString();
  }

  // Update tool usage statistics
  updateToolUsageStats() {
    if (window.caputAgent && window.caputAgent.tools) {
      const stats = window.caputAgent.tools.getUsageStats?.();
      if (stats) {
        this.updateUsageStats(stats);
      }
    }
  }

  // Display available tools count in UI
  displayToolsInfo() {
    if (window.caputAgent && window.caputAgent.tools) {
      const tools = window.caputAgent.tools.getAllTools?.();
      if (tools) {
        const toolCountElement = document.getElementById('tool-count');
        if (toolCountElement) {
          toolCountElement.textContent = tools.length;
        }
        
        // Update tooltip or info about loaded modules
        const categories = window.caputAgent.tools.getCategories?.();
        const modules = window.caputAgent.tools.getLoadedModules?.();
        
        console.log(`Loaded ${tools.length} tools from ${modules?.length || 0} modules:`, categories);
      }
    }
  }

  updateTaskBoardFromResults(results) {
    // Clear existing tasks
    this.taskBoard = { pending: [], doing: [], done: [] };

    results.forEach(result => {
      const task = {
        id: `task-${Date.now()}-${Math.random()}`,
        title: result.action,
        tool: result.tool,
        status: result.success ? 'done' : 'error',
        timestamp: result.timestamp
      };

      if (result.success) {
        this.taskBoard.done.push(task);
      } else {
        this.taskBoard.pending.push(task); // Failed tasks go back to pending
      }
    });

    this.renderTaskBoard();
  }

  renderTaskBoard() {
    // Clear existing tasks
    this.elements.pendingTasks.innerHTML = '';
    this.elements.doingTasks.innerHTML = '';
    this.elements.doneTasks.innerHTML = '';

    // Render tasks
    this.taskBoard.pending.forEach(task => {
      this.elements.pendingTasks.appendChild(this.createTaskElement(task));
    });

    this.taskBoard.doing.forEach(task => {
      this.elements.doingTasks.appendChild(this.createTaskElement(task));
    });

    this.taskBoard.done.forEach(task => {
      this.elements.doneTasks.appendChild(this.createTaskElement(task));
    });

    // Update counts
    this.elements.pendingCount.textContent = this.taskBoard.pending.length;
    this.elements.doingCount.textContent = this.taskBoard.doing.length;
    this.elements.doneCount.textContent = this.taskBoard.done.length;
  }

  createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.status}`;
    taskDiv.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 4px;">${task.title}</div>
      <div style="font-size: 12px; color: var(--text-tertiary);">${task.tool}</div>
    `;
    return taskDiv;
  }  showSettings() {
    console.log('showSettings called');
    if (!this.elements.settingsModal) {
      console.error('Settings modal element not found');
      return;
    }
    this.elements.settingsModal.classList.add('visible');
    this.loadCurrentSettings();
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    console.log('Settings modal should now be visible');
  }
  hideSettings() {
    console.log('hideSettings called');
    if (!this.elements.settingsModal) {
      console.error('Settings modal element not found');
      return;
    }
    this.elements.settingsModal.classList.remove('visible');
    
    // Restore body scroll
    document.body.style.overflow = '';
    console.log('Settings modal hidden');
  }

  showOnboarding() {
    this.elements.onboardingModal.classList.add('visible');
  }

  hideOnboarding() {
    this.elements.onboardingModal.classList.remove('visible');
  }

  async saveOnboarding() {
    const name = this.elements.onboardingUsername.value.trim();
    const key = this.elements.onboardingApiKey.value.trim();

    if (name) {
      localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.USER_NAME, name);
    }
    if (key) {
      localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.API_KEY, key);
    }

    this.hideOnboarding();

    if (window.caputApp) {
      await window.caputApp.reinitialize();
    }
  }
  loadCurrentSettings() {
    // Load API key (masked)
    const apiKey = localStorage.getItem(CAPUT_CONFIG.STORAGE_KEYS.API_KEY);
    if (apiKey) {
      this.elements.geminiApiKey.value = '••••••••••••••••';
    }

    // Load user name
    const userName = localStorage.getItem(CAPUT_CONFIG.STORAGE_KEYS.USER_NAME) || '';
    if (this.elements.userName) {
      this.elements.userName.value = userName;
    }

    // Load other settings    this.elements.themeSelector.value = this.settings.theme;
    if (this.elements.aiModelSelector) {
      this.elements.aiModelSelector.value = this.settings.aiModel || CAPUT_CONFIG.DEFAULT_SETTINGS.aiModel;
    }
    if (this.elements.efficiencyModeSelect) {
      this.elements.efficiencyModeSelect.value = this.settings.efficiencyMode || 'middle';
    }
    this.elements.enableScraping.checked = this.settings.highRiskToolsEnabled;
    this.elements.enableSecurity.checked = this.settings.highRiskToolsEnabled;
  }  async saveSettings() {
    try {
      // Save API key if changed
      const apiKey = this.elements.geminiApiKey.value;
      if (apiKey && !apiKey.includes('•')) {
        // Use the storage component for secure API key storage
        if (window.caputApp && window.caputApp.components.storage) {
          await window.caputApp.components.storage.saveApiKey(apiKey);
        } else {
          // Fallback to localStorage (less secure)
          localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.API_KEY, apiKey);
        }
        
        // Reinitialize agent with new API key
        if (window.caputAgent) {
          try {
            window.caputAgent.apiKey = apiKey;
            await window.caputAgent.initialize();
            this.showSettingsMessage('API キーが設定されました', 'success');
          } catch (error) {
            this.showSettingsMessage('API キーの検証に失敗しました', 'error');
            console.error('Failed to initialize agent:', error);
          }
        }
      }

      // Save user name
      const userName = this.elements.userName.value.trim();
      if (userName) {
        localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.USER_NAME, userName);
      }      // Save other settings
      this.settings.theme = this.elements.themeSelector.value;
      this.settings.aiModel = this.elements.aiModelSelector.value;
      this.settings.highRiskToolsEnabled = this.elements.enableScraping.checked;
      this.settings.efficiencyMode = this.elements.efficiencyModeSelect?.value || this.settings.efficiencyMode;

      // Use storage component if available
      if (window.caputApp && window.caputApp.components.storage) {
        await window.caputApp.components.storage.saveSettings(this.settings);
      } else {
        // Fallback to localStorage
        localStorage.setItem(CAPUT_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      }

      // Apply theme
      this.applyTheme(this.settings.theme);

      // Apply efficiency mode
      if (window.caputAgent && this.settings.efficiencyMode) {
        await window.caputAgent.setEfficiencyMode(this.settings.efficiencyMode);
      }      this.hideSettings();
      this.showSettingsMessage('設定を保存しました', 'success');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showSettingsMessage('設定の保存に失敗しました', 'error');
    }
  }

  clearChatHistory() {
    if (confirm('チャット履歴をすべて消去しますか？この操作は元に戻せません。')) {
      // Clear chat history from localStorage
      localStorage.removeItem('chatHistory');
      
      // Clear chat messages from UI
      if (this.elements.chatMessages) {
        this.elements.chatMessages.innerHTML = '';
      }
      
      // Clear in-memory chat history
      this.chatHistory = [];
      
      this.showSettingsMessage('チャット履歴を消去しました', 'success');
    }
  }

  showSettingsMessage(message, type) {
    if (!this.elements.settingsMessage) return;
    
    const messageElement = this.elements.settingsMessage;
    messageElement.textContent = message;
    messageElement.className = `settings-message ${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      messageElement.textContent = '';
      messageElement.className = 'settings-message';
    }, 3000);
  }

  clearAllData() {
    if (confirm('すべてのデータを削除しますか？この操作は元に戻せません。')) {
      localStorage.clear();
      this.showNotification('データを削除しました', 'success');
      setTimeout(() => location.reload(), 1000);
    }
  }
  async loadSettings() {
    try {
      if (window.caputApp && window.caputApp.components.storage) {
        this.settings = await window.caputApp.components.storage.loadSettings();
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem(CAPUT_CONFIG.STORAGE_KEYS.SETTINGS);
        if (saved) {
          this.settings = { ...CAPUT_CONFIG.DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } else {
          this.settings = { ...CAPUT_CONFIG.DEFAULT_SETTINGS };
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { ...CAPUT_CONFIG.DEFAULT_SETTINGS };
    }
  }

  applyTheme(theme) {
    if (theme === 'auto') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    this.settings.theme = theme;
  }

  setupTheme() {
    this.applyTheme(this.settings.theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.settings.theme === 'auto') {
        this.applyTheme('auto');
      }
    });
  }

  changeEfficiencyMode(mode) {
    this.settings.efficiencyMode = mode;
    if (window.caputAgent) {
      window.caputAgent.setEfficiencyMode(mode);
    }
    this.showNotification(`効率性モードを${CAPUT_CONFIG.EFFICIENCY_MODES[mode].name}に変更しました`, 'info');
  }

  toggleTaskBoard() {
    this.elements.taskBoard.classList.toggle('expanded');
    const icon = this.elements.toggleBoard.querySelector('i');
    icon.className = this.elements.taskBoard.classList.contains('expanded') 
      ? 'fas fa-chevron-down' 
      : 'fas fa-chevron-up';
  }

  toggleReasoningPanel() {
    const content = this.elements.reasoningContent;
    const icon = this.elements.reasoningCollapse.querySelector('i');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      icon.className = 'fas fa-chevron-up';
    } else {
      content.style.display = 'none';
      icon.className = 'fas fa-chevron-down';
    }
  }

  initializeTaskBoard() {
    this.renderTaskBoard();
  }

  showLoading() {
    this.elements.loadingOverlay.classList.add('visible');
  }

  hideLoading() {
    this.elements.loadingOverlay.classList.remove('visible');
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');

    // Adjust top position based on screen width (mobile vs desktop header height)
    const isMobile = window.innerWidth <= 768;
    const topPosition = isMobile ? '60px' : '80px'; // Header is 50px on mobile, 60px on desktop

    notification.style.cssText = `
      position: fixed;
      top: ${topPosition};
      right: 20px;
      padding: 12px 16px;
      background: var(--primary-blue);
      color: white;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg);
      z-index: 2000;
      font-size: 14px;
      max-width: 300px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;

    if (type === 'success') {
      notification.style.background = 'var(--success-green)';
    } else if (type === 'error') {
      notification.style.background = 'var(--error-red)';
    } else if (type === 'warning') {
      notification.style.background = 'var(--warning-orange)';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  downloadArtifact(artifact) {
    let content = artifact.content;
    let filename = artifact.title.toLowerCase().replace(/\s+/g, '_');
    let mimeType = 'text/plain';

    if (artifact.type === 'html') {
      filename += '.html';
      mimeType = 'text/html';
    } else if (artifact.type === 'svg') {
      filename += '.svg';
      mimeType = 'image/svg+xml';
    } else if (artifact.type === 'markdown') {
      filename += '.md';
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ChatGPT-like typing indicator
  showTypingIndicator() {
    this.hideTypingIndicator(); // Remove any existing indicator
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message agent-message typing-indicator-message';
    typingDiv.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'agent-avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';

    const typingContent = document.createElement('div');
    typingContent.className = 'typing-indicator';
    
    const typingText = document.createElement('span');
    typingText.textContent = 'Caputが入力中';
    
    const typingDots = document.createElement('div');
    typingDots.className = 'typing-dots';
    typingDots.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    typingContent.appendChild(typingText);
    typingContent.appendChild(typingDots);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingContent);

    this.elements.chatMessages.appendChild(typingDiv);
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  setupMobileSupport() {
    // Add touch event handling for mobile devices
    this.addTouchSupport();
    this.setupSwipeGestures();
    this.improveModalMobileExperience();
  }

  addTouchSupport() {
    // Improve button touch targets
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
      button.style.minHeight = '44px';
      button.style.minWidth = '44px';
    });

    // Add visual feedback for touch events
    document.addEventListener('touchstart', (e) => {
      if (e.target.matches('button, .btn, .task-item, .message')) {
        e.target.style.transform = 'scale(0.95)';
        e.target.style.transition = 'transform 0.1s ease';
      }
    });

    document.addEventListener('touchend', (e) => {
      if (e.target.matches('button, .btn, .task-item, .message')) {
        setTimeout(() => {
          e.target.style.transform = '';
        }, 100);
      }
    });
  }

  setupSwipeGestures() {
    let startY = 0;
    let startTime = 0;

    // Task board swipe gestures
    const taskBoard = this.elements.taskBoard;
    if (taskBoard) {
      taskBoard.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        startTime = Date.now();
      });

      taskBoard.addEventListener('touchend', (e) => {
        const endY = e.changedTouches[0].clientY;
        const endTime = Date.now();
        const deltaY = endY - startY;
        const deltaTime = endTime - startTime;

        // Swipe up to expand, swipe down to collapse
        if (deltaTime < 300 && Math.abs(deltaY) > 50) {
          if (deltaY < -50) {
            // Swipe up - expand
            taskBoard.classList.add('expanded');
          } else if (deltaY > 50) {
            // Swipe down - collapse
            taskBoard.classList.remove('expanded');
          }
        }
      });
    }
  }

  improveModalMobileExperience() {
    // Close modal when tapping outside
    document.addEventListener('touchstart', (e) => {
      const settingsModal = this.elements.settingsModal;
      const onboardingModal = this.elements.onboardingModal;
      
      if (settingsModal && settingsModal.classList.contains('visible')) {
        if (e.target === settingsModal) {
          this.hideSettings();
        }
      }
      
      if (onboardingModal && onboardingModal.classList.contains('visible')) {
        if (e.target === onboardingModal) {
          this.hideOnboarding();
        }
      }
    });

    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      });
      
      input.addEventListener('blur', () => {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
      });
    });
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.CaputUI = CaputUI;
}
