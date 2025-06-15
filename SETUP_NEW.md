# Caput セットアップガイド

## 🚀 クイックスタート

### 1. システム要件
- **ブラウザ**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: ES2020対応必須
- **ネットワーク**: インターネット接続（API利用のため）
- **ストレージ**: 50MB以上の空き容量

### 2. ダウンロード・配置
```bash
# Git経由
git clone https://github.com/your-repo/caput.git
cd caput

# または、ZIPダウンロード後展開
unzip caput-main.zip
cd caput-main
```

### 3. ローカルサーバー起動

#### Python使用（推奨）
```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

#### Node.js使用
```bash
# グローバルインストール
npm install -g http-server
http-server -p 8000

# または npx使用
npx http-server -p 8000
```

#### PHP使用
```bash
php -S localhost:8000
```

### 4. ブラウザでアクセス
`http://localhost:8000` を開く

## 🔧 詳細設定

### APIキー設定

#### 1. Gemini API キー取得
1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. Googleアカウントでログイン
3. 「Get API Key」をクリック
4. 新しいAPIキーを作成
5. キーをコピー

#### 2. Caputでの設定
1. Caputアプリを開く
2. 右上の設定ボタン（⚙️）をクリック
3. 「Gemini API キー」フィールドにペースト
4. 「設定を保存」をクリック
5. ページを再読み込み

### 効率性モード設定

**効率優先モード**
- 高速実行を重視
- 軽量なツールを優先選択
- 並列処理を最大化

**バランスモード**（推奨）
- 品質と速度のバランス
- 標準的なツール選択
- 適度な並列処理

**最高品質モード**
- 結果の品質を最重視
- 高精度ツールを選択
- 丁寧な検証プロセス

### 高リスクツール有効化

セキュリティ上の理由で、以下のツールはデフォルトで無効：
- スクレイピング関連
- システム診断
- 外部API連携
- ファイル操作

**有効化手順:**
1. 設定画面を開く
2. 「高リスクツールを有効化」をチェック
3. 利用規約に同意
4. 設定を保存

⚠️ **注意**: 高リスクツールは責任を持って使用してください

## 🎨 カスタマイズ

### テーマ変更

#### 設定画面から
1. 設定ボタンをクリック
2. 「テーマ」で選択
   - ライトモード
   - ダークモード
   - システム設定に従う

#### CSS変数で直接カスタマイズ
```css
:root {
  /* プライマリカラー */
  --primary-blue: #007AFF;
  --primary-blue-hover: #0056CC;
  
  /* 背景色 */
  --background-primary: #FFFFFF;
  --background-secondary: #F8F9FA;
  
  /* テキストカラー */
  --text-primary: #1D1D1F;
  --text-secondary: #8E8E93;
}

/* ダークモード */
[data-theme="dark"] {
  --background-primary: #000000;
  --background-secondary: #1C1C1E;
  --text-primary: #FFFFFF;
  --text-secondary: #8E8E93;
}
```

### ツール設定カスタマイズ

#### デフォルトパラメータ変更
```javascript
// config.js で設定
const CAPUT_CONFIG = {
  tools: {
    searchWeb: {
      defaultMode: 'comprehensive', // quick, balanced, comprehensive
      maxResults: 10
    },
    blogWriter: {
      defaultLength: 2000,
      tone: 'professional' // casual, professional, academic
    }
  }
};
```

#### カスタムツール追加
```javascript
// tools/custom.js を作成
class CustomTools {
  constructor() {
    this.toolName = 'CustomTools';
    this.category = 'custom';
  }

  getTools() {
    return {
      myCustomTool: {
        name: 'カスタムツール',
        category: 'custom',
        description: 'カスタム機能の説明',
        riskLevel: 'low',
        execute: this.myCustomTool.bind(this)
      }
    };
  }

  async myCustomTool(params) {
    // カスタムロジック実装
    return {
      result: 'カスタム結果',
      metadata: { tool: 'custom' }
    };
  }
}

// グローバル登録
window.CustomTools = CustomTools;
```

## 🚧 トラブルシューティング

### よくある問題

#### 1. 「AIエージェントが初期化されていません」エラー
**原因**: APIキーが設定されていない  
**解決方法**: 
1. 設定画面でAPIキーを確認
2. 有効なGemini APIキーを入力
3. ページを再読み込み

#### 2. ツールが実行されない
**原因**: JavaScript実行エラー  
**解決方法**: 
1. ブラウザの開発者ツールを開く（F12）
2. Consoleタブでエラーを確認
3. ページを再読み込み
4. 同じエラーが続く場合はIssueを報告

#### 3. レスポンスが遅い
**原因**: ネットワーク遅延またはAPI制限  
**解決方法**: 
1. 効率性モードを「効率優先」に変更
2. 同時実行タスク数を減らす
3. ネットワーク接続を確認

#### 4. UIが正常に表示されない
**原因**: CSS/JS読み込みエラー  
**解決方法**: 
1. ハードリフレッシュ（Ctrl+F5）
2. ブラウザキャッシュをクリア
3. 対応ブラウザを使用

### ログ・デバッグ

#### デバッグモード有効化
```javascript
// ブラウザコンソールで実行
window.caputAgent.setLogLevel('debug');
localStorage.setItem('caput_debug', 'true');
```

#### 実行履歴確認
```javascript
// 全実行履歴
console.log(window.caputAgent.tools.getExecutionHistory());

// 使用統計
console.log(window.caputAgent.tools.getUsageStats());

// システム診断
window.caputAgent.tools.executeTool('systemDiagnostics', {})
```

#### ログファイル出力
```javascript
// 設定とログをJSONで出力
const debugInfo = {
  config: window.CAPUT_CONFIG,
  history: window.caputAgent.tools.getExecutionHistory(),
  stats: window.caputAgent.tools.getUsageStats(),
  timestamp: new Date().toISOString()
};

console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
```

## 🔒 セキュリティ設定

### プライベート利用
- APIキーはローカルに暗号化保存
- 実行履歴は端末に保存（外部送信なし）
- 高リスクツールは明示的有効化が必要

### 企業利用
```javascript
// config.js で企業設定
const CAPUT_CONFIG = {
  security: {
    highRiskToolsEnabled: false,
    auditLogging: true,
    encryptionEnabled: true,
    allowedDomains: ['company.com'],
    maxExecutionTime: 30000
  }
};
```

### データプライバシー
- 入力データはAI処理のみに使用
- ローカルストレージのみ（外部送信なし）
- データ削除は設定画面から可能

## 📊 パフォーマンス最適化

### 推奨設定
```javascript
// 高パフォーマンス設定
const PERFORMANCE_CONFIG = {
  maxConcurrentTasks: 5,        // 同時実行タスク数
  executionTimeout: 15000,      // タイムアウト（ms）
  cacheEnabled: true,           // 結果キャッシュ
  backgroundProcessing: true    // バックグラウンド処理
};
```

### モニタリング
- CPU使用率: 開発者ツールのPerformanceタブ
- メモリ使用量: `performance.memory`
- ネットワーク: Networkタブでリクエスト監視

## 🌐 本番環境デプロイ

### 静的ファイルホスティング
```bash
# Netlify
netlify deploy --prod

# Vercel
vercel --prod

# GitHub Pages
git push origin main
```

### 環境変数設定
```javascript
// production.config.js
const PRODUCTION_CONFIG = {
  apiEndpoint: 'https://api.production.com',
  debugging: false,
  performance: {
    enableCaching: true,
    compressionEnabled: true
  }
};
```

### セキュリティ強化
- HTTPS必須
- CSP（Content Security Policy）設定
- XSS保護ヘッダー追加

---

設定に関する質問は [Issues](https://github.com/your-repo/caput/issues) またはサポートまでお気軽にどうぞ！
