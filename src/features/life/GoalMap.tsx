import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { LifeState } from "./lifeState";
import { LifeCorgi } from "./LifeCorgi";

// 目標進捗お散歩マップ。目標額に対する積立累計の進捗を横スクロールのコースに。
// 10%ごとにランドマーク、現在地に犬のピン。到達済みは記録する。
export interface GoalMapProps {
  principal: number;
  life: LifeState;
  setLife: Dispatch<SetStateAction<LifeState>>;
}

const LANDMARKS = [
  { p: 10, emoji: "🌳", name: "こうえん" },
  { p: 20, emoji: "🥐", name: "パンやさん" },
  { p: 30, emoji: "🌉", name: "はし" },
  { p: 40, emoji: "🌷", name: "おはなばたけ" },
  { p: 50, emoji: "🏞️", name: "みずうみ" },
  { p: 60, emoji: "🔭", name: "てんぼうだい" },
  { p: 70, emoji: "🌲", name: "もり" },
  { p: 80, emoji: "🌊", name: "たき" },
  { p: 90, emoji: "⛰️", name: "おか" },
  { p: 100, emoji: "🏁", name: "さんちょう" },
];
const TRACK_W = 1000;

export function GoalMap({ principal, life, setLife }: GoalMapProps) {
  const goal = life.goalAmount > 0 ? life.goalAmount : 1000000;
  const progress = Math.max(0, Math.min(100, (principal / goal) * 100));
  const scroller = useRef<HTMLDivElement>(null);

  // 到達済みランドマークを記録
  useEffect(() => {
    const reached = LANDMARKS.filter((l) => progress >= l.p).map((l) => l.p);
    const already = life.goalReached || [];
    const fresh = reached.filter((p) => !already.includes(p));
    if (fresh.length) setLife((s) => ({ ...s, goalReached: [...new Set([...(s.goalReached || []), ...reached])] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // 現在地までスクロール
  useEffect(() => {
    if (scroller.current) {
      const x = (progress / 100) * TRACK_W - scroller.current.clientWidth / 2;
      scroller.current.scrollTo({ left: Math.max(0, x), behavior: "smooth" });
    }
  }, [progress]);

  const dogX = (progress / 100) * TRACK_W;
  const roadY = (p: number) => 96 + Math.sin((p / 100) * Math.PI * 3) * 26; // うねる道

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>もくひょう ¥{goal.toLocaleString()}</span>
        <span style={{ fontFamily: "var(--font-number)", fontWeight: 900, fontSize: "var(--text-md)", color: "var(--text-brand)" }}>{progress.toFixed(1)}%</span>
      </div>
      <div ref={scroller} style={{ overflowX: "auto", overflowY: "hidden", borderRadius: "var(--radius-md)", background: "linear-gradient(#DCF0F8, #F3F7E9)", WebkitOverflowScrolling: "touch" }}>
        <div style={{ position: "relative", width: TRACK_W, height: 170 }}>
          <svg viewBox={`0 0 ${TRACK_W} 170`} width={TRACK_W} height={170} style={{ display: "block" }}>
            <path d={`M0 ${roadY(0)} ${LANDMARKS.map((l) => `L${(l.p / 100) * TRACK_W} ${roadY(l.p)}`).join(" ")}`} fill="none" stroke="#E9C79B" strokeWidth="16" strokeLinejoin="round" strokeLinecap="round" />
            <path d={`M0 ${roadY(0)} ${LANDMARKS.map((l) => `L${(l.p / 100) * TRACK_W} ${roadY(l.p)}`).join(" ")}`} fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="4 14" />
          </svg>
          {LANDMARKS.map((l) => {
            const reached = progress >= l.p;
            return (
              <div key={l.p} style={{ position: "absolute", left: (l.p / 100) * TRACK_W, top: roadY(l.p) - 44, transform: "translateX(-50%)", textAlign: "center", opacity: reached ? 1 : 0.4, filter: reached ? "none" : "grayscale(0.7)" }}>
                <div style={{ fontSize: 26 }}>{l.emoji}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: reached ? "var(--text-brand)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{l.name}</div>
                {reached && <div style={{ fontSize: 9 }}>✓</div>}
              </div>
            );
          })}
          {/* 犬のピン */}
          <div style={{ position: "absolute", left: dogX, top: roadY(progress) - 46, width: 46, height: 46, transform: "translateX(-50%)", pointerEvents: "none" }}>
            <LifeCorgi level={8} pose="sit" legPhase={0} tailWag={12} eyes="happy" mouth="tongue" />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 6, fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}>
        よこに スクロールして コースを みてね 🐾
      </div>
    </div>
  );
}
