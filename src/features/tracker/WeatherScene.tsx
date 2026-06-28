import { CorgiMascot } from "../../design-system/CorgiMascot";
import type { CrashState } from "./logic/feast";

export interface WeatherSceneProps {
  state: CrashState;
  height?: number;
}

export function WeatherScene({ state, height = 236 }: WeatherSceneProps) {
  const sky = ({
    cloudy: "linear-gradient(#DCE4EA 0%, #DCE4EA 62%, #C9C2B4 62%, #BFB7A6 100%)",
    rain: "linear-gradient(#C2CDD6 0%, #C2CDD6 62%, #AAB4A6 62%, #9FA897 100%)",
    rain2: "linear-gradient(#A9B6C2 0%, #A9B6C2 62%, #94A091 62%, #899583 100%)",
    storm: "linear-gradient(#8C97A6 0%, #8C97A6 62%, #7C8472 62%, #6F7768 100%)",
  } as Record<string, string>)[state.weather] || "linear-gradient(#FDEFD6 0%, #FDEFD6 62%, #E9C79B 62%, #E2BB89 100%)";
  const rainCount = state.weather === "rain" ? 28 : state.weather === "rain2" ? 44 : state.weather === "storm" ? 60 : 0;
  return (
    <div style={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: "var(--radius-card,24px)", border: "3px solid #F0E0C8", background: sky }}>
      {rainCount > 0 && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: rainCount }).map((_, i) => (
            <span key={i} style={{ position: "absolute", left: `${(i * 97) % 100}%`, top: `${-20 + (i * 37) % 60}%`, width: 2, height: 14, borderRadius: 2, background: "rgba(255,255,255,0.55)", animation: `rain-fall ${0.5 + ((i * 13) % 7) / 10}s linear ${(i % 9) / 10}s infinite` }} />
          ))}
        </div>
      )}
      {state.weather === "storm" && <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "flash 3.5s ease-in-out infinite", pointerEvents: "none" }} />}
      {state.bubble && (
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", maxWidth: "82%", background: "#fff", padding: "8px 14px", borderRadius: 16, fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", color: "var(--text-strong)", boxShadow: "var(--shadow-sm)", whiteSpace: "normal", textAlign: "center", lineHeight: 1.35, zIndex: 2 }}>
          {state.bubble}
          <span style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "8px solid #fff" }} />
        </div>
      )}
      <div style={{ position: "absolute", left: "50%", bottom: 6, transform: "translateX(-50%)", animation: "sway 3s ease-in-out infinite" }}>
        <CorgiMascot stage="adult" condition={state.mood} size={Math.min(170, height * 0.74)} />
      </div>
      <div style={{ position: "absolute", bottom: 10, left: 12, display: "flex", gap: 3, zIndex: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ fontSize: 15, opacity: i < state.level ? 1 : 0.28, filter: i < state.level ? "none" : "grayscale(1)" }}>💧</span>
        ))}
      </div>
    </div>
  );
}
