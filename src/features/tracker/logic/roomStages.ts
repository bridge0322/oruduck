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

export function roomParamsFor(level: number): RoomParams {
  const t = (level - 1) / 11;
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    bodyScale: lerp(0.62, 1.0),
    bodyStretch: lerp(0.92, 1.12),
    earUp: lerp(0.35, 1.0),
    eyeSize: lerp(1.25, 0.92),
    cheek: lerp(1.15, 0.85),
  };
}
