/**
 * apps-script.gs — フルフル 商品マスタ取材フォーム
 * Google Apps Script (doPost) で受け取ったデータを Spreadsheet に追記する
 *
 * 使い方:
 *   1. Google スプレッドシートを開く
 *   2. 拡張機能 → Apps Script
 *   3. このコードを貼り付けて保存（Ctrl+S / Cmd+S）
 *   4. デプロイ → 新しいデプロイ → ウェブアプリ
 *      実行するユーザー：自分 / アクセスできるユーザー：全員
 *   5. デプロイ後に発行されるURLを config.js の APPS_SCRIPT_URL に貼る
 *
 * Sheet構成:
 *   シート1（名前: "取材回答"）: 全回答を追記（公開用）
 *   シート2（名前: "原価管理"）: 商品ID列と空欄の原価列（非公開・社長のみ）
 *
 * ⚠️ セキュリティ: このウェブアプリは「全員」にアクセス権を与えます。
 *    URL を知っていれば誰でも書き込めます。
 *    社内ツールの性質上これは許容範囲ですが、
 *    URL は社外に漏れないよう管理してください。
 */

/* ====== 設定 ====== */
const SHEET_NAME_ANSWERS = "取材回答";   // 回答記録シート名
const SHEET_NAME_COSTS   = "原価管理";  // 原価管理シート名（社長のみ閲覧）

/* ====== ヘッダー定義（シート1: 取材回答）====== */
const ANSWER_HEADERS = [
  "送信日時",
  "商品名",
  "回答者名",
  "Q1_きっかけ",
  "Q2_素材こだわり",
  "Q3_工程手間",
  "Q4_食べ方シーン",
  "Q5_お客様の声",
  "Q6_注意弱点",
  "Q7_自分での楽しみ方",
  "Q8_エピソード",
  "補足_写真希望場面",
  "補足_実名公開可否",
  "補足_後で答えたい項目",
  "アプリバージョン",
];

/* ====== ヘッダー定義（シート2: 原価管理）====== */
const COST_HEADERS = [
  "商品ID",         // 取材回答の「送信日時_商品名」で連番管理
  "商品名",
  "原材料費（円）", // 空欄・実データ入力待ち
  "製造原価（円）", // 空欄
  "売価（円）",     // 空欄
  "粗利（円）",     // 空欄
  "粗利率（%）",    // 空欄
  "写真Driveリンク",// 予約列（将来拡張）
  "記事URL",         // 予約列
  "MakeShop商品ID",  // 予約列
  "楽天商品ID",      // 予約列
  "備考",
];

/* ====== doPost: POSTを受け取って Spreadsheet に追記 ====== */
function doPost(e) {
  // CORS 対応ヘッダー
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    // リクエストボディをパース
    const payload = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    /* シート1: 取材回答 */
    let answerSheet = ss.getSheetByName(SHEET_NAME_ANSWERS);
    if (!answerSheet) {
      answerSheet = ss.insertSheet(SHEET_NAME_ANSWERS);
    }

    // ヘッダー行がなければ追加
    if (answerSheet.getLastRow() === 0) {
      answerSheet.appendRow(ANSWER_HEADERS);
      // ヘッダー行を太字・固定
      answerSheet.setFrozenRows(1);
      answerSheet.getRange(1, 1, 1, ANSWER_HEADERS.length).setFontWeight("bold");
    }

    // データ行を構築（ヘッダーの順番に合わせる）
    const row = ANSWER_HEADERS.map(key => {
      const val = payload[key];
      return val !== undefined ? String(val) : "";
    });
    answerSheet.appendRow(row);

    /* シート2: 原価管理（商品IDと商品名だけ追記、他は空欄） */
    let costSheet = ss.getSheetByName(SHEET_NAME_COSTS);
    if (!costSheet) {
      costSheet = ss.insertSheet(SHEET_NAME_COSTS);
    }
    if (costSheet.getLastRow() === 0) {
      costSheet.appendRow(COST_HEADERS);
      costSheet.setFrozenRows(1);
      costSheet.getRange(1, 1, 1, COST_HEADERS.length).setFontWeight("bold");
    }
    // 商品IDは「送信日時_商品名」
    const productId = `${payload["送信日時"] || ""}_${payload["商品名"] || ""}`;
    const costRow = new Array(COST_HEADERS.length).fill("");
    costRow[0] = productId;
    costRow[1] = payload["商品名"] || "";
    costSheet.appendRow(costRow);

    /* 成功レスポンス */
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    /* エラーレスポンス */
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ====== doGet: 疎通確認用（任意）====== */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "フルフル取材フォーム Apps Script 稼働中" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ====== OPTIONS: プリフライトリクエスト対応 ====== */
// Google Apps Script は OPTIONS を自動的に 200 で返すため、
// doOptions を定義するだけで CORS プリフライトは通る。
function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ====== 送信成功の通知メール（任意・強く推奨）======
 *
 * Webアプリ側は no-cors 送信のため、送信の成否をブラウザ側で確認できません
 * （フォーム側は「送信成功」と表示されても、実際に Sheet に入っていないケースを検知できない）。
 *
 * 対策＝Apps Script 側で「Sheet に append が成功した瞬間」に、運用担当のメールへ
 * 受信通知を送る。これで「フォームから送ったが Sheet に来ない」事故を検知できます。
 *
 * 使い方＝下の関数を有効化し、doPost の最後（Sheet.appendRow の直後・catch の前）に
 *   notifyReceived_(payload);
 * の1行を差し込んでください。
 *
 * 注意＝Apps Script の MailApp.sendEmail は1日あたりの送信上限があります
 * （個人アカウント=100通/日、Google Workspace=1500通/日）。運用上十分な余裕です。
 */
function notifyReceived_(payload) {
  var TO   = "運用担当のメールアドレス@example.com";  // ← ここを書き換え
  // 送信ペイロード（js/submit.js の buildPayload）のキーは日本語（商品名・回答者名）。
  // productLabel / productValue というキーは送信されないため、旧実装では常に「無題」になっていた。
  var SUBJ = "【フルフル取材】" + (payload["商品名"] || "無題") + " の回答が届きました";
  var BODY = [
    "取材フォームから新しい回答が届きました。",
    "",
    "商品: " + (payload["商品名"] || "-"),
    "回答者: " + (payload["回答者名"] || "-"),
    "送信時刻: " + new Date().toLocaleString("ja-JP"),
    "",
    "Google Sheets を開いて内容を確認してください。",
  ].join("\n");
  MailApp.sendEmail(TO, SUBJ, BODY);
}
