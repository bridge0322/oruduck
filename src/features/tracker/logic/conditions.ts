export interface Condition {
  key: "thriving" | "happy" | "normal" | "down" | "cold";
  label: string;
  min: number;
  note: string;
}

export const CONDITIONS: Condition[] = [
  { key: "thriving", label: "ぽかぽか", min: 15, note: "絶好調！ごきげんすぎる" },
  { key: "happy", label: "ごきげん", min: 3, note: "いい調子で見守り中" },
  { key: "normal", label: "ふつう", min: -3, note: "のんびりおだやか" },
  { key: "down", label: "しょんぼり", min: -15, note: "ちょっと寒そう。長い目で見守ろう" },
  { key: "cold", label: "さむがり", min: -Infinity, note: "震えてる…でも積立は続けよう" },
];

export function condFor(pct: number): Condition {
  return CONDITIONS.find((c) => pct >= c.min) || CONDITIONS[CONDITIONS.length - 1];
}

export function condTone(k: Condition["key"]): "positive" | "neutral" | "negative" {
  return k === "thriving" || k === "happy" ? "positive" : k === "normal" ? "neutral" : "negative";
}
