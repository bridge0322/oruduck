// 曜日イベント：「◯曜日は◯◯の日」。毎日かならず何かのテーマがあるので、
// 開く固有の理由になり、明日の予告のネタ（予告倒れしない）にも使える。
// 宣言（1日1回のセリフ）＋小さな実利ボーナスのセット。

export interface WeekdayTheme {
  label: string;  // 「◯◯の ひ」
  emoji: string;
  line: string;   // 宣言のひとこと
  preview: string; // 前日の予告文
}

// index = tokyoTime().dow（0=日曜）
export const WEEKDAYS: WeekdayTheme[] = [
  { label: "のんびりの ひ", emoji: "🍵", line: "きょうは いっしょに ゆっくり しよ〜", preview: "あしたは のんびりの ひ。いっしょに まったり しようね" },
  { label: "なでなでの ひ", emoji: "🖐️", line: "いつもより いっぱい なでてほしいな", preview: "あしたは なでなでの ひ！ いっぱい なでてもらうんだ" },
  { label: "かけっこの ひ", emoji: "🎾", line: "ボールキャッチで ハートが でちゃう！", preview: "あしたは かけっこの ひ！ ボールあそび しようね" },
  { label: "ブラッシングの ひ", emoji: "🪮", line: "ブラシしてくれたら なかよし 2ばいだよ", preview: "あしたは ブラッシングの ひ。ふわふわに してほしいな" },
  { label: "おやつの ひ", emoji: "🦴", line: "きょうの おやつは とくべつ おいしいんだ", preview: "あしたは おやつの ひ！ たのしみで ねむれない…" },
  { label: "げいの ひ", emoji: "🎓", line: "げいを みせたい きぶん！ ごうれい かけて？", preview: "あしたは げいの ひ。かっこいいとこ みせるからね" },
  { label: "おでかけの ひ", emoji: "🧣", line: "おともだちが あそびに きやすい ひ なんだって", preview: "あしたは おでかけの ひ。だれか あそびに くるかも！" },
];

export const weekdayOf = (dow: number): WeekdayTheme => WEEKDAYS[((dow % 7) + 7) % 7];
