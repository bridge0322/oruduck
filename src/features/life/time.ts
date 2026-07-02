// Asia/Tokyo 基準の日付・時刻ユーティリティ。端末のタイムゾーン設定に依存しない。
// ?debug=1 のデバッグパネルから時間帯などを強制できるよう、上書きフックを持つ。

const TZ = "Asia/Tokyo";

export interface TokyoTime {
  y: number;   // 年
  mo: number;  // 月 1-12
  d: number;   // 日 1-31
  h: number;   // 時 0-23
  mi: number;  // 分
  dow: number; // 曜日 0(日)-6(土)
}

// デバッグ用の上書き。null なら実時刻を使う。
export interface TimeOverride {
  hour: number | null;
  weekend: boolean | null;
  fullMoon: boolean | null;
}
export const timeOverride: TimeOverride = { hour: null, weekend: null, fullMoon: null };

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
});
const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function tokyoTime(t = Date.now()): TokyoTime {
  const parts = fmt.formatToParts(new Date(t));
  const get = (k: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === k)?.value || "0";
  const raw: TokyoTime = {
    y: +get("year"), mo: +get("month"), d: +get("day"),
    h: +get("hour") % 24, mi: +get("minute"), dow: DOWS.indexOf(get("weekday")),
  };
  if (timeOverride.hour != null) raw.h = timeOverride.hour;
  if (timeOverride.weekend != null) raw.dow = timeOverride.weekend ? 6 : 2;
  return raw;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (t = Date.now()) => {
  const tt = tokyoTime(t);
  return `${tt.y}-${pad(tt.mo)}-${pad(tt.d)}`;
};
export const monthKey = (t = Date.now()) => {
  const tt = tokyoTime(t);
  return `${tt.y}-${pad(tt.mo)}`;
};
export const monthOfDay = (day: string) => day.slice(0, 7);

// "YYYY-MM-DD" 同士の日数差（a - b）
export function diffDays(a: string, b: string): number {
  const p = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(a) - p(b)) / 86400000);
}

export type TimeSlot = "morning" | "day" | "evening" | "late";
export function timeSlot(t = Date.now()): TimeSlot {
  const h = tokyoTime(t).h;
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 23) return "evening";
  return "late"; // 23-5
}

export const isWeekend = (t = Date.now()) => {
  const dow = tokyoTime(t).dow;
  return dow === 0 || dow === 6;
};

export type Season = "spring" | "summer" | "autumn" | "winter";
export function season(t = Date.now()): Season {
  const mo = tokyoTime(t).mo;
  if (mo >= 3 && mo <= 5) return "spring";
  if (mo >= 6 && mo <= 8) return "summer";
  if (mo >= 9 && mo <= 11) return "autumn";
  return "winter";
}

// 月齢（0〜29.53）。2000-01-06 18:14 UTC の新月を基準にした簡易計算。
const SYNODIC = 29.530588853;
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14);
export function moonAge(t = Date.now()): number {
  const days = (t - NEW_MOON_REF) / 86400000;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC;
}
export function isFullMoon(t = Date.now()): boolean {
  if (timeOverride.fullMoon != null) return timeOverride.fullMoon;
  const age = moonAge(t);
  return age >= 13.77 && age <= 15.77;
}
