import { useEffect, useRef, useState } from "react";

// おやつ探し：3つのおわんのどれかに骨。見せて→シャッフル→当てる。
// 当てると犬が大よろこび（親側で演出）。ごほうびはなし＝純粋なお楽しみ＋
// 「きょうのおねがい」の「あそぶ」を達成できる。
export interface TreasureSheetProps {
  onClose: () => void;
  onWin: () => void;
}

type Phase = "peek" | "shuffle" | "pick" | "won" | "lost";

const CUP_W = 76;
const GAP_X = 96;

export function TreasureSheet({ onClose, onWin }: TreasureSheetProps) {
  const [phase, setPhase] = useState<Phase>("peek");
  // pos[cupId] = 表示スロット(0..2)。骨は cup 0 に固定し、カップの位置だけ入れ替える。
  const [pos, setPos] = useState<number[]>([0, 1, 2]);
  const [opened, setOpened] = useState<number | null>(null); // 開けたカップid
  const timers = useRef<number[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const after = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  // 進行：1.1秒 骨を見せる → 4回シャッフル → 選ばせる
  useEffect(() => {
    after(1100, () => {
      setPhase("shuffle");
      let step = 0;
      const swapOnce = () => {
        setPos((p) => {
          const a = Math.floor(Math.random() * 3);
          let b = Math.floor(Math.random() * 3);
          if (b === a) b = (b + 1) % 3;
          const n = [...p];
          [n[a], n[b]] = [n[b], n[a]];
          return n;
        });
        step += 1;
        if (step < 4) after(520, swapOnce);
        else after(560, () => setPhase("pick"));
      };
      after(420, swapOnce);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (cupId: number) => {
    if (phase !== "pick") return;
    setOpened(cupId);
    if (cupId === 0) { setPhase("won"); after(300, onWin); }
    else setPhase("lost");
  };

  const retry = () => { setOpened(null); setPos([0, 1, 2]); setPhase("peek");
    after(1100, () => {
      setPhase("shuffle");
      let step = 0;
      const swapOnce = () => {
        setPos((p) => { const a = Math.floor(Math.random() * 3); let b = Math.floor(Math.random() * 3); if (b === a) b = (b + 1) % 3; const n = [...p]; [n[a], n[b]] = [n[b], n[a]]; return n; });
        step += 1;
        if (step < 4) after(520, swapOnce); else after(560, () => setPhase("pick"));
      };
      after(420, swapOnce);
    });
  };

  const lifted = (cupId: number) =>
    phase === "peek" || (opened != null && (cupId === opened || (phase === "lost" && cupId === 0)));

  const msg =
    phase === "peek" ? "🦴が どこに はいるか みててね" :
    phase === "shuffle" ? "まぜまぜ まぜまぜ…" :
    phase === "pick" ? "どの おわんに はいってる？" :
    phase === "won" ? "🎉 あたり！ みつけたね！" : "ざんねん！ こっちだったよ〜";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, maxWidth: 480, margin: "0 auto", background: "rgba(60,45,35,0.35)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface-app)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "16px 18px calc(20px + env(safe-area-inset-bottom,0px))", boxShadow: "var(--shadow-lg)", animation: "sheet-up .3s var(--ease-out)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-lg)", color: "var(--text-strong)", marginBottom: 2 }}>🔎 おやつさがし</div>
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", color: phase === "won" ? "var(--text-brand)" : "var(--text-muted)", minHeight: 22, marginBottom: 8 }}>{msg}</div>

        <div style={{ position: "relative", height: 130, margin: "0 auto", width: GAP_X * 2 + CUP_W }}>
          {[0, 1, 2].map((cupId) => {
            const up = lifted(cupId);
            return (
              <button key={cupId} type="button" onClick={() => pick(cupId)}
                aria-label={`おわん${pos[cupId] + 1}`}
                style={{
                  position: "absolute", left: pos[cupId] * GAP_X, bottom: 12, width: CUP_W, height: 96,
                  background: "transparent", border: "none", padding: 0,
                  cursor: phase === "pick" ? "pointer" : "default",
                  transition: "left .45s var(--ease-out)", WebkitTapHighlightColor: "transparent",
                }}>
                {/* 骨（カップ0の下にだけある） */}
                {cupId === 0 && <span style={{ position: "absolute", left: "50%", bottom: 2, transform: "translateX(-50%)", fontSize: 30 }}>🦴</span>}
                {/* 伏せたおわん */}
                <span style={{
                  position: "absolute", left: 0, bottom: 0, width: CUP_W, height: 60,
                  borderRadius: `${CUP_W / 2}px ${CUP_W / 2}px 10px 10px`,
                  background: "linear-gradient(#E3A857, #C77F35)", border: "3px solid #7A5230",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.18)",
                  transform: up ? "translateY(-58px) rotate(-8deg)" : "none",
                  transition: "transform .3s var(--ease-bounce)", display: "block",
                }} />
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          {(phase === "won" || phase === "lost") && (
            <button type="button" onClick={phase === "lost" ? retry : onClose}
              style={{ flex: 1, minHeight: 48, borderRadius: "var(--radius-md)", border: "none", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
              {phase === "lost" ? "もういっかい" : "やったね！"}
            </button>
          )}
          <button type="button" onClick={onClose}
            style={{ flex: 1, minHeight: 48, borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", background: "var(--surface-card)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", color: "var(--text-muted)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            おしまい
          </button>
        </div>
      </div>
    </div>
  );
}
