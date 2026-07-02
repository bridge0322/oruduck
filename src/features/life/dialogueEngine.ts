// セリフの選択エンジン。3日以内に使ったセリフは選ばない（全部使い切ったら解禁）。
// {name}（なつき度で呼び方が変わる）と {n}（数字）を埋め込んで返す。
import { linesOf } from "./dialogues";
import { callName } from "./lifeState";
import type { LifeState } from "./lifeState";
import { dayKey, timeSlot, tokyoTime } from "./time";

export interface PickedLine {
  id: string;
  text: string;
}

export function fillVars(text: string, s: LifeState, n?: number): string {
  return text
    .replaceAll("{name}", callName(s))
    .replaceAll("{n}", n != null ? String(n) : "");
}

// cat のプールから、最近使っていないものを1本選ぶ。
export function pickLine(s: LifeState, cat: string, n?: number): PickedLine | null {
  const lines = linesOf(cat);
  if (!lines.length) return null;
  const used = new Set(s.usedLines.map((u) => u.id));
  const fresh = lines.filter((l) => !used.has(l.id));
  const pool = fresh.length ? fresh : lines;
  const l = pool[Math.floor(Math.random() * pool.length)];
  return { id: l.id, text: fillVars(l.text, s, n) };
}

// セリフを使ったことを記録する（state 更新は呼び出し側が commit）
export function markUsed(s: LifeState, id: string): LifeState {
  if (s.usedLines.some((u) => u.id === id)) return s;
  return { ...s, usedLines: [...s.usedLines, { id, day: dayKey() }].slice(-300) };
}

// 開いたときのあいさつカテゴリを決める。
// 優先度：さみしい再会 > 連続日数のふしめ > 時間帯・曜日・月・豆知識・雑談のミックス
export function greetingCategory(s: LifeState): { cat: string; n?: number } {
  if (s.sadReunion) return { cat: "sadReunion" };
  const t = tokyoTime();
  const slot = timeSlot();
  // 連続3日以上なら 25% で連続日数ネタ
  if (s.streak >= 3 && Math.random() < 0.25) return { cat: "streak", n: s.streak };
  const r = Math.random();
  if (r < 0.40) return { cat: `greet.${slot}` };
  if (r < 0.55) return { cat: `dow.${t.dow}` };
  if (r < 0.65) return { cat: `month.${t.mo}` };
  if (r < 0.80) return { cat: "tips" };
  return { cat: "chat" };
}

// 放置中のひとりごと用カテゴリ
export function idleCategory(s: LifeState): string {
  const lv4 = s.bond >= 90;
  const r = Math.random();
  if (lv4 && r < 0.15) return "bond4";
  if (r < 0.55) return "solo";
  if (r < 0.8) return "chat";
  return "tips";
}
