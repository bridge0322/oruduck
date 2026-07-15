// 今日の気分。毎朝5時に日付シードで抽選（同日は固定）。元気/まったり/甘えん坊/いたずら。
import type { MoodKind } from "./dialogues/types";
import { tokyoTime } from "./time";

export const MOODS: { key: MoodKind; label: string; emoji: string }[] = [
  { key: "genki", label: "げんき", emoji: "⚡" },
  { key: "mattari", label: "まったり", emoji: "🍃" },
  { key: "amae", label: "あまえんぼ", emoji: "💕" },
  { key: "itazura", label: "いたずら", emoji: "😜" },
];
export const moodMeta = (m: MoodKind) => MOODS.find((x) => x.key === m) || MOODS[0];

// デバッグ用の一時上書き
export let moodOverride: MoodKind | null = null;
export const setMoodOverride = (m: MoodKind | null) => { moodOverride = m; };

// 5時境界の「気分の日」キー（5時より前は前日扱い）。timeOverride にも追従する。
export function moodDayKey(t = Date.now()): string {
  const tt = tokyoTime(t);
  let y = tt.y, mo = tt.mo, d = tt.d;
  if (tt.h < 5) {
    const dt = new Date(Date.UTC(y, mo - 1, d));
    dt.setUTCDate(dt.getUTCDate() - 1);
    y = dt.getUTCFullYear(); mo = dt.getUTCMonth() + 1; d = dt.getUTCDate();
  }
  return `${y}-${mo}-${d}`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---- 性格（うちに来たときから決まっている、その子の個性） ----
export type Personality = "amaenbo" | "yancha" | "nonbiri";
export const PERSONALITIES: { key: Personality; label: string; emoji: string; desc: string }[] = [
  { key: "amaenbo", label: "あまえんぼ", emoji: "💞", desc: "くっつくのが だいすき。あまえた気分の日が おおい" },
  { key: "yancha", label: "やんちゃ", emoji: "🌀", desc: "あそぶの だいすき。しっぽも ぶんぶん はやい" },
  { key: "nonbiri", label: "のんびりや", emoji: "🍵", desc: "マイペースで おだやか。おひるねが とくい" },
];
export const personalityMeta = (p: Personality) => PERSONALITIES.find((x) => x.key === p) || PERSONALITIES[0];

// 名前＋お迎え日から決定的に1つ固定（引き継いでも同じ子は同じ性格）。
export function rollPersonality(seed: string): Personality {
  return PERSONALITIES[hash("pers:" + seed) % PERSONALITIES.length].key;
}

// 今日の気分。性格があると、その子の得意な気分が出やすくなる（重み付き・同日固定）。
export function todayMood(t = Date.now(), p: Personality | null = null): MoodKind {
  if (moodOverride) return moodOverride;
  const pool: MoodKind[] = ["genki", "mattari", "amae", "itazura"];
  if (p === "amaenbo") pool.push("amae", "amae");
  if (p === "yancha") pool.push("genki", "itazura");
  if (p === "nonbiri") pool.push("mattari", "mattari");
  return pool[hash("mood:" + moodDayKey(t)) % pool.length];
}
