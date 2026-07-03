// 天気連動。Open-Meteo（無料・キー不要）で東京の当日天気を取得し1時間キャッシュ。
// オフライン/失敗時は前回値、無ければ晴れ扱い。
import type { WeatherKind } from "./dialogues/types";

const KEY = "oruduck_weather_v1";

export let weatherOverride: WeatherKind | null = null;
export const setWeatherOverride = (w: WeatherKind | null) => { weatherOverride = w; };

// WMO weather_code → アプリの天気種別。強風は風を優先。
function codeToKind(code: number, windKmh: number): WeatherKind {
  if (windKmh >= 32) return "wind";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  if (code >= 2) return "cloudy";
  return "sunny";
}

interface Cache { t: number; kind: WeatherKind }
function readCache(): Cache | null {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as Cache; } catch { /* ignore */ }
  return null;
}

export function cachedWeather(): WeatherKind | null {
  if (weatherOverride) return weatherOverride;
  return readCache()?.kind ?? null;
}

export async function fetchWeather(): Promise<WeatherKind> {
  if (weatherOverride) return weatherOverride;
  const c = readCache();
  if (c && Date.now() - c.t < 3600000) return c.kind; // 1時間以内はキャッシュ
  try {
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.69&current=weather_code,wind_speed_10m&timezone=Asia%2FTokyo");
    const j = await res.json();
    const kind = codeToKind(Number(j?.current?.weather_code ?? 0), Number(j?.current?.wind_speed_10m ?? 0));
    try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), kind })); } catch { /* ignore */ }
    return kind;
  } catch {
    return c?.kind ?? "sunny"; // オフライン：前回値
  }
}
