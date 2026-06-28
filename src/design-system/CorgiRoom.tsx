import { useEffect, useRef, useState } from "react";
import { ROOM_STAGES, roomLevelFromAmount, roomParamsFor } from "../features/tracker/logic/roomStages";
import { RoomCorgi } from "./RoomCorgi";

export interface CorgiRoomProps {
  level?: number;
  amount?: number;
  height?: number;
  onTap?: (level: number) => void;
}

export function CorgiRoom({ level, amount = 2000000, height = 360, onTap }: CorgiRoomProps) {
  const lv = level != null ? level : roomLevelFromAmount(amount);
  const stageRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(360);
  const [x, setX] = useState(0.5);
  const [dir, setDir] = useState(1);
  const [mode, setMode] = useState<"walk" | "sit" | "idle">("walk");
  const [phase, setPhase] = useState(0);
  const [jump, setJump] = useState(0);
  const targetX = useRef(0.5), modeTimer = useRef(0), jumpRef = useRef(0);
  const FLOOR_Y = 0.62;

  useEffect(() => {
    const ro = () => stageRef.current && setW(stageRef.current.clientWidth);
    ro();
    window.addEventListener("resize", ro);
    return () => window.removeEventListener("resize", ro);
  }, []);

  useEffect(() => {
    let raf: number, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      setPhase((ph) => (ph + dt * 2.2) % 1);
      if (jumpRef.current > 0.01) { jumpRef.current *= 0.88; setJump(jumpRef.current); }
      else if (jumpRef.current !== 0) { jumpRef.current = 0; setJump(0); }
      modeTimer.current -= dt;
      if (modeTimer.current <= 0) {
        const r = Math.random();
        if (mode === "walk") {
          if (r < 0.35) { setMode(r < 0.18 ? "sit" : "idle"); modeTimer.current = 1.5 + Math.random() * 2; }
          else { targetX.current = 0.1 + Math.random() * 0.8; modeTimer.current = 2 + Math.random() * 3; }
        } else {
          setMode("walk"); targetX.current = 0.1 + Math.random() * 0.8; modeTimer.current = 2 + Math.random() * 3;
        }
      }
      if (mode === "walk") {
        setX((cx) => {
          const speed = 0.10 * dt, d = targetX.current - cx;
          if (Math.abs(d) < 0.01) return cx;
          const nd = Math.sign(d); setDir(nd);
          return cx + nd * Math.min(speed, Math.abs(d));
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const corgiW = 150 * roomParamsFor(lv).bodyScale;
  const px = 20 + x * (w - 40 - corgiW), floorPx = height * FLOOR_Y, ch = corgiW * (388 / 400);
  const handleTap = () => { jumpRef.current = 22; setJump(22); if (onTap) onTap(lv); };

  return (
    <div ref={stageRef} style={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: "var(--radius-card,24px)", border: "3px solid #F0E0C8", background: `linear-gradient(#FDEFD6 0%, #FDEFD6 ${FLOOR_Y * 100}%, #E9C79B ${FLOOR_Y * 100}%, #E2BB89 100%)` }}>
      <div style={{ position: "absolute", left: "12%", top: "12%", width: 90, height: 70, background: "#BFE3F0", border: "5px solid #fff", borderRadius: 8 }}>
        <div style={{ position: "absolute", left: "50%", top: 0, width: 4, height: "100%", background: "#fff", transform: "translateX(-50%)" }}/>
        <div style={{ position: "absolute", top: "50%", left: 0, height: 4, width: "100%", background: "#fff", transform: "translateY(-50%)" }}/>
      </div>
      <div style={{ position: "absolute", right: "8%", top: "30%", fontSize: 40 }}>🪴</div>
      <div style={{ position: "absolute", left: "50%", bottom: "8%", width: "70%", height: 40, transform: "translateX(-50%)", background: "#F4C9C0", borderRadius: "50%", opacity: 0.7 }}/>
      <div style={{ position: "absolute", left: "22%", bottom: "12%", fontSize: 22 }}>🎾</div>
      <div onClick={handleTap} style={{ position: "absolute", left: px, top: floorPx - ch, width: corgiW, height: ch, transform: `scaleX(${dir})`, cursor: "pointer" }}>
        <RoomCorgi level={lv} badge={ROOM_STAGES[lv - 1].badge} walkPhase={phase} state={mode} jump={jump}/>
      </div>
      {mode !== "walk" && (
        <div style={{ position: "absolute", left: px + corgiW * 0.5, top: floorPx - ch - 6, transform: "translateX(-50%)", background: "#fff", padding: "2px 10px", borderRadius: 999, fontSize: 16, border: "2px solid #F0E0C8", whiteSpace: "nowrap", pointerEvents: "none" }}>
          {mode === "sit" ? "おすわり" : "💛"}
        </div>
      )}
    </div>
  );
}
