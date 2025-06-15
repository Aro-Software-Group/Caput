// Productivity & Automation Tools
class ProductivityTools {
  constructor() {
    this.category = 'productivity';
  }

  async codeExplainer(params) {
    const { code, language = 'javascript' } = params;
    
    await this.simulateDelay(2000, 4000);
    
    // Simple code analysis based on patterns
    const explanation = this.analyzeCode(code, language);
    
    return {
      code: code,
      language: language,
      explanation: explanation,
      complexity: this.calculateComplexity(code),
      suggestions: this.generateSuggestions(code, language),
      timestamp: new Date().toISOString()
    };
  }

  analyzeCode(code, language) {
    if (!code) return '解析するコードが提供されていません。';
    
    let explanation = `この${language}コードの説明:\n\n`;
    
    // Basic pattern matching for common constructs
    if (code.includes('function') || code.includes('=>')) {
      explanation += '• 関数が定義されています\n';
    }
    if (code.includes('if') || code.includes('else')) {
      explanation += '• 条件分岐処理が含まれています\n';
    }
    if (code.includes('for') || code.includes('while')) {
      explanation += '• ループ処理が実装されています\n';
    }
    if (code.includes('class')) {
      explanation += '• クラスベースのオブジェクト指向設計が使用されています\n';
    }
    if (code.includes('async') || code.includes('await')) {
      explanation += '• 非同期処理（Promise）が実装されています\n';
    }
    if (code.includes('try') || code.includes('catch')) {
      explanation += '• エラーハンドリングが実装されています\n';
    }
    
    explanation += '\nこのコードは一般的なプログラミングパターンに従って実装されており、';
    explanation += '適切な構造を持っているように見えます。';
    
    return explanation;
  }

  calculateComplexity(code) {
    let complexity = 1; // Base complexity
    
    // Count complexity indicators
    const indicators = ['if', 'else', 'for', 'while', 'switch', 'case', '&&', '||'];
    indicators.forEach(indicator => {
      const matches = (code.match(new RegExp(indicator, 'g')) || []).length;
      complexity += matches;
    });
    
    if (complexity <= 5) return 'Low';
    if (complexity <= 10) return 'Medium';
    return 'High';
  }

  generateSuggestions(code, language) {
    const suggestions = [];
    
    if (!code.includes('const') && !code.includes('let') && language === 'javascript') {
      suggestions.push('const/letを使用してvarの代わりに変数を宣言することを推奨します');
    }
    
    if (code.length > 1000) {
      suggestions.push('コードが長すぎます。関数やクラスに分割することを検討してください');
    }
    
    if (!code.includes('//') && !code.includes('/*')) {
      suggestions.push('コメントを追加して、コードの可読性を向上させることを推奨します');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('コードは良好な状態です。継続して良いプラクティスを維持してください');
    }
    
    return suggestions;
  }

  async regexBuilder(params) {
    const { pattern_desc, test_str } = params;
    
    await this.simulateDelay(1000, 2000);
    
    // Simple pattern matching for common regex needs
    let regex = '';
    let explanation = '';
    
    if (pattern_desc.includes('メール') || pattern_desc.includes('email')) {
      regex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
      explanation = 'メールアドレスの形式を検証する正規表現';
    } else if (pattern_desc.includes('電話') || pattern_desc.includes('phone')) {
      regex = '^\\d{2,4}-\\d{2,4}-\\d{4}$';
      explanation = '日本の電話番号形式（ハイフン区切り）を検証する正規表現';
    } else if (pattern_desc.includes('郵便番号') || pattern_desc.includes('zipcode')) {
      regex = '^\\d{3}-\\d{4}$';
      explanation = '日本の郵便番号形式を検証する正規表現';
    } else if (pattern_desc.includes('数字') || pattern_desc.includes('number')) {
      regex = '^\\d+$';
      explanation = '数字のみを許可する正規表現';
    } else if (pattern_desc.includes('URL') || pattern_desc.includes('url')) {
      regex = '^https?:\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?$';
      explanation = 'URL形式を検証する正規表現';
    } else {
      regex = '.*';
      explanation = '汎用的なパターン（すべての文字にマッチ）';
    }
    
    // Test the regex if test string is provided
    let match = false;
    if (test_str) {
      try {
        const regexObj = new RegExp(regex);
        match = regexObj.test(test_str);
      } catch (error) {
        match = false;
      }
    }
    
    return {
      regex: regex,
      explanation: explanation,
      pattern_description: pattern_desc,
      test_string: test_str,
      match: match,
      examples: this.generateRegexExamples(regex),
      breakdown: this.breakdownRegex(regex)
    };
  }

  generateRegexExamples(regex) {
    const examples = {
      '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$': ['user@example.com', 'test.email+tag@domain.co.jp'],
      '^\\d{2,4}-\\d{2,4}-\\d{4}$': ['03-1234-5678', '090-1234-5678'],
      '^\\d{3}-\\d{4}$': ['123-4567', '100-0001'],
      '^\\d+$': ['123', '456789'],
      '^https?:\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?$': ['https://example.com', 'http://www.google.com']
    };
    
    return examples[regex] || ['パターンに一致する例が見つかりません'];
  }

  breakdownRegex(regex) {
    const breakdown = [];
    
    if (regex.includes('^')) breakdown.push('^ - 文字列の開始');
    if (regex.includes('$')) breakdown.push('$ - 文字列の終了');
    if (regex.includes('\\d')) breakdown.push('\\d - 数字（0-9）');
    if (regex.includes('+')) breakdown.push('+ - 1回以上の繰り返し');
    if (regex.includes('*')) breakdown.push('* - 0回以上の繰り返し');
    if (regex.includes('[a-zA-Z]')) breakdown.push('[a-zA-Z] - 英字（大文字小文字）');
    if (regex.includes('\\.')) breakdown.push('\\. - ドット文字');
    if (regex.includes('{')) breakdown.push('{n,m} - n回からm回の繰り返し');
    
    return breakdown;
  }

  async meetingMinutesGenerator(params) {
    const { input, format = 'markdown' } = params;
    
    await this.simulateDelay(3000, 5000);
    
    // Simple extraction of key information
    const extractedInfo = this.extractMeetingInfo(input);
    
    const minutes = this.formatMeetingMinutes(extractedInfo, format);
    
    return {
      minutes: minutes,
      format: format,
      todos: extractedInfo.todos,
      participants: extractedInfo.participants,
      decisions: extractedInfo.decisions,
      next_meeting: extractedInfo.nextMeeting,
      summary: extractedInfo.summary
    };
  }

  extractMeetingInfo(input) {
    // Basic keyword extraction
    const todos = [];
    const decisions = [];
    const participants = [];
    
    // Simple pattern matching for common meeting elements
    const lines = input.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('TODO') || line.includes('タスク') || line.includes('アクション')) {
        todos.push(line.replace(/TODO|タスク|アクション/gi, '').trim());
      }
      if (line.includes('決定') || line.includes('合意') || line.includes('決まった')) {
        decisions.push(line.trim());
      }
      if (line.includes('参加者') || line.includes('出席')) {
        // Extract participant names (simplified)
        const names = line.match(/[ぁ-んァ-ン一-龯a-zA-Z]+/g) || [];
        participants.push(...names);
      }
    });
    
    return {
      todos: todos.length > 0 ? todos : ['具体的なタスクは抽出されませんでした'],
      decisions: decisions.length > 0 ? decisions : ['明確な決定事項は見つかりませんでした'],
      participants: [...new Set(participants)],
      nextMeeting: 'Next meeting date not specified',
      summary: input.length > 200 ? input.substring(0, 200) + '...' : input
    };
  }

  formatMeetingMinutes(info, format) {
    const date = new Date().toLocaleDateString('ja-JP');
    
    if (format === 'markdown') {
      return `# 会議議事録

**日時**: ${date}  
**参加者**: ${info.participants.join(', ') || '参加者情報なし'}

## 概要
${info.summary}

## 決定事項
${info.decisions.map(d => `- ${d}`).join('\n')}

## アクションアイテム
${info.todos.map(t => `- [ ] ${t}`).join('\n')}

## 次回会議
${info.nextMeeting}

---
*議事録作成者: Caput AI Agent*`;
    } else {
      return `会議議事録 (${date})\n\n概要: ${info.summary}\n\n決定事項:\n${info.decisions.join('\n')}\n\nTODO:\n${info.todos.join('\n')}`;
    }
  }

  async taskPlanner(params) {
    const { goal, deadline, priority = 'medium' } = params;
    
    await this.simulateDelay(2000, 4000);
    
    // Generate subtasks based on goal
    const tasks = this.generateSubtasks(goal, deadline, priority);
    
    return {
      goal: goal,
      deadline: deadline,
      priority: priority,
      tasks: tasks,
      estimated_duration: this.calculateTotalDuration(tasks),
      milestones: this.generateMilestones(tasks),
      risk_factors: this.identifyRisks(goal, tasks)
    };
  }

  generateSubtasks(goal, deadline, priority) {
    // Basic task breakdown logic
    const baseTasks = [
      {
        id: 1,
        title: '要件分析と計画',
        description: `${goal}の詳細要件を整理し、実行計画を策定`,
        duration: '2-3日',
        dependencies: [],
        status: 'pending'
      },
      {
        id: 2,
        title: 'リソース準備',
        description: '必要なツール、人材、情報を収集・準備',
        duration: '1-2日',
        dependencies: [1],
        status: 'pending'
      },
      {
        id: 3,
        title: '実行フェーズ1',
        description: `${goal}の主要部分を実装・実行`,
        duration: '3-5日',
        dependencies: [2],
        status: 'pending'
      },
      {
        id: 4,
        title: 'レビューと調整',
        description: '進捗確認と必要に応じた計画調整',
        duration: '1日',
        dependencies: [3],
        status: 'pending'
      },
      {
        id: 5,
        title: '最終仕上げ',
        description: '品質確認と最終調整',
        duration: '1-2日',
        dependencies: [4],
        status: 'pending'
      }
    ];
    
    // Adjust based on priority
    if (priority === 'high') {
      baseTasks.forEach(task => {
        task.duration = task.duration.replace(/\d+-?(\d+)?/g, match => {
          const nums = match.split('-').map(n => parseInt(n));
          return nums.length > 1 ? `${nums[0]}-${nums[1]}` : nums[0].toString();
        });
      });
    }
    
    return baseTasks;
  }

  calculateTotalDuration(tasks) {
    const totalDays = tasks.reduce((sum, task) => {
      const duration = task.duration;
      const match = duration.match(/(\d+)(?:-(\d+))?/);
      if (match) {
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min;
        return sum + (min + max) / 2;
      }
      return sum + 1;
    }, 0);
    
    return `${Math.ceil(totalDays)}日間（推定）`;
  }

  generateMilestones(tasks) {
    return [
      {
        name: '計画完了',
        task_ids: [1, 2],
        description: '要件分析とリソース準備の完了'
      },
      {
        name: '実装完了',
        task_ids: [3],
        description: '主要機能の実装完了'
      },
      {
        name: 'プロジェクト完了',
        task_ids: [4, 5],
        description: '全タスクの完了と品質確認'
      }
    ];
  }

  identifyRisks(goal, tasks) {
    return [
      {
        risk: 'スケジュール遅延',
        probability: 'Medium',
        impact: 'High',
        mitigation: '定期的な進捗確認とバッファ時間の確保'
      },
      {
        risk: 'リソース不足',
        probability: 'Low',
        impact: 'Medium',
        mitigation: '事前のリソース確保と代替案の準備'
      },
      {
        risk: '要件変更',
        probability: 'Medium',
        impact: 'Medium',
        mitigation: '柔軟な計画設計と変更管理プロセス'
      }
    ];
  }

  async emailDraftSender(params) {
    const { to, subject_hint, context } = params;
    
    await this.simulateDelay(1000, 2000);
    
    const emailDraft = this.generateEmailDraft(to, subject_hint, context);
    
    const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`;
    
    return {
      mailto_link: mailtoLink,
      subject: emailDraft.subject,
      body: emailDraft.body,
      recipient: to,
      draft_type: emailDraft.type,
      suggestions: emailDraft.suggestions
    };
  }

  generateEmailDraft(to, subjectHint, context) {
    let subject = subjectHint || '件名';
    let body = '';
    let type = 'general';
    
    // Determine email type and generate appropriate content
    if (context.includes('会議') || context.includes('ミーティング')) {
      type = 'meeting';
      subject = `会議について - ${subjectHint || ''}`;
      body = `${to}様

お疲れさまです。

${context}

会議の詳細について、ご都合をお聞かせください。

よろしくお願いいたします。`;
    } else if (context.includes('報告') || context.includes('レポート')) {
      type = 'report';
      subject = `報告 - ${subjectHint || ''}`;
      body = `${to}様

お疲れさまです。

${context}

詳細は添付資料をご確認ください。
ご質問がございましたら、お気軽にお声かけください。

よろしくお願いいたします。`;
    } else {
      body = `${to}様

お疲れさまです。

${context}

何かご不明な点がございましたら、お気軽にお問い合わせください。

よろしくお願いいたします。`;
    }
    
    return {
      subject,
      body,
      type,
      suggestions: [
        '宛先の敬称を確認してください',
        '署名を追加することを推奨します',
        '重要な内容は太字で強調することを検討してください'
      ]
    };
  }

  async simulateDelay(min = 1000, max = 3000) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.ProductivityTools = ProductivityTools;
}
