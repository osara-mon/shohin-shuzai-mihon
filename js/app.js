/**
 * app.js — question.html の一問一答フロー制御
 *
 * 責務:
 *   - 質問画面の描画・切り替え（SPA的に DOM を書き換える）
 *   - 進捗バー更新
 *   - Enter キーで次へ
 *   - autosave（storage.js）
 *   - localStorage からの再開
 *   - 完了時に complete.html へセッションを渡す（URLパラメータ不使用・sessionStorage使用）
 */

/* -------- DOM 参照 -------- */
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const questionNumber = document.getElementById("question-number");
const questionText = document.getElementById("question-text");
const questionHint = document.getElementById("question-hint");
const answerTextarea = document.getElementById("answer-textarea");
const autosaveBadge = document.getElementById("autosave-badge");
const btnBack = document.getElementById("btn-back");
const btnNext = document.getElementById("btn-next");
const btnSkip = document.getElementById("btn-skip");

/* -------- セッション復元 -------- */
let session = null;

// sessionStorage から渡されたセッション（index.html → question.html）
const rawSession = sessionStorage.getItem("fullfull_interview_current");
if (rawSession) {
  try {
    session = JSON.parse(rawSession);
  } catch { session = null; }
}

// なければ localStorage から復元を試みる
if (!session) {
  const saved = loadSession();
  if (isValidSession(saved)) {
    session = saved;
  }
}

// それでもなければ index.html に戻す
if (!session || !session.productValue || !session.responderName) {
  window.location.replace("index.html");
}

/* -------- 状態 -------- */
let currentIndex = session.currentIndex || 0;
// answers は session に含まれているものを使う（なければ空オブジェクト）
if (!session.answers) session.answers = {};

/* -------- 進捗バー更新 -------- */
function updateProgress(index) {
  const total = TOTAL_QUESTIONS;
  const done = index; // 現在の index = 完了数
  const pct = Math.round((done / total) * 100);
  progressFill.style.width = `${pct}%`;
  progressLabel.textContent = `${done} / ${total} 問`;
  progressFill.setAttribute("aria-valuenow", pct);
}

/* -------- 質問レンダリング -------- */
function renderQuestion(index) {
  const q = QUESTIONS[index];
  if (!q) return;

  // ナンバー表示
  if (q.supplement) {
    questionNumber.textContent = `補足 ${q.label}`;
  } else {
    questionNumber.textContent = `質問 ${q.number} / ${MAIN_QUESTIONS}`;
  }

  // 質問文（改行を <br> に）
  questionText.innerHTML = q.text.replace(/\n/g, "<br>");

  // ヒント
  if (q.hint) {
    questionHint.textContent = q.hint;
    questionHint.hidden = false;
  } else {
    questionHint.hidden = true;
  }

  // テキストエリア
  answerTextarea.value = session.answers[q.id] || "";
  answerTextarea.placeholder = q.placeholder || "";
  answerTextarea.setAttribute("aria-label", q.text.replace(/\n/g, " "));

  // 戻るボタン
  btnBack.disabled = index === 0;

  // 次へボタンのラベル
  if (index === TOTAL_QUESTIONS - 1) {
    btnNext.textContent = "完了して確認する →";
  } else {
    btnNext.textContent = "次へ →";
  }

  // 進捗
  updateProgress(index);

  // フォーカス（モバイルではキーボードが出ない方が良い場合もある）
  // iPad/PC ではフォーカスを当てる、スマートフォン小画面では当てない
  if (window.innerWidth > 480) {
    answerTextarea.focus();
  }

  // autosave バッジ隠す
  autosaveBadge.classList.remove("is-visible");
}

/* -------- 保存 -------- */
function saveCurrentAnswer() {
  const q = QUESTIONS[currentIndex];
  if (!q) return;
  session.answers[q.id] = answerTextarea.value;
  session.currentIndex = currentIndex;
}

function triggerAutosave() {
  saveCurrentAnswer();
  autosave(session, (ok) => {
    autosaveBadge.classList.add("is-visible");
    // 3秒後に隠す
    setTimeout(() => autosaveBadge.classList.remove("is-visible"), 3000);
  });
}

/* -------- ナビゲーション -------- */
function goNext() {
  saveCurrentAnswer();
  if (currentIndex < TOTAL_QUESTIONS - 1) {
    currentIndex++;
    renderQuestion(currentIndex);
    // sessionStorage 更新
    sessionStorage.setItem("fullfull_interview_current", JSON.stringify(session));
  } else {
    // 完了 → complete.html へ
    session.currentIndex = TOTAL_QUESTIONS;
    saveSession(session);
    sessionStorage.setItem("fullfull_interview_done", JSON.stringify(session));
    window.location.href = "complete.html";
  }
}

function goBack() {
  saveCurrentAnswer();
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion(currentIndex);
    sessionStorage.setItem("fullfull_interview_current", JSON.stringify(session));
  }
}

/* -------- イベントリスナー -------- */
btnNext.addEventListener("click", goNext);
btnBack.addEventListener("click", goBack);

if (btnSkip) {
  btnSkip.addEventListener("click", () => {
    const q = QUESTIONS[currentIndex];
    if (q) session.answers[q.id] = ""; // 空として記録
    goNext();
  });
}

// Enterキー（Shift+Enter は改行）
answerTextarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    goNext();
  }
});

// 入力のたびに autosave
answerTextarea.addEventListener("input", () => {
  triggerAutosave();
});

/* -------- 初期描画 -------- */
renderQuestion(currentIndex);

/* -------- ストレージ非対応の警告 -------- */
if (!HAS_STORAGE) {
  const warn = document.getElementById("storage-warning");
  if (warn) warn.hidden = false;
}
