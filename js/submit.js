/**
 * submit.js — Google Sheets への送信 & フォールバック
 *
 * 送信フロー:
 *   1. APPS_SCRIPT_URL が設定されていれば fetch POST
 *   2. 失敗（URL未設定・ネットワークエラー・CORS等）→ フォールバック表示
 *   3. フォールバック: 「本文をコピー」 + 「メールで送る」(mailto)
 *
 * Apps Script 側は CORS 対応のため "no-cors" で送信する。
 * no-cors では応答本文は読めない（opaque response）ため、
 * 送信成功の確認はできない点に注意。代替: Apps Scriptで確認メールを送る設定を推奨（setup.md参照）。
 */

/**
 * セッションデータをフラットな送信ペイロードに変換
 * @param {Object} session
 * @returns {Object}
 */
function buildPayload(session) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
  }).replace(/\//g, "-");
  const timeStr = now.toLocaleTimeString("ja-JP", {
    hour: "2-digit", minute: "2-digit",
  });

  // 商品ID → ラベルに変換
  const productLabel = (() => {
    if (session.productValue === "other") return session.productOther || "その他";
    const found = PRODUCTS.find(p => p.value === session.productValue);
    return found ? found.label : session.productValue;
  })();

  return {
    送信日時: `${dateStr} ${timeStr}`,
    商品名: productLabel,
    回答者名: session.responderName || "",
    Q1_きっかけ: session.answers["q1"] || "",
    Q2_素材こだわり: session.answers["q2"] || "",
    Q3_工程手間: session.answers["q3"] || "",
    Q4_食べ方シーン: session.answers["q4"] || "",
    Q5_お客様の声: session.answers["q5"] || "",
    Q6_注意弱点: session.answers["q6"] || "",
    Q7_自分での楽しみ方: session.answers["q7"] || "",
    Q8_エピソード: session.answers["q8"] || "",
    補足_写真希望場面: session.answers["sup1"] || "",
    補足_実名公開可否: session.answers["sup2"] || "",
    補足_後で答えたい項目: session.answers["sup3"] || "",
    アプリバージョン: APP_VERSION,
  };
}

/**
 * Google Sheets に送信
 * @param {Object} session
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function submitToSheets(session) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "") {
    return { ok: false, error: "APPS_SCRIPT_URL が設定されていません" };
  }

  const payload = buildPayload(session);

  try {
    // no-cors: opaque response（成否は判別できない）
    // APPS_SCRIPT_URL が正しく設定されていれば Apps Script が受け取る
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // no-cors では例外が出なければ「送信した」とみなす
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "ネットワークエラー" };
  }
}

/**
 * 回答を人が読めるテキスト形式に変換
 * コピー用・メール用・印刷用を兼ねる
 * @param {Object} session
 * @returns {string}
 */
function buildPlainText(session) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ja-JP");

  const productLabel = (() => {
    if (session.productValue === "other") return session.productOther || "その他";
    const found = PRODUCTS.find(p => p.value === session.productValue);
    return found ? found.label : session.productValue;
  })();

  const lines = [
    `【フルフル 商品取材フォーム】`,
    `送信日時：${dateStr}`,
    `商品名：${productLabel}`,
    `回答者：${session.responderName || "（未入力）"}`,
    "",
    ...QUESTIONS.map(q => {
      const label = q.supplement
        ? `補足${q.label}：${q.text}`
        : `Q${q.number}：${q.text.replace(/\n/g, " ")}`;
      const answer = session.answers[q.id] || "（未回答）";
      return `${label}\n${answer}`;
    }),
  ];

  return lines.join("\n\n");
}

/**
 * テキストをクリップボードにコピー
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 古い方式にフォールバック
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * メール送信用 mailto リンクを生成して開く
 * @param {Object} session
 */
function openMailto(session) {
  const text = buildPlainText(session);
  const subject = encodeURIComponent(`【商品取材】${session.productLabel || "商品"} 回答`);
  const body = encodeURIComponent(text);
  const email = FALLBACK_EMAIL ? encodeURIComponent(FALLBACK_EMAIL) : "";
  const mailto = `mailto:${email}?subject=${subject}&body=${body}`;
  window.location.href = mailto;
}
