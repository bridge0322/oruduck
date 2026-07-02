// ひとこと日記。その日の記録（DayStats）からテンプレート合成で1行を作る。
// 同じ日はいつ見ても同じ文になるよう、日付のハッシュでテンプレートを選ぶ。
import type { DayStats, LifeState, RareKind } from "./lifeState";
import { callName } from "./lifeState";
import { monthOfDay } from "./time";

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}
const pick = <T,>(arr: T[], seed: number): T => arr[seed % arr.length];

const RARE_TEXT: Record<RareKind, string> = {
  butterfly: "ちょうちょと かけっこした。",
  star: "ながれぼしに おねがいごとを した。",
  twins: "そっくりな ともだちが あそびに きた。",
  moon: "まんげつに むかって うたった。",
  rainbow: "きょうの ぼくは にじいろだった。",
};

// 1日ぶんの日記を合成する
export function diaryLine(day: DayStats, s: LifeState): string {
  const seed = hash(day.day);
  const name = callName(s);
  const parts: string[] = [];

  if (day.rare) parts.push(RARE_TEXT[day.rare]);
  if (day.settle) parts.push("つみたての ひ だった。えらかった。");

  if (day.pets >= 8) parts.push(pick([
    `${name}に いっぱい なでてもらった。しあわせ。`,
    `なでなでの あめが ふった ひ。とろけた。`,
  ], seed));
  else if (day.pets > 0) parts.push(pick([
    `${name}に なでてもらった。うれしかった。`,
    `あたまを なでられて しっぽが ゆれた。`,
  ], seed >> 2));

  if (day.hugs > 0) parts.push("ぎゅーっと してもらった。あったかかった。");

  if (day.treats >= 3) parts.push("おやつを 3かいも もらって おなか ぽんぽこ。");
  else if (day.treats > 0) parts.push(pick([
    "ほねビスケットを もらった。おいしかった。",
    "おやつを きゃっちできた。じまんしたい。",
  ], seed >> 4));

  if (day.market === "down") parts.push(pick([
    "そうばは あめもよう。でも ぼくらは へいき。",
    "すこし さがった ひ。ながいめで みるって きめた。",
  ], seed >> 6));
  else if (day.market === "up") parts.push(pick([
    "そうばは はれ。ちょっと どやがおを した。",
    "ふえてて うれしい ひ だった。",
  ], seed >> 6));

  if (!parts.length) parts.push(pick([
    `きょうも ${name}を まってた。あえて よかった。`,
    "なんでもない いちにち。それが いちばん。",
    "ひなたぼっこ して ねて おきたら ゆうがた だった。",
    "くさの においを いっぱい かいだ。いいひ。",
    `${name}の ことを かんがえて すごした。`,
  ], seed >> 3));

  return parts.slice(0, 2).join(" ");
}

export interface MonthSummary {
  month: string;        // YYYY-MM
  daysMet: number;
  pets: number;
  hugs: number;
  treats: number;
  assetNote: string;    // 資産の変化ひとこと
}

// 「今月のわたしたち」サマリー
export function monthSummary(
  s: LifeState, month: string,
  records: { t: number; value: number }[],
): MonthSummary {
  const days = [...s.history, s.today].filter((d) => monthOfDay(d.day) === month);
  const daysMet = new Set(days.map((d) => d.day)).size;
  const pets = days.reduce((n, d) => n + d.pets, 0);
  const hugs = days.reduce((n, d) => n + d.hugs, 0);
  const treats = days.reduce((n, d) => n + d.treats, 0);

  // 月内の評価額の変化
  const inMonth = records.filter((r) => {
    const d = new Date(r.t);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return mk === month;
  });
  let assetNote = "しさんは のんびり おるすばん。";
  if (inMonth.length >= 2) {
    const diff = inMonth[inMonth.length - 1].value - inMonth[0].value;
    if (diff > 0) assetNote = "しさんは すこし そだった。こつこつの ちからだね。";
    else if (diff < 0) assetNote = "しさんは ひとやすみ。たねまきの きせつだって。";
    else assetNote = "しさんは かわらず げんき。";
  } else if (inMonth.length === 1) {
    assetNote = "きろくを ひとつ つけた つき だった。";
  }
  return { month, daysMet, pets, hugs, treats, assetNote };
}
