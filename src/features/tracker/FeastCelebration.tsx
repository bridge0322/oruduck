import { useEffect, useState } from "react";
import { CorgiMascot } from "../../design-system/CorgiMascot";
import { pickGoldThanks, pickThanks } from "./logic/feast";
import type { Food } from "./logic/feast";

export interface FeastCelebrationProps {
  food: Food;
  gainedXp: number;
  onDone: () => void;
}

export function FeastCelebration({ food, gainedXp, onDone }: FeastCelebrationProps) {
  const [phase, setPhase] = useState(0); // 0:登場 1:もぐもぐ 2:よろこぶ
  const [msg] = useState(() => (food.gold ? pickGoldThanks() : pickThanks()));
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => setPhase(2), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const happy = phase >= 2;
  return (
    <div onClick={phase >= 2 ? onDone : undefined}
      style={{ position: "fixed", inset: 0, zIndex: 60, maxWidth: 480, margin: "0 auto", background: "rgba(255,246,234,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
      <div style={{ position: "relative", width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {happy && [0, 1, 2, 3, 4].map((i) => (
          <span key={i} style={{ position: "absolute", left: `${18 + i * 16}%`, bottom: "38%", fontSize: 22 + (i % 3) * 6, animation: `heart-up ${1.1 + (i % 4) * 0.25}s ease-out ${i * 0.12}s infinite` }}>{food.gold ? "✨" : "💛"}</span>
        ))}
        <div style={{ animation: phase === 1 ? "chomp 0.4s ease-in-out infinite" : "pop-in 0.5s var(--ease-bounce,ease)" }}>
          <CorgiMascot stage="adult" condition={happy ? "thriving" : "happy"} size={190} bob={happy} />
        </div>
        {phase < 2 && (
          <div style={{ position: "absolute", bottom: "20%", fontSize: 52, animation: "food-drop 0.7s ease-out", filter: food.gold ? "drop-shadow(0 0 8px #F2C14E)" : "none" }}>{food.emoji}</div>
        )}
      </div>

      {food.gold && happy && (
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "#B8860B", letterSpacing: "var(--tracking-wide)" }}>
          ✨ レア ✨
        </div>
      )}
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-3xl)", color: "var(--text-strong)", marginTop: 6, minHeight: 46 }}>
        {happy ? msg : "もぐもぐ…"}
      </div>
      {happy && (
        <>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-md)", color: "var(--text-body)", marginTop: 4 }}>
            きょうは <b style={{ color: "var(--text-brand)" }}>{food.emoji} {food.name}</b> だったワン！
          </div>
          <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, background: "var(--brand-soft)", color: "var(--text-brand)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-base)", padding: "8px 16px", borderRadius: "var(--radius-pill)" }}>
            <i className="ph-fill ph-star" /> +{gainedXp} けいけんち
          </div>
          <div style={{ marginTop: 22, fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>タップでとじる</div>
        </>
      )}
    </div>
  );
}
