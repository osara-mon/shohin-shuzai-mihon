/**
 * data.js — 質問定義・商品リスト
 * アプリ本体の固定データ。固有情報（実名・冊子由来の未確認情報）は含めない。
 */

/** 商品選択肢（MakeShop準拠・ct16→ct11の順） */
const PRODUCTS = [
  { value: "petit_pan", label: "プチパン" },
  { value: "petit_pan_kabocha", label: "プチパンかぼちゃの種" },
  { value: "petit_pan_choco", label: "プチパンチョコ" },
  { value: "petit_pan_cheese", label: "プチパンチーズ" },
  { value: "yuzukosho_france", label: "柚子胡椒フランス" },
  { value: "garlic_france", label: "ガーリックフランス" },
  { value: "mentai_france", label: "明太フランス" },
  { value: "maple_ringo_france", label: "メープルリンゴフランス" },
  { value: "noukou_milk_france", label: "濃厚ミルクフランス" },
  { value: "five_cheese_france", label: "5種のチーズフランス" },
  { value: "fullfull_baguette", label: "フルフルバゲット" },
  { value: "chocolat_france", label: "ショコラフランス" },
  { value: "fullfull_coffee", label: "フルフルコーヒー" },
  { value: "mochimochi_corn", label: "もちもちコーンパン" },
  { value: "mocchiri_shio_butter", label: "もっちり塩バター" },
  { value: "kocha_orange", label: "紅茶とオレンジ" },
  { value: "cream_cheese_cranberry", label: "クリームチーズとクランベリー" },
  { value: "choco_rock", label: "チョコロック" },
  { value: "kuri_macadamia", label: "栗とマカダミア" },
  { value: "karinto_donuts", label: "かりんとうドーナツ" },
  { value: "komeko_shokupan", label: "米粉食パン" },
  { value: "kazoku_chigiri", label: "かぞくのちぎりぱん" },
  { value: "kazoku_daikokubashira", label: "家族の大黒柱" },
  { value: "other", label: "その他（自由入力）" },
];

/** 8つの固定質問 */
const QUESTIONS = [
  {
    id: "q1",
    number: 1,
    text: "この商品は、いつ・どんなきっかけで生まれましたか\n（またはお店に置くことにしましたか）？",
    hint: "時期・場所・出会いのエピソードなど、思い当たることを何でも。",
    placeholder: "例：〇〇年ごろ、旅先で食べたパンがヒントになりました……",
    supplement: false,
  },
  {
    id: "q2",
    number: 2,
    text: "原料・素材で、こだわっているところは？",
    hint: "産地・品種・仕入れ先との関係など、特に大切にしていることを。",
    placeholder: "例：小麦は〇〇産を使っています。理由は……",
    supplement: false,
  },
  {
    id: "q3",
    number: 3,
    text: "仕上げるまでの工程で、時間や手間をかけているところは？",
    hint: "工程のこだわり・職人の技・見えないところの苦労など。",
    placeholder: "例：発酵に〇時間かけています。短くすると……",
    supplement: false,
  },
  {
    id: "q4",
    number: 4,
    text: "どんな食べ方・使い方・シーンを想像して作りましたか（選びましたか）？",
    hint: "朝食・手みやげ・特別な日……どんな食卓を想像していましたか。",
    placeholder: "例：朝、コーヒーと一緒に食べてほしくて……",
    supplement: false,
  },
  {
    id: "q5",
    number: 5,
    text: "お客様からよく言われる感想は？",
    hint: "実際に届いた声・店頭での反応・リピートのきっかけなど。",
    placeholder: "例：「子どもが喜ぶ」とよく聞きます。他には……",
    supplement: false,
  },
  {
    id: "q6",
    number: 6,
    text: "正直に伝えておきたい、注意点や弱点は？",
    hint: "賞味期限・保存方法・食べ方のコツ・苦手な方への注意など。\nお客様のためになる正直な情報を。",
    placeholder: "例：冷凍対応ですが、解凍後はお早めに。辛さが……",
    supplement: false,
  },
  {
    id: "q7",
    number: 7,
    text: "スタッフの皆さんは、家でどう楽しんでいますか？",
    hint: "プロだからこその食べ方・家族との食卓エピソードなど。",
    placeholder: "例：家では〇〇と合わせることが多いです……",
    supplement: false,
  },
  {
    id: "q8",
    number: 8,
    text: "この商品にまつわる、まだ話していないエピソードはありますか？",
    hint: "失敗談・転機・思い出深い出来事など、何でも。",
    placeholder: "例：実は発売当初はうまくいかなくて……",
    supplement: false,
  },
  {
    id: "sup1",
    number: null,
    label: "補足①",
    text: "写真で撮ってほしい場面はありますか？",
    hint: "「〇〇を焼いているところ」「〇〇の断面」など、具体的に教えてください。",
    placeholder: "例：切れ目を入れる手元の写真、工房の窯、など",
    supplement: true,
  },
  {
    id: "sup2",
    number: null,
    label: "補足②",
    text: "お名前・写真（作り手・お客様）の公開可否を教えてください。",
    hint: "サイトに掲載する際の方針を確認させてください。後で変更も可能です。",
    placeholder: "例：実名・顔写真OKです／匿名希望です／要相談、など",
    supplement: true,
  },
  {
    id: "sup3",
    number: null,
    label: "補足③",
    text: "後で改めて答えたい項目はありますか？",
    hint: "「〇番は資料を確認してから」「△番は別の人に聞く必要がある」など。",
    placeholder: "例：Q3は製造担当に確認します。Q7は写真も添えたい、など",
    supplement: true,
  },
];

/** 全質問数（補足含む） */
const TOTAL_QUESTIONS = QUESTIONS.length; // 11
/** 本質問数（補足除く） */
const MAIN_QUESTIONS = QUESTIONS.filter(q => !q.supplement).length; // 8
