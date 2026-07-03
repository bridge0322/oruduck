// セリフの共通スキーマ。カテゴリ別ファイルはこの Line[] を default export する。
export type TimeOfDay = "morning" | "day" | "evening" | "late";
export type MoodKind = "genki" | "mattari" | "amae" | "itazura"; // 今日の気分
export type MarketTrend = "up" | "down" | "flat";
export type WeatherKind = "sunny" | "cloudy" | "rain" | "snow" | "wind";

export interface LineConditions {
  timeOfDay?: TimeOfDay[];
  weekday?: number[];        // 0(日)-6(土)
  month?: number[];          // 1-12
  mood?: MoodKind[];
  affectionLv?: number[];    // 1-4
  weather?: WeatherKind[];
  marketTrend?: MarketTrend[];
  minStreak?: number;
}

export interface Line {
  id: string;
  text: string;
  category: string;
  conditions?: LineConditions;
  weight?: number;           // 既定1。大きいほど選ばれやすい
  rare?: boolean;            // 出現率を下げる隠しセリフ
}

// 生の文字列配列を Line[] に変換するヘルパー（記述量を抑えつつオブジェクト形式で集約）。
export function build(
  category: string,
  idPrefix: string,
  texts: string[],
  conditions?: LineConditions,
  opts?: { weight?: number; rare?: boolean },
): Line[] {
  return texts.map((text, i) => ({
    id: `${idPrefix}-${String(i + 1).padStart(3, "0")}`,
    text,
    category,
    ...(conditions ? { conditions } : {}),
    ...(opts?.weight != null ? { weight: opts.weight } : {}),
    ...(opts?.rare ? { rare: true } : {}),
  }));
}
