// 着せ替えコレクション。首輪5/バンダナ5/帽子5。解放条件はなつき度Lv・連続日数・
// 累計来訪数の組み合わせ。装着状態は LifeState.wardrobe に保存する。
import { bondLevel } from "./lifeState";
import type { LifeState } from "./lifeState";

export type Slot = "collar" | "bandana" | "hat" | "shirt";

export interface Item {
  id: string;
  slot: Slot;
  name: string;
  color: string;       // メインカラー
  sub?: string;        // サブカラー（模様など）
  // 解放条件（いずれか未指定は無条件）。すべて満たすと解放。
  unlock: { bondLv?: 1 | 2 | 3 | 4; streak?: number; visits?: number };
  hint: string;        // 未解放時のヒント
}

// ==== 解放条件表 ====
// 首輪   あか:初期 / あお:なつき度Lv2 / みどり:連続7日 / きんいろ:累計30日 / ハート:なつき度Lv4
// バンダナ みずたま:初期 / ストライプ:累計10日 / はな:なつき度Lv3 / ほし:連続14日 / チェック:累計60日
// 帽子   むぎわら:なつき度Lv2 / ベレー:累計20日 / とんがり:連続10日 / かんむり:なつき度Lv4 / リボン:累計45日
export const ITEMS: Item[] = [
  // 首輪
  { id: "collar-red", slot: "collar", name: "あかい首輪", color: "#E2574C", unlock: {}, hint: "さいしょから つけられるよ" },
  { id: "collar-blue", slot: "collar", name: "あおい首輪", color: "#4E97C2", unlock: { bondLv: 2 }, hint: "なかよし度 Lv2 で" },
  { id: "collar-green", slot: "collar", name: "みどりの首輪", color: "#7FB069", unlock: { streak: 7 }, hint: "れんぞく 7日で" },
  { id: "collar-gold", slot: "collar", name: "きんの首輪", color: "#F2C14E", sub: "#B8860B", unlock: { visits: 30 }, hint: "あったひ 30日で" },
  { id: "collar-heart", slot: "collar", name: "ハート首輪", color: "#F08CA0", sub: "#E2574C", unlock: { bondLv: 4 }, hint: "なかよし度 Lv4 で" },
  // バンダナ
  { id: "bandana-dot", slot: "bandana", name: "みずたまバンダナ", color: "#4E97C2", sub: "#fff", unlock: {}, hint: "さいしょから つけられるよ" },
  { id: "bandana-stripe", slot: "bandana", name: "ストライプバンダナ", color: "#E2574C", sub: "#fff", unlock: { visits: 10 }, hint: "あったひ 10日で" },
  { id: "bandana-flower", slot: "bandana", name: "はなバンダナ", color: "#F08CA0", sub: "#FFF3C4", unlock: { bondLv: 3 }, hint: "なかよし度 Lv3 で" },
  { id: "bandana-star", slot: "bandana", name: "ほしバンダナ", color: "#5A639E", sub: "#F2C14E", unlock: { streak: 14 }, hint: "れんぞく 14日で" },
  { id: "bandana-check", slot: "bandana", name: "チェックバンダナ", color: "#9A551C", sub: "#FBEAD0", unlock: { visits: 60 }, hint: "あったひ 60日で" },
  // 帽子
  { id: "hat-straw", slot: "hat", name: "むぎわらぼうし", color: "#EFC07E", sub: "#D9883B", unlock: { bondLv: 2 }, hint: "なかよし度 Lv2 で" },
  { id: "hat-beret", slot: "hat", name: "ベレーぼう", color: "#E2574C", sub: "#7A5230", unlock: { visits: 20 }, hint: "あったひ 20日で" },
  { id: "hat-party", slot: "hat", name: "とんがりぼうし", color: "#7FB069", sub: "#F2C14E", unlock: { streak: 10 }, hint: "れんぞく 10日で" },
  { id: "hat-crown", slot: "hat", name: "おうかんむり", color: "#F2C14E", sub: "#B8860B", unlock: { bondLv: 4 }, hint: "なかよし度 Lv4 で" },
  { id: "hat-ribbon", slot: "hat", name: "リボン", color: "#F08CA0", sub: "#E2574C", unlock: { visits: 45 }, hint: "あったひ 45日で" },
  // ふく（ボーダーシャツ）。色はボーダー（しま）の色、subは生地のベース色。
  { id: "shirt-border-red", slot: "shirt", name: "あかボーダー", color: "#E2574C", sub: "#FBEAD0", unlock: { visits: 30 }, hint: "あったひ 30日で" },
  { id: "shirt-border-blue", slot: "shirt", name: "あおボーダー", color: "#4E97C2", sub: "#FBEAD0", unlock: { visits: 30 }, hint: "あったひ 30日で" },
];

export const itemById = (id: string | null): Item | undefined =>
  id ? ITEMS.find((it) => it.id === id) : undefined;

export function isUnlocked(item: Item, s: LifeState): boolean {
  const u = item.unlock;
  if (u.bondLv && bondLevel(s.bond) < u.bondLv) return false;
  if (u.streak && s.streak < u.streak) return false;
  if (u.visits && s.visitDayCount < u.visits) return false;
  return true;
}

export interface Wardrobe {
  collar: string | null;
  bandana: string | null;
  hat: string | null;
  shirt: string | null;
}

export const emptyWardrobe = (): Wardrobe => ({ collar: null, bandana: null, hat: null, shirt: null });

// 新しく解放されたアイテムの検出（前回チェック時のなつき度/連続/来訪と比較）
export function newlyUnlocked(prev: LifeState, next: LifeState): Item[] {
  return ITEMS.filter((it) => !isUnlocked(it, prev) && isUnlocked(it, next));
}
