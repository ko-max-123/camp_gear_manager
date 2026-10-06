/** 画面の表示名・種類別素材・表示用の小さな関数。保存処理は含めません。 */
export const categories = [
  "テント・タープ",
  "寝具",
  "ファニチャー",
  "焚き火・火器",
  "調理・食器",
  "照明・電源",
  "クーラー・保冷",
  "衣類",
  "衛生・救急",
  "工具・ロープ",
  "その他",
];
export const statusText = {
  good: "使用OK",
  check: "要確認",
  repair: "修理・交換",
};
export const sceneDefs = {
  backpack: {
    label: "リュック類",
    desc: "リュック・バッグ・持ち運び用品",
    filter: (g) =>
      /リュック|バッグ|バックパック/.test(g.name) ||
      /玄関収納/.test(g.storage || ""),
  },
  cookware: {
    label: "クッカー",
    desc: "鍋・フライパン・バーナーなど",
    filter: (g) =>
      g.category === "焚き火・火器" ||
      /クッカー|鍋|フライパン|バーナー/.test(g.name),
  },
  lantern: {
    label: "ランタン",
    desc: "照明・電源まわり",
    filter: (g) => g.category === "照明・電源" || /ランタン/.test(g.name),
  },
  tools: {
    label: "工具・ロープ",
    desc: "設営用のロープや工具",
    filter: (g) =>
      g.category === "工具・ロープ" || /ペグ|ロープ|ハンマー/.test(g.name),
  },
  clothes: {
    label: "衣類",
    desc: "上着や身につけるもの",
    filter: (g) =>
      g.category === "衣類" || /ジャケット|上着|ウェア/.test(g.name),
  },
  coolers: {
    label: "クーラー",
    desc: "保冷系の道具",
    filter: (g) => g.category === "クーラー・保冷" || /クーラー/.test(g.name),
  },
  boxes: {
    label: "収納BOX",
    desc: "収納BOXに入っている道具",
    filter: (g) => /収納BOX/.test(g.storage || ""),
  },
  sleeping: {
    label: "寝具・テント",
    desc: "テント・寝具まわり",
    filter: (g) => g.category === "寝具" || g.category === "テント・タープ",
  },
  tableware: {
    label: "食器",
    desc: "マグ・皿・カップなど",
    filter: (g) =>
      g.category === "調理・食器" || /マグ|カップ|皿|食器/.test(g.name),
  },
};
export const careSteps = [
  {
    id: "clean",
    label: "清掃",
    hint: "汚れを落とす",
    description: "道具に合う方法で、土や汚れを落とす。",
    path: "M5 7 9 4l10 6-4 3L5 7Zm0 0-2 10 10 4 2-8M8 11l-2 7M12 13l-2 7",
  },
  {
    id: "dry",
    label: "乾燥",
    hint: "水分を残さない",
    description: "水分や湿り気が残っていないか確かめる。",
    path: "M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3",
  },
  {
    id: "inspect",
    label: "点検",
    hint: "破損や不足を確認",
    description: "曲がり・割れ・緩み、本数や付属品を確かめる。",
    path: "M15 3a5 5 0 0 0-6 6L3 15l6 6 6-6a5 5 0 0 0 6-6l-4 4-6-6 4-4Z",
  },
  {
    id: "store",
    label: "収納",
    hint: "いつもの場所へ",
    description: "付属品をまとめて、保管場所に戻す。",
    path: "M3 7h18v14H3V7Zm-1-4h20v4H2V3Zm7 8h6",
  },
];
export const careIcon = (step) =>
  `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${step.path}" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const completedCareSteps = (g) =>
  careSteps.filter((step) => g.care?.steps?.includes(step.id)).length;
export const careDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("ja-JP")
    : "";
};
export const sceneMotion = () =>
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const weight = (list) =>
  list.reduce((s, g) => s + (Number(g.weight) || 0) * (Number(g.qty) || 1), 0);
export const fmtWeight = (v) => {
  v = Number(v) || 0;
  return v
    ? v < 0.1
      ? `${Number((v * 1000).toFixed(1))} g`
      : `${v.toFixed(v < 10 ? 2 : 1).replace(/\.?0+$/, "")} kg`
    : "—";
};
export const makeId = () =>
  `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
export const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        m
      ],
  );
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => [...document.querySelectorAll(selector)];
export function stat(label, value, unit) {
  return `<div class="stat-card"><small>${label}</small><strong>${value}<span>${unit}</span></strong></div>`;
}
export function sceneSprite(item) {
  const name = item.name;
  const rules = [
    [/ランタン|ライト/, 0],
    [/マグ|カップ|食器|皿/, 1],
    [/クッカー|鍋|フライパン/, 2],
    [/テント|タープ/, 3],
    [/シュラフ|寝袋/, 4],
    [/クーラー|保冷/, 5],
    [/ロープ/, 6],
    [/リュック|バッグ|バックパック/, 7],
    [/ハンマー/, 8],
    [/ペグ/, 9],
    [/救急/, 10],
    [/バーナー|コンロ/, 11],
    [/電源|バッテリー/, 12],
    [/マット/, 13],
    [/ジャケット|上着|ウェア/, 14],
  ];
  const match = rules.find(([pattern]) => pattern.test(name));
  if (match) return match[1];
  return (
    {
      "テント・タープ": 3,
      寝具: 4,
      "焚き火・火器": 11,
      "調理・食器": 2,
      "照明・電源": 0,
      "クーラー・保冷": 5,
      衣類: 14,
      "衛生・救急": 10,
      "工具・ロープ": 6,
    }[item.category] ?? 15
  );
}
