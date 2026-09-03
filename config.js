/**
 * config.js — Apps Script Web App の URL 設定ファイル
 *
 * 【社長向け手順】
 * 1. sheets-setup/sheets-setup.md の手順を実行し、Apps Script をデプロイする
 * 2. 発行された「ウェブアプリのURL」（https://script.google.com/macros/... で始まる）をコピー
 * 3. 下の APPS_SCRIPT_URL = "" の "" の中に貼り付けて保存
 *
 * 例:
 *   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
 *
 * ※ デプロイ前は "" のままで OK。送信ボタンを押すと「送信できませんでした」になりますが、
 *    コピー・メール送信のフォールバックが動きます。
 */

const APPS_SCRIPT_URL = "";

/**
 * フォールバック用メールアドレス
 * 送信に失敗したとき「メールで送る」ボタンの宛先になります。
 * 必要に応じて書き換えてください。
 */
const FALLBACK_EMAIL = "";

/**
 * アプリ名（ページタイトル等に使用）
 * 変更不要ですが、運用上別の呼び名にしたい場合は書き換えられます。
 */
const APP_NAME = "フルフル 商品取材フォーム";

/**
 * バージョン（変更不要）
 */
const APP_VERSION = "1.0.0";
