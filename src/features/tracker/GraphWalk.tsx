import { useEffect, useMemo, useRef, useState } from "react";
import { LifeCorgi } from "../life/LifeCorgi";
import type { Record_ } from "./logic/persistence";

// 資産グラフ散歩道：評価額の折れ線を「道」に見立てて犬が歩く。
// 上り坂は「よいしょ よいしょ」、下り坂は前向きに「くだりざかは らくちん」。
export interface GraphWalkProps {
  records: Record_[];
  height?: number;
}

const W = 320;

export function GraphWalk({ records, height = 180 }: GraphWalkProps) {
  const H = height;
  const pts = useMemo(() => {
    if (records.length < 2) return [];
    const vals = records.map((r) => r.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = max - min || 1;
    const padY = 34, top = 16;
    return records.map((r, i) => ({
      x: (i / (records.length - 1)) * (W - 40) + 20,
      y: top + (1 - (r.value - min) / span) * (H - top - padY),
      v: r.value,
    }));
  }, [records, H]);

  const [t, setT] = useState(0); // 0..(n-1) 折れ線上の位置
  const raf = useRef(0);

  useEffect(() => {
    if (pts.length < 2) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      setT((prev) => {
        let nt = prev + dt * 0.6; // 1秒で0.6区間すすむ
        if (nt >= pts.length - 1) nt = 0;
        return nt;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [pts.length]);

  if (pts.length < 2) {
    return (
      <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
        きろくが 2つ いじょうに なると<br />さんぽ道が あらわれるよ 🐾
      </div>
    );
  }

  const seg = Math.min(pts.length - 2, Math.floor(t));
  const frac = t - seg;
  const a = pts[seg], b = pts[seg + 1];
  const dogX = a.x + (b.x - a.x) * frac;
  const dogY = a.y + (b.y - a.y) * frac;
  const uphill = b.v > a.v + 1;
  const downhill = b.v < a.v - 1;
  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

  const msg = uphill ? "よいしょ よいしょ⛰️" : downhill ? "くだりざかは らくちんだね♪" : "てくてく…";

  const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const dogW = 44;

  return (
    <div style={{ position: "relative", width: "100%", height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {/* 空と地面 */}
        <rect x="0" y="0" width={W} height={H} fill="var(--surface-sunken)" rx="12" />
        {/* 道の下の塗り */}
        <polygon points={`20,${H - 10} ${poly} ${W - 20},${H - 10}`} fill="var(--brand-soft)" opacity="0.5" />
        {/* 道（折れ線） */}
        <polyline points={poly} fill="none" stroke="#C77F35" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={poly} fill="none" stroke="#FBEAD0" strokeWidth="2" strokeLinejoin="round" strokeDasharray="2 8" />
        {/* 各記録の点 */}
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--brand)" stroke="#fff" strokeWidth="2" />)}
      </svg>

      {/* 歩く犬（道の上） */}
      <div style={{ position: "absolute", left: `${(dogX / W) * 100}%`, top: `${(dogY / H) * 100}%`, width: dogW, height: dogW, transform: `translate(-50%,-88%) rotate(${Math.max(-18, Math.min(18, angle))}deg)`, pointerEvents: "none" }}>
        <LifeCorgi level={8} pose="run" legPhase={t * 3} tailWag={uphill ? 6 : 12} eyes={uphill ? "sleepy" : "open"} mouth={downhill ? "tongue" : "smile"} />
      </div>
      {/* ひとこと */}
      {msg && (
        <div style={{ position: "absolute", left: "50%", top: 6, transform: "translateX(-50%)", background: "rgba(255,255,255,0.92)", borderRadius: 14, padding: "5px 12px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-xs)", color: "var(--text-strong)", boxShadow: "var(--shadow-sm)", pointerEvents: "none" }}>
          {msg}
        </div>
      )}
    </div>
  );
}
