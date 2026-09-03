/**
 * storage.js — localStorage による途中保存・再開
 *
 * キー設計:
 *   fullfull_interview_session  … セッション全体（商品名・回答者名・回答データ・日付・進行中の質問番号）
 *
 * iOS Safari の制約:
 *   - プライベートブラウズでは localStorage が使えない（容量0）
 *   - 使えない場合はメモリ上のオブジェクトにフォールバック（ブラウザを閉じると消える）
 *   - ユーザーには「保存できない環境です」と一言表示する
 */

const STORAGE_KEY = "fullfull_interview_session";

/** localStorage が使えるか判定 */
function isStorageAvailable() {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, "1");
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

const HAS_STORAGE = isStorageAvailable();

/** メモリフォールバック（localStorage 不可のとき） */
let _memoryStore = null;

/** セッションを保存 */
function saveSession(sessionData) {
  const payload = JSON.stringify({
    ...sessionData,
    savedAt: new Date().toISOString(),
    version: APP_VERSION,
  });
  if (HAS_STORAGE) {
    try {
      localStorage.setItem(STORAGE_KEY, payload);
      return true;
    } catch {
      // quota exceeded 等
      return false;
    }
  } else {
    _memoryStore = payload;
    return false; // 保存はされるがページを閉じると消える
  }
}

/** セッションを読み込み */
function loadSession() {
  let raw = null;
  if (HAS_STORAGE) {
    raw = localStorage.getItem(STORAGE_KEY);
  } else {
    raw = _memoryStore;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** セッションを削除（完了後） */
function clearSession() {
  if (HAS_STORAGE) {
    localStorage.removeItem(STORAGE_KEY);
  }
  _memoryStore = null;
}

/** セッションが有効かチェック（バージョン・構造の最低限確認） */
function isValidSession(session) {
  if (!session) return false;
  if (!session.answers || typeof session.answers !== "object") return false;
  if (!session.savedAt) return false;
  return true;
}

/**
 * 自動保存（デバウンス付き）
 * テキスト入力のたびに呼ぶと重いので 800ms のデバウンスをかける
 */
let _debounceTimer = null;
function autosave(sessionData, onSaved) {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    const ok = saveSession(sessionData);
    if (onSaved) onSaved(ok);
  }, 800);
}
