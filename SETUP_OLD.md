# Caput - Development Setup Guide

## Quick Start

1. **ファイルをダウンロード**
   ```bash
   git clone https://github.com/aro-software-group/caput
   cd caput
   ```

2. **ローカルサーバー起動**
   ```bash
   # Python 3の場合
   python -m http.server 8000
   
   # Python 2の場合
   python -m SimpleHTTPServer 8000
   
   # Node.jsの場合
   npx http-server
   ```

3. **ブラウザでアクセス**
   ```
   http://localhost:8000
   ```

4. **Gemini API キーを設定**
   - [Google AI Studio](https://aistudio.google.com/app/apikey)でAPIキーを取得
   - Caputの設定画面でAPIキーを入力

## Google Gemini API Setup

### 1. APIキーの取得
1. [Google AI Studio](https://aistudio.google.com/app/apikey)にアクセス
2. Googleアカウントでログイン
3. "Create API Key"をクリック
4. プロジェクトを選択または新規作成
5. 生成されたAPIキーをコピー

### 2. APIキーの設定
1. Caputを開く
2. 右上の設定ボタン（⚙️）をクリック
3. "Gemini API キー"フィールドにペースト
4. "保存"をクリック

### 3. 無料枠について
- **Gemini Pro**: 月間60リクエスト（無料）
- **Gemini Flash**: 月間1,500リクエスト（無料）
- 詳細: [Gemini API Pricing](https://ai.google.dev/pricing)

## 基本的な使い方

### 1. 効率性モード選択
- **効率優先**: 素早い結果、低コスト
- **バランス**: 品質と速度のバランス
- **最高品質**: 高品質、詳細な分析

### 2. ゴール入力例
```
「競合他社のWebサイトを分析して、マーケティング戦略レポートを作成してください」

「ブログ記事『AIの未来』を2000字で執筆し、関連するSEOキーワードも提案してください」

「CSVデータを分析して、売上トレンドのグラフを作成してください」
```

### 3. 結果の確認
- 右側パネルで思考プロセスを監視
- チャット画面で成果物を確認
- タスクボードで実行状況を把握

## トラブルシューティング

### 🚫 "API key not configured" エラー
**解決策**: 
1. 設定画面でAPIキーが正しく入力されているか確認
2. APIキーが有効か[Google AI Studio](https://aistudio.google.com)で確認
3. ブラウザの開発者ツールでエラー詳細を確認

### 🚫 "Tool execution failed" エラー
**解決策**:
1. インターネット接続を確認
2. 高リスクツールの場合、設定で有効化されているか確認
3. APIの利用制限に達していないか確認

### 🚫 ページが正しく表示されない
**解決策**:
1. HTTPSまたはlocalhostで実行（file://ではなく）
2. ブラウザがモダンブラウザか確認（Chrome 90+推奨）
3. ブラウザの開発者ツールでConsoleエラーを確認

### 🚫 暗号化エラー
**解決策**:
1. ブラウザでCrypto APIが有効か確認
2. LocalStorageが有効か確認
3. プライベートブラウジングモードの場合、通常モードで試行

## 開発・カスタマイズ

### カスタムツールの追加

1. **`js/tools.js`を編集**:
```javascript
this.registerTool('myCustomTool', {
  name: 'カスタムツール',
  category: 'custom',
  description: 'カスタム機能の説明',
  riskLevel: 'low',
  execute: this.myCustomTool.bind(this)
});

async myCustomTool(params) {
  const { input } = params;
  // カスタムロジックを実装
  return {
    result: `処理結果: ${input}`,
    timestamp: new Date().toISOString()
  };
}
```

2. **ツールの利用**:
AIエージェントが自動的に新しいツールを認識し、適切な場面で利用します。

### 設定のカスタマイズ

**`js/config.js`で以下を調整可能**:
- APIエンドポイント
- トークン制限
- コスト計算
- UI設定
- セキュリティ設定

```javascript
// 例: トークン制限を変更
MAX_TOKENS: 4096, // デフォルト: 8192

// 例: コスト計算を調整
COST_ESTIMATION: {
  'gemini-pro': 0.3,        // デフォルト: 0.5
  'gemini-1.5-flash': 0.1   // デフォルト: 0.25
}
```

## セキュリティ設定

### 高リスクツールの管理
```javascript
// config.jsで高リスクツールを定義
HIGH_RISK_TOOLS: [
  'scraperBot',      // Webスクレイピング
  'threatScanner',   // セキュリティスキャン
  'apiConnector'     // 外部API連携
]
```

### データ暗号化
- APIキー: AES-GCM 256bit暗号化
- チャット履歴: ローカル暗号化保存
- 設定データ: ハッシュ化検証

## パフォーマンス最適化

### 1. メモリ使用量削減
```javascript
// チャット履歴の制限
MAX_CHAT_HISTORY: 50, // デフォルト: 100

// キャッシュの自動クリーンアップ
AUTO_CLEANUP_INTERVAL: 30 * 60 * 1000 // 30分
```

### 2. レスポンス速度向上
- Gemini Flashモデルの優先利用
- 並列ツール実行の活用
- キャッシュ機能の活用

## デバッグ機能

### 開発者コンソールで利用可能
```javascript
// アプリケーション統計
caputApp.getStats()

// 診断実行
await caputApp.runDiagnostics()

// データエクスポート
await caputApp.exportData()

// ツール実行履歴
caputApp.getComponent('tools').getExecutionHistory()
```

## デプロイメント

### 静的ホスティング
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

### カスタムドメイン設定
1. HTTPSが必須（Crypto API要件）
2. CSP (Content Security Policy) 設定推奨
3. セキュリティヘッダーの設定

## ライセンス・法的注意

- **MIT License**: 商用利用可能
- **Google Gemini API**: 利用規約に従う
- **プライバシー**: GDPR/個人情報保護法準拠
- **高リスクツール**: 利用責任はユーザーにあり

## サポート・コミュニティ

- **GitHub Issues**: バグ報告・機能要望
- **Discussions**: 使用方法・カスタマイズ相談
- **Wiki**: 詳細ドキュメント・FAQ
- **Examples**: 実用例・ベストプラクティス

---

**🚀 Happy Coding with Caput!**
