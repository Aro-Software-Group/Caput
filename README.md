# Caput - 自律型AIエージェント

**Caput**は、90以上の高度なツールを装備した最強の自律型AIエージェントです。ChatGPTライクなモダンなインターフェースで、複雑なタスクを自動実行し、分析から創作まで幅広い業務をサポートします。

**最新アップデート (v1.0.2-beta):** バグを大幅に修正し、動作しない機能を直して安定性を大幅に向上させました。さらにサービスワーカーを導入し、オフラインでも基本操作が可能になりました。

## 🚀 主な特徴

### 🧠 完全自律型AI
- **自動タスク分解**: 複雑な目標を実行可能なサブタスクに分解
- **動的ツール選択**: 状況に応じて最適なツールを自動選択
- **エラー回復**: 失敗時の自動リトライと代替手段の実行
- **学習能力**: 実行履歴から効率的なアプローチを学習

### 💬 ChatGPTライクなUI
- **直感的なチャット形式**: 自然言語での指示が可能
- **リアルタイム思考表示**: AIの思考プロセスをリアルタイム表示
- **タイピングインジケーター**: ChatGPTのような応答待ち表示
- **レスポンシブデザイン**: すべてのデバイスで最適化

### 🛠️ モジュラーツールシステム
**90以上のツールを9つのカテゴリーに整理:**

#### 🔍 検索・情報収集 (SearchTools)
- Web検索、即座検索、サイト巡回
- トレンド分析、引用文生成
- `scrapeWebsiteContent`: Extracts content from a given URL. Can optionally use a CSS selector to target specific elements. Currently, this tool simulates web scraping.
    - **Parameters:**
        - `url` (string): The URL of the website to scrape (e.g., "https://example.com").
        - `selector` (string, optional): A CSS selector to specify which part of the page to extract (e.g., "h1", ".article-body"). If omitted, the tool attempts to extract the main content.
    - **Returns:** An object containing:
        - `extracted_content` (string|array): The scraped content. This might be a single string or an array of strings if multiple elements are matched by the selector.
        - `page_title` (string): The title of the scraped page (simulated).
        - `fetched_url` (string): The URL that was fetched.
        - `selector_used` (string|null): The CSS selector that was used for extraction, or `null` if none was provided.
        - `error` (string, optional): An error message if scraping failed.
    - **Examples:**
        - **Basic Usage (main content):**
            ```javascript
            // Simulates extracting main content from example.com
            const results = await searchTools.scrapeWebsiteContent({ url: "https://example.com" });
            console.log(results);
            // Expected output (simulated):
            // {
            //   extracted_content: "Main content of Example Domain: This domain is for use in illustrative examples in documents...",
            //   page_title: "Example Domain",
            //   fetched_url: "https://example.com",
            //   selector_used": null
            // }
            ```
        - **Using a Selector:**
            ```javascript
            // Simulates extracting the H1 tag from example.com
            const results = await searchTools.scrapeWebsiteContent({ url: "https://example.com", selector: "h1" });
            console.log(results);
            // Expected output (simulated):
            // {
            //   extracted_content: ["Example Domain"],
            //   page_title: "Example Domain",
            //   fetched_url: "https://example.com",
            //   selector_used": "h1"
            // }
            ```
        - **Error Handling:**
            ```javascript
            // Simulates an invalid URL
            const results = await searchTools.scrapeWebsiteContent({ url: "invalid-url" });
            console.log(results);
            // Expected output (simulated):
            // {
            //   error: "Invalid URL provided. Please include http:// or https://",
            //   fetched_url: "invalid-url"
            // }
            ```

#### 📝 コンテンツ生成 (ContentTools)
- ランディングページ作成、ブログ執筆
- ツイートスレッド、ニュースレター、広告コピー
- SEOキーワード提案

#### 📊 データ分析・可視化 (AnalysisTools)
- グラフ作成、データクリーニング
- 相関分析、時系列予測

#### 📄 ドキュメント処理 (DocumentTools)
- PDF読取・要約・QA、文書変換
- テキスト要約、翻訳、文書比較

#### ⚡ 自動化・ユーティリティ (AutomationTools)
- データ収集ボット、バッチファイル処理
- ワークフロー構築、通知送信

#### 🔒 セキュリティ・コンプライアンス (SecurityTools)
- 脅威スキャン、パスワード強度チェック
- 脆弱性スキャン、プライバシー監査

#### 🔗 統合・連携 (IntegrationTools)
- API連携、Webhook管理
- データエクスポート、クラウド同期

#### 💻 生産性支援 (ProductivityTools)
- コード解説、正規表現作成
- 会議議事録、タスクプランナー

#### 🔧 システム・メタ (SystemTools)
- 思考表示、使用状況ダッシュボード
- システム診断、パフォーマンス測定

## 🏗️ アーキテクチャ

### モジュラー設計
```
Caput/
├── js/
│   ├── main.js              # アプリケーション起動
│   ├── modular-tools.js     # 動的ツールローダー
│   ├── agent.js             # AIエージェントエンジン
│   ├── ui.js                # ChatGPTライクUI
│   ├── config.js            # 設定管理
│   └── storage.js           # データストレージ
├── tools/                   # ツールモジュール
│   ├── search.js            # 検索ツール
│   ├── content.js           # コンテンツ生成
│   ├── analysis.js          # データ分析
│   ├── document.js          # 文書処理
│   ├── automation.js        # 自動化
│   ├── security.js          # セキュリティ
│   ├── integration.js       # 統合・連携
│   ├── productivity.js      # 生産性支援
│   └── system.js            # システム管理
├── styles/
│   └── main.css             # モダンなUIスタイル
└── index.html               # メインHTMLファイル
```

### 動的ツールローディング
- **ModularToolsRegistry**: 各ツールカテゴリーを動的に読み込み
- **個別ツールクラス**: 各カテゴリーが独立したクラスとして実装
- **プラグインアーキテクチャ**: 新しいツールの追加が容易

## 🎯 使用例

### 基本的な使い方
```
「競合他社の最新動向を調査して、比較レポートを作成してください」
```
→ Caputが自動的に：
1. Web検索で競合情報を収集
2. データを分析・整理
3. 見やすいレポートを生成
4. 必要に応じてグラフも作成

### 高度な自動化
```
「毎日のSNS投稿用にトレンドを分析して、コンテンツを自動生成してください」
```
→ Caputが自動的に：
1. トレンド分析を実行
2. 関連するコンテンツアイデアを生成
3. SNS用のテキストを作成
4. スケジュール管理に登録

## 🔧 セットアップ

### 1. ファイルの配置
```bash
git clone [repository-url]
cd Caput
```

### 2. 依存関係のインストール
```bash
npm install  # package.jsonがある場合
```

### 3. APIキーの設定
1. Caputを起動
2. 設定ボタンをクリック
3. Gemini API キーを入力
4. 設定を保存

### 4. 起動
```bash
# ローカルサーバーで実行
python -m http.server 8000
# または
npx http-server
```

ブラウザで `http://localhost:8000` にアクセス

## 🎨 カスタマイズ

### テーマ変更
- ライトモード / ダークモード対応
- CSS変数で簡単カスタマイズ
- グラスモーフィズムデザイン

### ツール追加
```javascript
// tools/custom.js に新しいツールクラスを作成
class CustomTools {
  getTools() {
    return {
      myTool: {
        name: 'カスタムツール',
        category: 'custom',
        description: '説明',
        riskLevel: 'low',
        execute: this.myTool.bind(this)
      }
    };
  }

  async myTool(params) {
    // ツールの実装
  }
}
```

## 📊 パフォーマンス

- **起動時間**: 2秒以下
- **ツール実行**: 平均2-5秒
- **メモリ使用量**: 50MB以下
- **同時タスク**: 最大10タスク

## 🔒 セキュリティ

- **リスクレベル管理**: 危険なツールは明示的許可が必要
- **データ暗号化**: ローカルデータの暗号化保存
- **API通信**: HTTPS必須
- **入力検証**: 全入力データの検証

## 🐛 デバッグ・開発

### 開発者ツール
- **思考プロセス表示**: AIの判断過程を詳細表示
- **実行履歴**: 全ツール実行履歴の記録
- **パフォーマンス監視**: 実行時間とリソース使用量
- **エラーログ**: 詳細なエラー情報

### ログレベル
```javascript
// コンソールで実行
window.caputAgent.setLogLevel('debug');  // 詳細ログ
window.caputAgent.setLogLevel('info');   // 標準ログ
window.caputAgent.setLogLevel('error');  // エラーのみ
```

## 📈 ロードマップ

### 近期予定
- [ ] プラグインシステムの充実
- [ ] カスタムワークフロー保存
- [ ] チーム共有機能
- [ ] API外部連携の拡充

### 中長期予定
- [ ] モバイルアプリ版
- [ ] オフライン実行モード
- [ ] 多言語対応
- [ ] エンタープライズ版

## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🤝 コントリビューション

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📞 サポート

- **Issue**: [GitHub Issues](https://github.com/your-repo/caput/issues)
- **Discord**: [Caput お問い合わせ・機能改善提案](https://discord.gg/QAbvzabJ)
- **Email**: support@caput.dev

---

**Caput** で AIエージェントの真の力を体験してください！ 🚀
