export interface RoomStage {
  name: string;
  sub: string;
  amount: number;
  badge: "leaf" | "scarf" | "medal" | "crown" | "halo" | null;
}

export const ROOM_STAGES: RoomStage[] = [
  { name: "うまれたて", sub: "0日齢", amount: 370000, badge: null },
  { name: "よちよち歩き", sub: "2週間", amount: 427000, badge: null },
  { name: "目が開いた！", sub: "4週間", amount: 484000, badge: null },
  { name: "わんぱく盛り", sub: "2か月", amount: 541000, badge: "leaf" },
  { name: "おすわり上手", sub: "4か月", amount: 599000, badge: "leaf" },
  { name: "成長期", sub: "6か月", amount: 656000, badge: "scarf" },
  { name: "りりしくなってきた", sub: "9か月", amount: 713000, badge: "scarf" },
  { name: "すっかり成犬", sub: "1歳", amount: 770000, badge: "medal" },
  { name: "のんびり大人", sub: "2歳", amount: 827000, badge: "medal" },
  { name: "貫禄の風格", sub: "3歳", amount: 884000, badge: "crown" },
  { name: "大富豪犬", sub: "4歳", amount: 942000, badge: "crown" },
  { name: "ずっと一緒！", sub: "5歳", amount: 1000000, badge: "halo" },
];

export function roomLevelFromAmount(amount: number): number {
  let lv = 1;
  ROOM_STAGES.forEach((s, i) => { if (amount >= s.amount) lv = i + 1; });
  return lv;
}

export interface RoomParams {
  bodyScale: number;
  bodyStretch: number;
  earUp: number;
  eyeSize: number;
  cheek: number;
}

// ¥100万（最終成長ステージ）以降の「生涯ステージ」。ここから先は打ち止めにせず、
// 一定額ごとに新しい称号が無限に解禁される。体は成犬のままで、称号ときずなが育つ。
export interface StageInfo {
  title: string;      // 現在の称号
  curAmount: number;  // 現在ステージの基準額
  nextAmount: number; // 次ステージの到達額（常に存在＝無限進行）
  nextTitle: string;  // 次の称号
  badge: RoomStage["badge"];
}

const NAMED_LIFE_STAGES: { amount: number; title: string; badge: RoomStage["badge"] }[] = [
  { amount: 1000000, title: "ずっと一緒！", badge: "halo" },
  { amount: 1500000, title: "たよれる相棒", badge: "halo" },
  { amount: 2000000, title: "おうちの主", badge: "halo" },
  { amount: 3000000, title: "みんなの人気者", badge: "crown" },
  { amount: 5000000, title: "でんせつの犬", badge: "crown" },
  { amount: 7000000, title: "まちの守り神", badge: "halo" },
  { amount: 10000000, title: "しあわせの化身", badge: "halo" },
];
const HALL_UNIT = 10000000; // ¥1000万ごとに殿堂入りの世代が上がる

// 積立額に応じた生涯ステージ。¥100万未満では null（通常の成長ステージを使う）。
export function endlessStage(amount: number): StageInfo | null {
  if (amount < NAMED_LIFE_STAGES[0].amount) return null;
  // 名前つきステージの範囲内
  let i = 0;
  for (let k = 0; k < NAMED_LIFE_STAGES.length; k++) if (amount >= NAMED_LIFE_STAGES[k].amount) i = k;
  if (i < NAMED_LIFE_STAGES.length - 1) {
    const cur = NAMED_LIFE_STAGES[i], nx = NAMED_LIFE_STAGES[i + 1];
    return { title: cur.title, curAmount: cur.amount, nextAmount: nx.amount, nextTitle: nx.title, badge: cur.badge };
  }
  // ¥1000万以降：殿堂入り。HALL_UNIT ごとに世代を重ねる無限ステージ。
  const steps = Math.floor((amount - HALL_UNIT) / HALL_UNIT); // 0=¥1000万
  const curAmount = HALL_UNIT + steps * HALL_UNIT;
  return {
    title: steps === 0 ? "しあわせの化身" : `殿堂入り ${steps}世`,
    curAmount, nextAmount: curAmount + HALL_UNIT,
    nextTitle: `殿堂入り ${steps + 1}世`, badge: "halo",
  };
}

// 祝福・進捗管理用の通し番号。成長ステージ(1-12)→生涯ステージ(12〜)→殿堂入り(20〜)。
// 連番である必要はなく「昇格すると必ず増える（単調増加）」ことだけを保証する。
// Lv12「ずっと一緒！」(¥100万)と生涯ステージ先頭は同じ称号なので ord も一致する(12)。
export function stageOrdinal(principal: number): { ord: number; title: string } {
  const e = endlessStage(principal);
  if (!e) {
    const lv = roomLevelFromAmount(principal);
    return { ord: lv, title: ROOM_STAGES[lv - 1].name };
  }
  const idx = NAMED_LIFE_STAGES.findIndex((s) => s.title === e.title);
  if (idx >= 0) return { ord: 12 + idx, title: e.title };
  const m = /殿堂入り (\d+)世/.exec(e.title);
  const n = m ? +m[1] : 1;
  return { ord: 12 + NAMED_LIFE_STAGES.length + n, title: e.title };
}

export function roomParamsFor(level: number): RoomParams {
  const t = (level - 1) / 11;
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    bodyScale: lerp(0.62, 1.0),
    bodyStretch: lerp(0.97, 1.03),
    earUp: lerp(0.35, 1.0),
    eyeSize: lerp(1.25, 0.92),
    cheek: lerp(1.15, 0.85),
  };
}
