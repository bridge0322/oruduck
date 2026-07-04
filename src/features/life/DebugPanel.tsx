import { useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { timeOverride } from "./time";
import { clampBond } from "./lifeState";
import type { LifeState } from "./lifeState";
import { poolSize } from "./dialogues";
import { setMoodOverride } from "./mood";
import { setWeatherOverride } from "./weatherApi";
import type { MoodKind, WeatherKind } from "./dialogues/types";

// ?debug=1 のときだけ出る開発用パネル。
// 時間帯の強制・レア演出の強制発火・なつき度の変更・各種リセットができる。

export const isDebug = () => new URLSearchParams(location.search).get("debug") === "1";

const fire = (detail: Record<string, unknown>) =>
  window.dispatchEvent(new CustomEvent("oruduck-debug", { detail }));

export interface DebugPanelProps {
  life: LifeState;
  setLife: Dispatch<SetStateAction<LifeState>>;
}

export function DebugPanel({ life, setLife }: DebugPanelProps) {
  const [open, setOpen] = useState(false);
  const [, bump] = useState(0);

  const btn: CSSProperties = {
    padding: "6px 10px", borderRadius: 8, border: "1px solid #999", background: "#fff",
    fontSize: 11, fontFamily: "monospace", cursor: "pointer",
  };
  const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" };
  const label: CSSProperties = { fontSize: 10, fontWeight: 700, color: "#555", width: "100%" };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        style={{ position: "fixed", bottom: 90, left: 8, zIndex: 90, ...btn, background: "#333", color: "#0f0" }}>
        🛠 debug
      </button>
    );
  }

  const setHour = (h: number | null) => { timeOverride.hour = h; fire({}); bump((v) => v + 1); };

  return (
    <div style={{ position: "fixed", bottom: 76, left: 8, zIndex: 90, width: 250, maxHeight: "60vh", overflowY: "auto", background: "rgba(255,255,255,0.97)", border: "2px solid #333", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 8, fontFamily: "monospace" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}>
        <span>🛠 debug（セリフ{poolSize()}本）</span>
        <button type="button" aria-label="close-debug" style={btn} onClick={() => setOpen(false)}>×</button>
      </div>

      <div style={row}>
        <span style={label}>時間帯（Asia/Tokyo 強制）</span>
        <button type="button" style={btn} onClick={() => setHour(null)}>実時刻</button>
        <button type="button" style={btn} onClick={() => setHour(7)}>朝7時</button>
        <button type="button" style={btn} onClick={() => setHour(13)}>昼13時</button>
        <button type="button" style={btn} onClick={() => setHour(17)}>夕17時</button>
        <button type="button" style={btn} onClick={() => setHour(21)}>夜21時</button>
        <button type="button" style={btn} onClick={() => setHour(1)}>深夜1時</button>
        <span style={{ fontSize: 10 }}>now: {timeOverride.hour ?? "real"}</span>
      </div>

      <div style={row}>
        <span style={label}>今日の気分（強制）</span>
        <button type="button" style={btn} onClick={() => { setMoodOverride(null); fire({}); }}>自動</button>
        {(["genki", "mattari", "amae", "itazura"] as MoodKind[]).map((m) => (
          <button key={m} type="button" style={btn} onClick={() => { setMoodOverride(m); fire({}); }}>
            {m === "genki" ? "元気" : m === "mattari" ? "まったり" : m === "amae" ? "甘え" : "いたずら"}
          </button>
        ))}
      </div>

      <div style={row}>
        <span style={label}>天気（強制）</span>
        <button type="button" style={btn} onClick={() => { setWeatherOverride(null); fire({ weather: "" }); }}>自動</button>
        {(["sunny", "cloudy", "rain", "snow", "wind"] as WeatherKind[]).map((w) => (
          <button key={w} type="button" style={btn} onClick={() => { setWeatherOverride(w); fire({ weather: w }); }}>
            {w === "sunny" ? "晴" : w === "cloudy" ? "曇" : w === "rain" ? "雨" : w === "snow" ? "雪" : "風"}
          </button>
        ))}
      </div>

      <div style={row}>
        <span style={label}>曜日・月齢</span>
        <button type="button" style={btn} onClick={() => { timeOverride.weekend = timeOverride.weekend ? null : true; fire({}); bump((v) => v + 1); }}>
          週末: {timeOverride.weekend ? "ON" : "off"}
        </button>
        <button type="button" style={btn} onClick={() => { timeOverride.fullMoon = timeOverride.fullMoon ? null : true; fire({}); bump((v) => v + 1); }}>
          満月: {timeOverride.fullMoon ? "ON" : "off"}
        </button>
      </div>

      <div style={row}>
        <span style={label}>レア演出を強制発火</span>
        <button type="button" style={btn} onClick={() => fire({ rare: "butterfly" })}>🦋</button>
        <button type="button" style={btn} onClick={() => fire({ rare: "star" })}>🌠</button>
        <button type="button" style={btn} onClick={() => fire({ rare: "twins" })}>🐶🐶</button>
        <button type="button" style={btn} onClick={() => fire({ rare: "moon" })}>🌕</button>
        <button type="button" style={btn} onClick={() => setLife((s) => ({ ...s, todayRare: s.todayRare === "rainbow" ? null : "rainbow" }))}>🌈毛 {life.todayRare === "rainbow" ? "ON" : ""}</button>
      </div>

      <div style={row}>
        <span style={label}>演出</span>
        <button type="button" style={btn} onClick={() => fire({ settle: true })}>🎉つみたて</button>
        <button type="button" style={btn} onClick={() => fire({ market: "up" })}>📈ドヤ</button>
        <button type="button" style={btn} onClick={() => fire({ market: "down" })}>📉なぐさめ</button>
        <button type="button" style={btn} onClick={() => fire({ visitor: "cat" })}>🐱来訪</button>
        <button type="button" style={btn} onClick={() => fire({ visitor: "bird" })}>🐦来訪</button>
        <button type="button" style={btn} onClick={() => fire({ sleep: true })}>😴寝かす</button>
        <button type="button" style={btn} onClick={() => fire({ replay: true })}>🐕入場リプレイ</button>
        <button type="button" style={btn} onClick={() => fire({ milestone: 100 })}>💯節目100</button>
        <button type="button" style={btn} onClick={() => fire({ milestone: 1000 })}>🌈節目1000</button>
        <button type="button" style={btn} onClick={() => fire({ jackpot: 1111111 })}>🎰ゾロ目</button>
        <button type="button" style={btn} onClick={() => fire({ jackpot: 3000000 })}>🎰キリ番</button>
        <button type="button" style={btn} onClick={() => fire({ award: true })}>🏅表彰</button>
      </div>

      <div style={row}>
        <span style={label}>なつき度: {life.bond}</span>
        <input type="range" min={0} max={100} value={life.bond} style={{ width: "100%" }}
          onChange={(e) => setLife((s) => ({ ...s, bond: clampBond(+e.target.value) }))} />
        <button type="button" style={btn} onClick={() => setLife((s) => ({ ...s, today: { ...s.today, treats: 0 } }))}>おやつ回復</button>
        <button type="button" style={btn} onClick={() => setLife((s) => ({ ...s, bondPetToday: 0 }))}>なで上限解除</button>
        <button type="button" style={btn} onClick={() => setLife((s) => ({ ...s, sadReunion: true }))}>しょんぼり再会</button>
        <button type="button" style={btn} onClick={() => setLife((s) => ({ ...s, usedLines: [] }))}>セリフ履歴クリア</button>
      </div>

      <div style={row}>
        <span style={label}>ストリーク: {life.streak} / 訪問 {life.visitDayCount}日</span>
        <button type="button" style={btn} onClick={() => setLife((s) => ({ ...s, streak: 7 }))}>連続7日</button>
        <button type="button" style={btn} onClick={() => setLife((s) => ({ ...s, streak: 30 }))}>連続30日</button>
        <button type="button" style={btn} onClick={() => { localStorage.removeItem("oruduck_life_v1"); location.reload(); }}>⚠️生活データ初期化</button>
      </div>
    </div>
  );
}
