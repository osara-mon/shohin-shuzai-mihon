/**
 * complete.js — 完了画面のロジック
 *
 * 責務:
 *   - sessionStorage から完了セッションを復元してプレビュー描画
 *   - 「Google Sheetsへ送信」ボタン
 *   - 「本文をコピー」ボタン
 *   - 「印刷用に表示」ボタン（window.print()）
 *   - 送信失敗時フォールバック表示（コピー + mailto）
 *   - 送信成功後 localStorage をクリア
 */

/* -------- セッション復元 -------- */
let session = null;
const raw = sessionStorage.getItem("fullfull_interview_done");
if (raw) {
  try { session = JSON.parse(raw); } catch { session = null; }
}
// fallback: localStorage
if (!session) {
  const saved = loadSession();
  if (isValidSession(saved)) session = saved;
}
if (!session) {
  // セッションが無ければ入口に戻す
  window.location.replace("index.html");
  throw new Error("no session — redirecting to index.html");
}

/* -------- DOM 参照 -------- */
const btnSubmit    = document.getElementById("btn-submit");
const btnCopy      = document.getElementById("btn-copy");
const btnPrint     = document.getElementById("btn-print");
const previewEl    = document.getElementById("answer-preview");
const fallbackBox  = document.getElementById("fallback-box");
const btnMailto    = document.getElementById("btn-mailto");
const btnFallbackCopy = document.getElementById("btn-fallback-copy");
const toastEl      = document.getElementById("toast");
const summaryProduct = document.getElementById("summary-product");
const summaryResponder = document.getElementById("summary-responder");
const summaryDate  = document.getElementById("summary-date");

/* -------- ヘッダー情報 -------- */
function getProductLabel() {
  if (session.productValue === "other") return session.productOther || "その他";
  const found = PRODUCTS.find(p => p.value === session.productValue);
  return found ? found.label : session.productValue;
}

const productLabel = getProductLabel();

if (summaryProduct)   summaryProduct.textContent = productLabel;
if (summaryResponder) summaryResponder.textContent = session.responderName || "（未入力）";
if (summaryDate) {
  const d = new Date(session.savedAt || Date.now());
  summaryDate.textContent = d.toLocaleDateString("ja-JP");
}

/* -------- プレビュー描画 -------- */
function renderPreview() {
  if (!previewEl) return;

  const headerEl = document.createElement("div");
  headerEl.className = "answer-preview__header";
  headerEl.textContent = `${productLabel}　${session.responderName || ""}`;
  previewEl.appendChild(headerEl);

  QUESTIONS.forEach(q => {
    const answer = session.answers[q.id] || "";
    const item = document.createElement("div");
    item.className = "answer-item";

    const qEl = document.createElement("div");
    qEl.className = "answer-q";
    if (q.supplement) {
      qEl.textContent = `補足${q.label}　${q.text.replace(/\n/g, " ")}`;
    } else {
      qEl.textContent = `Q${q.number}　${q.text.replace(/\n/g, " ")}`;
    }

    const aEl = document.createElement("div");
    if (answer.trim()) {
      aEl.className = "answer-a";
      aEl.textContent = answer;
    } else {
      aEl.className = "answer-a answer-a--empty";
      aEl.textContent = "（未回答）";
    }

    item.appendChild(qEl);
    item.appendChild(aEl);
    previewEl.appendChild(item);
  });
}
renderPreview();

/* -------- トースト -------- */
let toastTimer = null;
function showToast(msg, type = "") {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.className = "toast" + (type ? ` toast--${type}` : "");
  // 強制リフロー
  void toastEl.offsetWidth;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("is-visible");
  }, 3000);
}

/* -------- コピー -------- */
async function handleCopy() {
  const text = buildPlainText(session);
  const ok = await copyToClipboard(text);
  if (ok) {
    showToast("コピーしました", "success");
    if (btnCopy) {
      const orig = btnCopy.textContent;
      btnCopy.textContent = "コピーしました ✓";
      setTimeout(() => { btnCopy.textContent = orig; }, 2000);
    }
  } else {
    showToast("コピーに失敗しました。テキストを手動で選択してください", "error");
  }
}

if (btnCopy) btnCopy.addEventListener("click", handleCopy);
if (btnFallbackCopy) btnFallbackCopy.addEventListener("click", handleCopy);

/* -------- 送信 -------- */
if (btnSubmit) {
  btnSubmit.addEventListener("click", async () => {
    // ローディング
    btnSubmit.classList.add("is-loading");
    btnSubmit.disabled = true;

    const result = await submitToSheets(session);

    btnSubmit.classList.remove("is-loading");
    btnSubmit.disabled = false;

    if (result.ok) {
      btnSubmit.textContent = "送信しました ✓";
      btnSubmit.classList.add("is-success");
      showToast("Google Sheetsに送信しました", "success");
      // セッションクリア（送信完了）
      clearSession();
      sessionStorage.removeItem("fullfull_interview_done");
      sessionStorage.removeItem("fullfull_interview_current");
    } else {
      // フォールバック表示
      if (fallbackBox) fallbackBox.classList.add("is-visible");
      showToast("送信できませんでした。コピーまたはメールでお送りください", "error");
    }
  });
}

/* -------- mailto -------- */
if (btnMailto) {
  btnMailto.addEventListener("click", () => openMailto(session));
}

/* -------- 印刷 -------- */
if (btnPrint) {
  btnPrint.addEventListener("click", () => window.print());
}
