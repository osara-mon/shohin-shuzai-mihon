/**
 * complete.js — 確認 → 完了画面のロジック
 *
 * 画面の流れ（2026-09-07 社長指示で3段階化）:
 *   1. 質問の最後で「完了して確認する」→ この画面に来る（＝確認画面。まだ何も送信していない）
 *   2. この画面で全11問の回答を見返せる。直したければ「質問に戻って直す」で question.html へ
 *   3. 「完了する」を押すと初めて送信を実行する。成功したときだけ「記録しました」と表示する
 *
 * 責務:
 *   - sessionStorage / localStorage から確認対象セッションを復元してプレビュー描画
 *   - 「完了する」ボタン（＝送信。成功するまでは「まだ記録されていない」ことを明示）
 *   - 送信失敗時のみ、代わりの送り方（本文をコピー／メールで送る）を表示
 *   - 「印刷 / PDF保存」ボタン（送信状態に関わらず常時利用可）
 *   - 送信成功後 localStorage をクリアし、見出しを「記録しました」に切り替える
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

// 「質問に戻って直す」で question.html に戻ったとき、最新の回答内容
// （最後の質問の回答を含む）で再開できるよう、sessionStorage の作業中キーを
// この画面が持っている最新セッションで同期しておく。
// （同期しないと、最後の質問の回答だけ古い状態に戻って見えるバグになる）
sessionStorage.setItem("fullfull_interview_current", JSON.stringify(session));

/* -------- DOM 参照 -------- */
const pageTitle    = document.getElementById("page-title");
const pageLead     = document.getElementById("page-lead");
const backWrap     = document.getElementById("back-to-question-wrap");
const btnSubmit    = document.getElementById("btn-submit");
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

/* -------- プレビュー描画（全問・確認用） -------- */
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

/* -------- コピー（送信失敗時のフォールバックのみ） -------- */
async function handleCopy() {
  const text = buildPlainText(session);
  const ok = await copyToClipboard(text);
  if (ok) {
    showToast("コピーしました", "success");
    if (btnFallbackCopy) {
      const orig = btnFallbackCopy.textContent;
      btnFallbackCopy.textContent = "コピーしました ✓";
      setTimeout(() => { btnFallbackCopy.textContent = orig; }, 2000);
    }
  } else {
    showToast("コピーに失敗しました。テキストを手動で選択してください", "error");
  }
}

if (btnFallbackCopy) btnFallbackCopy.addEventListener("click", handleCopy);

/* -------- 完了する（＝送信） -------- */
if (btnSubmit) {
  btnSubmit.addEventListener("click", async () => {
    // ローディング
    btnSubmit.classList.add("is-loading");
    btnSubmit.disabled = true;
    if (pageTitle) pageTitle.textContent = "送信しています…";
    if (fallbackBox) fallbackBox.classList.remove("is-visible");

    const result = await submitToSheets(session);

    btnSubmit.classList.remove("is-loading");

    if (result.ok) {
      // 成功したときだけ「記録しました」と明示する
      btnSubmit.textContent = "記録しました ✓";
      btnSubmit.classList.add("is-success");
      btnSubmit.disabled = true; // 二重送信を防ぐ
      if (pageTitle) pageTitle.textContent = "記録しました";
      if (pageLead) {
        pageLead.textContent = "回答はGoogle Sheetsの商品マスタに保存されました。ご協力ありがとうございました。";
      }
      if (backWrap) backWrap.style.display = "none"; // 送信後は編集導線を隠す
      showToast("Google Sheetsに送信しました", "success");
      // セッションクリア（送信完了）
      clearSession();
      sessionStorage.removeItem("fullfull_interview_done");
      sessionStorage.removeItem("fullfull_interview_current");
    } else {
      // 失敗 — 「記録された」ように見せず、代わりの送り方だけを表示する
      btnSubmit.disabled = false;
      if (pageTitle) pageTitle.textContent = "送信できませんでした（まだ記録されていません）";
      if (pageLead) {
        pageLead.textContent = "自動送信は現在ご利用いただけません。下の方法で回答をお送りください。";
      }
      if (fallbackBox) fallbackBox.classList.add("is-visible");
      showToast("送信できませんでした。コピーまたはメールでお送りください", "error");
    }
  });
}

/* -------- mailto（送信失敗時のフォールバックのみ） -------- */
if (btnMailto) {
  btnMailto.addEventListener("click", () => openMailto(session));
}

/* -------- 印刷（常時利用可） -------- */
if (btnPrint) {
  btnPrint.addEventListener("click", () => window.print());
}
