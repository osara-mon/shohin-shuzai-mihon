# フルフル 商品取材フォーム

社内業務用の取材 Web アプリ。フルフル様のスタッフ・職人が商品1点ずつ、8つの固定質問に一問一答で答え、回答を Google Sheets（商品マスタ）に保存します。

---

## 入口ページを開く

```bash
open interview-app/index.html
```

または `interview-app/index.html` をブラウザにドラッグ＆ドロップしてください。

ローカルサーバーが必要な場合（`file://` プロトコルで動作しないブラウザ設定の場合）：

```bash
cd interview-app
python3 -m http.server 8800
# → http://localhost:8800 を開く
```

---

## Apps Script セットアップの導入経路

Google Sheets へのデータ保存を有効にするには、以下の順で設定します。

1. `sheets-setup/sheets-setup.md` を開いて手順を読む（全5ステップ・5〜10分）
2. `sheets-setup/apps-script.gs` のコードを Google Apps Script エディタに貼り付けてデプロイ
3. 発行された URL を `config.js` の `APPS_SCRIPT_URL` に設定する

設定前（URL が空欄のまま）でも、送信ボタンを押したときに「送信できませんでした」のフォールバックが動き、「本文をコピー」「メールで送る」の代替手段が使えます。

---

## ファイル構成

```
interview-app/
├── index.html          入口（商品選択・回答者名入力・はじめる）
├── question.html       一問一答フロー（Q1〜Q8＋補足3項目）
├── complete.html       完了画面（送信・コピー・印刷）
├── config.js           Apps Script URL の設定ファイル（社長が1行書き換える）
│
├── css/
│   ├── tokens.css      デザイントークン（prototype-v2 と完全互換）
│   └── form.css        フォーム専用スタイル
│
├── js/
│   ├── data.js         質問定義・商品リスト（固定データ）
│   ├── storage.js      localStorage 自動保存・再開
│   ├── submit.js       送信・コピー・mailto フォールバック
│   ├── app.js          一問一答フロー制御（question.html 用）
│   └── complete.js     完了画面ロジック（complete.html 用）
│
└── sheets-setup/
    ├── sheets-setup.md  社長向けセットアップ手順書（非技術者向け）
    └── apps-script.gs   Google Apps Script コード（貼り付け用）
```

---

## 今後の拡張ポイント

### 原価・写真列を追加するとき

**Sheets 側（列追加）:**
`sheets-setup/apps-script.gs` の先頭の `ANSWER_HEADERS` 配列に列名を追加し、Apps Script エディタで再デプロイする。

**フォーム側（質問追加）:**
`js/data.js` の `QUESTIONS` 配列に質問オブジェクトを追加する。形式は既存の Q1〜Q8 を参考に。

**送信データへの反映:**
`js/submit.js` の `buildPayload()` 関数に対応するキー (`session.answers["新しいID"]`) を追加し、シートの列名をキー名として出力する。

### 商品ドロップダウンを増やすとき

`js/data.js` の `PRODUCTS` 配列に `{ value: "id", label: "商品名" }` を追記する。

### 質問文を変えるとき

`js/data.js` の `QUESTIONS` 配列の `text` と `hint`・`placeholder` を編集する。Apps Script 側のヘッダーとの対応は `Q${number}` ではなく、`buildPayload()` 内のキー名で管理しているため、JS の変更だけで完結する。

---

## 技術メモ（実装上の判断・制約・注意点）

### localStorage と iOS プライベートブラウズ

iOS Safari のプライベートブラウズモードでは `localStorage` の容量が 0 のため書き込みに失敗します。`storage.js` で `isStorageAvailable()` により検出し、メモリフォールバック（ページを閉じると消える）に切り替えます。ユーザーには画面上に警告を表示します。

### Apps Script の no-cors 送信

`fetch` の `mode: "no-cors"` を使っているため、レスポンスボディが読めません（opaque response）。送信成功の確認はできないため、Apps Script 側で「確認メールを自分に送る」設定を追加することを推奨します（`apps-script.gs` にコメントとして補足箇所を記載）。

### CORS について

Google Apps Script のウェブアプリは `Content-Type: application/json` の POST に対してプリフライト（OPTIONS）を送ります。`doOptions()` を定義してありますが、Apps Script のサーバー側で自動的に 200 を返す仕様のため、多くの環境では問題が起きません。問題が出た場合は `no-cors` モードで送信済みのため影響は限定的です。

### デプロイ時の OAuth 同意画面

初回デプロイ時に「このアプリは確認されていません」の Google 警告が出ます。これは Google によるレビューを受けていない個人スクリプトのすべてに表示される標準の警告です。「詳細 → （安全でないページ）に移動 → 許可」で通過できます（`sheets-setup.md` にも記載）。

### フォント

外部 CDN 不使用。システムフォント（Hiragino Mincho ProN / Yu Mincho / Noto Serif JP のフォールバックチェーン）を使用。iOS/macOS では Hiragino 系、Windows では Yu 系、Android では Noto Serif JP が使われます。

### 印刷スタイル

`@media print` で不要な UI（ヘッダー・ボタン群・トースト等）を `display: none` にし、回答プレビュー部分のみが印刷される設計になっています。ブラウザの「PDF として保存」も同様に動作します。

---

## ローカル動作確認チェックリスト

- `open interview-app/index.html` でブラウザが開く
- 商品選択 + 名前入力 → 「はじめる」 → question.html に遷移する
- 各質問に回答 → Enter または「次へ」で次の質問に進む
- Q8 まで進んで「完了して確認する」→ complete.html に遷移する
- complete.html で「Google Sheetsへ送信」→「送信できませんでした」のフォールバックが表示される（URL未設定のため正常）
- 「本文をコピー」でクリップボードにコピーされる（トーストが出る）
- question.html でブラウザを閉じて再度 index.html を開く → 「前回の途中から再開しますか？」バナーが出る
- DevTools でビューポートを 375px に設定して横スクロールが出ないことを確認

---

*社内業務用・非公開・2026-08-28 作成*
