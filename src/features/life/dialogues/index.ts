// カテゴリ別セリフファイルを import で集約する。完成したものから順に追加していく。
// 目標配分（合計2,050本以上）：
//  greetings 240 / weekdays 140 / seasonal 240 / moods 320 / knowledge 150 /
//  market 120 / affection 160 / weather 100 / murmurs 120 / reactions 200 /
//  streaks 100 / sleeptalk 60 / tomorrow 60 / rare 40
import { greetings } from "./greetings";
import { weekdays } from "./weekdays";
import { seasonal } from "./seasonal";
import type { Line } from "./types";

export const ALL_LINES: Line[] = [
  ...greetings,
  ...weekdays,
  ...seasonal,
];

// カテゴリごとの本数（デバッグ表示・検品用）
export function countByCategory(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const l of ALL_LINES) m[l.category] = (m[l.category] || 0) + 1;
  return m;
}
export const totalLines = () => ALL_LINES.length;

export type { Line } from "./types";
