import type { Record_, Feast } from "./persistence";

export function peakOf(records: Record_[]): number {
  return records.reduce((m, r) => Math.max(m, r.value), 0);
}

export interface Food {
  rank: number;
  name: string;
  emoji: string;
  xp: number;
  gold?: boolean;
}

// 毎日のごはん。お金は動かさない。あげるたびにランダムで1つ選ばれる。
export const FOODS: Food[] = [
  { rank: 1, name: "ドッグフード", emoji: "🥫", xp: 30 },
  { rank: 1, name: "ビスケット", emoji: "🍪", xp: 30 },
  { rank: 2, name: "チキン", emoji: "🍗", xp: 50 },
  { rank: 2, name: "ジャーキー", emoji: "🥓", xp: 50 },
  { rank: 2, name: "おさかな", emoji: "🐟", xp: 50 },
  { rank: 3, name: "ステーキ", emoji: "🥩", xp: 90 },
  { rank: 3, name: "プリン", emoji: "🍮", xp: 90 },
  { rank: 4, name: "黄金の骨", emoji: "🦴", xp: 200, gold: true },
];

// レア「黄金の骨」は出にくく。出たときの特別感を演出。
export function pickFood(): Food {
  const r = Math.random();
  const pool = r < 0.07 ? FOODS.filter((f) => f.gold) : FOODS.filter((f) => !f.gold);
  return pool[Math.floor(Math.random() * pool.length)];
}

export type Weather = "sunny" | "cloudy" | "rain" | "rain2" | "storm";
export type Mood = "happy" | "normal" | "down" | "cold";

export interface CrashState {
  dd: number;
  level: number;
  weather: Weather;
  mood: Mood;
  label: string;
  bubble: string | null;
}

// 相場のお天気（直近高値からの下落率で決まる。自分ではコントロールできない＝そのまま見守る）。
export function crashState(value: number, peak: number): CrashState {
  const dd = peak > 0 ? ((value - peak) / peak) * 100 : 0;
  if (dd > -10) return { dd, level: 0, weather: "sunny", mood: "happy", label: "はれ", bubble: null };
  if (dd > -20) return { dd, level: 1, weather: "cloudy", mood: "normal", label: "くもり", bubble: "くもりぞら…でも へいきワン" };
  if (dd > -30) return { dd, level: 2, weather: "rain", mood: "down", label: "あめ", bubble: "あめがふってきたワン" };
  if (dd > -40) return { dd, level: 3, weather: "rain2", mood: "down", label: "おおあめ", bubble: "ザーザーぶりワン…" };
  return { dd, level: 4, weather: "storm", mood: "cold", label: "あらし", bubble: "あらしだ…でも まってればやむワン" };
}

// あげた後のリアクション（たくさん用意：毎日「今日はどれかな」と開きたくなるように）。
export const THANKS = [
  "ありがとうワン！", "元気になったワン！", "もっと大きくなるワン！",
  "ごちそう最高ワン！", "げんき100ばいワン！", "また食べたいワン！",
  "しあわせワンッ！", "つよくなった気がするワン！",
  "きょうもおいしいワン！", "しっぽ とまらないワン！",
  "ぺろり ごちそうさまワン！", "おかわり…なんてね ワン！",
  "むねが あったかいワン！", "きみが だいすきワン！",
  "まいにち たのしいワン！", "ぽかぽか するワン〜",
  "ちからが みなぎるワン！", "ふくふく まんぷくワン！",
  "あしたも まってるワン！", "なかよし だワン！",
  "ぴかぴか きぶんワン！", "おなか いっぱいワン！",
  "うれしくて まわっちゃうワン！", "ほっぺ おちるワン！",
  "きみと いると あんしんワン！", "ずっと いっしょワン！",
  "ごきげん さいこうワン！", "おいしさ メモリーワン！",
  "ぱわー チャージ かんりょうワン！", "きょうの ベストおやつワン！",
  "むちゅうで たべちゃったワン！", "しあわせ かみしめてるワン！",
  "これは うまうまワン！", "もう さいこうワンッ！",
  "きみは てんさいワン！", "また あえて うれしいワン！",
  "げんき もりもりワン！", "たのしみが ふえたワン！",
  "おやつ ばんざいワン！", "こころが ぽかぽかワン！",
  "ぜんぶ たべたワン！", "おいしくて なみだ でそうワン！",
  "きょうも いいひワン！", "げんきの みなもとワン！",
  "ありがとが とまらないワン！", "きみの やさしさ あじがするワン！",
  "ふわふわ きぶんワン！", "もぐもぐ しあわせワン！",
  "たべると わくわくワン！", "また あした おねがいワン！",
  "おなかも こころも まんぷくワン！", "きみが いてくれて よかったワン！",
  "きょうの ごほうびワン！", "うきうき とまらないワン！",
  "まんぞく まんてんワン！", "おいしさ ばくはつワン！",
  "げんき チャージ オッケーワン！", "しっぽ ぶんぶんワン！",
  "たべて にっこりワン！", "きみと たべると もっとおいしいワン！",
  "きょうも がんばれそうワン！", "ほっと ひといきワン！",
  "たからもの みたいな あじワン！", "もっと なかよく なれそうワン！",
  "おなかが よろこんでるワン！", "げんきいっぱい ありがとうワン！",
  "ぜっこうちょうワン！", "たべて げんき チャージワン！",
  "まいにち あいたいワン！", "きみの ことが だいすきワン！",
  "おいしくて しあわせワン！", "ぽよぽよ きぶんワン！",
  "きょうも たべられて うれしいワン！", "やさしさ ごちそうさまワン！",
  "むねいっぱい ありがとうワン！", "また あそぼうワン！",
  "おやつ パワー まんたんワン！", "きみと いっしょが いちばんワン！",
  "こんなに おいしいの はじめてワン！", "げんき あふれてくるワン！",
  "たべて ほっこりワン！", "きょうも すてきな ひワン！",
  "しあわせ こぼれちゃうワン！", "ありがとうの きもち いっぱいワン！",
  "また げんきに なれたワン！", "きみの えがおが ごちそうワン！",
  "おいしさ わすれられないワン！", "もぐもぐ たのしいワン！",
  "まんぷくで ねむくなるワン…", "きょうも あえて しあわせワン！",
  "げんきの おすそわけ ありがとうワン！", "たべて ぽかぽかワン！",
  "きみと ずっと いたいワン！", "おやつタイム さいこうワン！",
  "こころまで まんぷくワン！", "また あした たべたいワン！",
  "げんきもりもり ありがとうワン！", "しっぽが よろこんでるワン！",
  "きみが いちばん だいすきワン！", "きょうも おいしくて しあわせワン！",
];

// レア「黄金の骨」専用の特別リアクション。
export const GOLD_THANKS = [
  "でたー！ おうごんの ほねワン！！",
  "きょうは とくべつな ひワン！✨",
  "ぴかぴか…たからものワン！",
  "こうふん さめやらぬワン！！",
  "ラッキー きわまれりワン！🌟",
];

export const pickThanks = () => THANKS[Math.floor(Math.random() * THANKS.length)];
export const pickGoldThanks = () => GOLD_THANKS[Math.floor(Math.random() * GOLD_THANKS.length)];

export const xpLevel = (xp: number) => Math.floor(xp / 300) + 1;
export const xpInLevel = (xp: number) => xp % 300;

// ---- 1日1回のごはん判定 ----
const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function canFeedToday(lastFed: number | null | undefined): boolean {
  if (!lastFed) return true;
  return dayKey(lastFed) !== dayKey(Date.now());
}

// 連続であげている日数（きょう or きのう あげていれば継続）。
export function feedStreak(feasts: Feast[]): number {
  if (!feasts.length) return 0;
  const days = Array.from(new Set(feasts.map((f) => dayKey(f.t))));
  const has = (t: number) => days.includes(dayKey(t));
  const now = Date.now(), day = 86400000;
  // きょう or きのう にあげていなければ連続は途切れている。
  let cursor = has(now) ? now : has(now - day) ? now - day : null;
  if (cursor == null) return 0;
  let streak = 0;
  while (has(cursor)) {
    streak++;
    cursor -= day;
  }
  return streak;
}
