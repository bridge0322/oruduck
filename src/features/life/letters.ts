// 犬からの月1手紙。前月の集計（monthSummary）を手紙文体に合成する。
import { callName } from "./lifeState";
import type { LifeState } from "./lifeState";
import { monthSummary } from "./diary";
import type { Record_ } from "../tracker/logic/persistence";

// "YYYY-MM" の前月
export function prevMonthKey(mk: string): string {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function letterText(s: LifeState, month: string, records: Record_[]): string {
  const sum = monthSummary(s, month, records);
  const name = callName(s);
  const [, m] = month.split("-");
  const lines = [
    `${name}へ`,
    "",
    `${+m}がつも いっしょに いてくれて ありがとう。`,
    `${sum.daysMet}にち あえて、なでなでを ${sum.pets}かい、`,
    `ぎゅ〜を ${sum.hugs}かい、おやつを ${sum.treats}こ もらったよ。`,
    sum.assetNote,
    "",
    "らいげつも まいにち あいに きてね。",
    "だいすきだよ。",
    "",
    "         あなたの ダックスフンドより 🐾",
  ];
  return lines.join("\n");
}
