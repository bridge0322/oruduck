// DialogueEngine v2：条件マッチング＋重み付きランダム＋30日重複回避＋明日の予告。
// 2,050本の ALL_LINES から、現在の文脈（時間帯/曜日/月/気分/なつき度/天気/相場/連続）で
// 候補を絞り、最近30日に出していないものを優先して1本選ぶ。
import { ALL_LINES } from "./dialogues/index";
import type { Line, MarketTrend, MoodKind, TimeOfDay, WeatherKind } from "./dialogues/types";
import { bondLevel, callName } from "./lifeState";
import type { LifeState } from "./lifeState";
import { diffDays } from "./time";

export interface DialogueContext {
  timeOfDay: TimeOfDay;
  weekday: number;       // 0-6
  month: number;         // 1-12
  affectionLv: 1 | 2 | 3 | 4;
  streak: number;
  mood?: MoodKind;
  weather?: WeatherKind;
  marketTrend?: MarketTrend;
}

// カテゴリ索引（起動時に一度だけ構築）
const BY_CAT = new Map<string, Line[]>();
for (const l of ALL_LINES) {
  const arr = BY_CAT.get(l.category);
  if (arr) arr.push(l); else BY_CAT.set(l.category, [l]);
}

// そのカテゴリが V2 プールに存在するか（無ければ呼び出し側は旧POOLへフォールバック）
export const hasV2Category = (cat: string): boolean => BY_CAT.has(cat);

function matches(line: Line, ctx: DialogueContext): boolean {
  const c = line.conditions;
  if (!c) return true;
  if (c.timeOfDay && !c.timeOfDay.includes(ctx.timeOfDay)) return false;
  if (c.weekday && !c.weekday.includes(ctx.weekday)) return false;
  if (c.month && !c.month.includes(ctx.month)) return false;
  if (c.affectionLv && !c.affectionLv.includes(ctx.affectionLv)) return false;
  if (c.mood && (!ctx.mood || !c.mood.includes(ctx.mood))) return false;
  if (c.weather && (!ctx.weather || !c.weather.includes(ctx.weather))) return false;
  if (c.marketTrend && (!ctx.marketTrend || !c.marketTrend.includes(ctx.marketTrend))) return false;
  if (c.minStreak != null && ctx.streak < c.minStreak) return false;
  return true;
}

export interface FillVars { n?: number; streak?: number; month?: number }

export function fillVars(text: string, s: LifeState, v?: FillVars): string {
  return text
    .replaceAll("{name}", callName(s))
    .replaceAll("{n}", v?.n != null ? String(v.n) : "")
    .replaceAll("{streak}", v?.streak != null ? String(v.streak) : String(s.streak))
    .replaceAll("{month}", v?.month != null ? String(v.month) : "");
}

function weightOf(l: Line): number {
  return (l.weight ?? 1) * (l.rare ? 0.12 : 1);
}

function weightedPick(lines: Line[]): Line | null {
  if (!lines.length) return null;
  let total = 0;
  for (const l of lines) total += weightOf(l);
  let r = Math.random() * total;
  for (const l of lines) { r -= weightOf(l); if (r <= 0) return l; }
  return lines[lines.length - 1];
}

export interface Picked { id: string; text: string }

// categories のプールから条件に合う1本を、30日以内未使用を優先して選ぶ。
export function pickV2(
  s: LifeState, categories: string[], ctx: DialogueContext, vars?: FillVars,
): Picked | null {
  const used = new Set((s.usedLinesV2 || []).map((u) => u.id));
  let pool: Line[] = [];
  for (const cat of categories) {
    const arr = BY_CAT.get(cat);
    if (arr) pool = pool.concat(arr);
  }
  pool = pool.filter((l) => matches(l, ctx));
  if (!pool.length) return null;
  let fresh = pool.filter((l) => !used.has(l.id));
  if (!fresh.length) fresh = pool; // 全部使い切ったら解禁
  const line = weightedPick(fresh);
  if (!line) return null;
  return { id: line.id, text: fillVars(line.text, s, vars) };
}

// 使用済み記録：30日より古いものを掃除し、上限2,000でLRU（先頭=古い）削除。
const DEDUP_DAYS = 30;
const DEDUP_CAP = 2000;
export function markUsedV2(s: LifeState, id: string, today: string): LifeState {
  const list = (s.usedLinesV2 || []).filter((u) => diffDays(today, u.day) < DEDUP_DAYS && u.id !== id);
  list.push({ id, day: today });
  if (list.length > DEDUP_CAP) list.splice(0, list.length - DEDUP_CAP);
  return { ...s, usedLinesV2: list };
}

// なつき度→Lv（1-4）
export const affectionLvOf = (s: LifeState): 1 | 2 | 3 | 4 => bondLevel(s.bond);

// ---- 明日の予告ペア管理 ----
// 予告を出したら pendingTomorrow に翌日日付を保存し、翌日の初回訪問で
// 対応するフォローアップから会話を始める。
export const TOMORROW_FOLLOWUPS = [
  "きのう はなすって いってた こと、おぼえてる？ えへへ",
  "やくそくの つづき、はなそっか",
  "きのうの おはなしの つづき だよ",
  "また あえたね！ きのうの つづき しよ",
  "きのう いってた こと、きょう はなすね",
];

export function pickTomorrowFollowup(s: LifeState): Picked {
  const i = Math.floor(Math.random() * TOMORROW_FOLLOWUPS.length);
  return { id: `tmf-${i}`, text: fillVars(TOMORROW_FOLLOWUPS[i], s) };
}
