// 芸を教える。基本3種は最初から、累計成功数が増えると新しい芸を順次習得。
export interface Trick {
  id: string;
  name: string;
  unlockAt: number;  // 累計成功数がこの値以上で習得
  line: string;
  motion: "sit" | "wait" | "jump" | "bang"; // 犬のモーション
}

export const TRICKS: Trick[] = [
  { id: "sit", name: "おすわり", unlockAt: 0, line: "おすわり、できたよ！", motion: "sit" },
  { id: "wait", name: "まて", unlockAt: 0, line: "まて…がまん、がまん…", motion: "wait" },
  { id: "ok", name: "よし！", unlockAt: 0, line: "よし！ やったー！", motion: "jump" },
  { id: "paw", name: "お手", unlockAt: 5, line: "お手、どうぞ。えっへん", motion: "jump" },
  { id: "paw2", name: "おかわり", unlockAt: 12, line: "おかわりも できるよ！", motion: "jump" },
  { id: "highfive", name: "ハイタッチ", unlockAt: 20, line: "ハイタッチ！ ぱちん！", motion: "jump" },
  { id: "bang", name: "バーン", unlockAt: 30, line: "バーン！ …たおれる まね、じょうず？", motion: "bang" },
];

export const trickById = (id: string) => TRICKS.find((t) => t.id === id);
export const totalMastery = (m: Record<string, number>): number =>
  Object.values(m || {}).reduce((a, b) => a + b, 0);
export const unlockedTricks = (m: Record<string, number>): Trick[] => {
  const t = totalMastery(m);
  return TRICKS.filter((tr) => t >= tr.unlockAt);
};
export const nextLockedTrick = (m: Record<string, number>): Trick | undefined => {
  const t = totalMastery(m);
  return TRICKS.find((tr) => t < tr.unlockAt);
};
