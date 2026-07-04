import { useEffect, useRef, useState } from "react";

// ゾロ目/キリ番のスロット演出。各桁が回転して順番に止まる → 犬が大興奮。
export interface JackpotSlotProps {
  amount: number;
  kind: "zorome" | "kiriban";
  onDone: () => void;
}

export function JackpotSlot({ amount, kind, onDone }: JackpotSlotProps) {
  const digits = String(Math.round(amount)).split("");
  const [reel, setReel] = useState<string[]>(digits.map(() => "0"));
  const [locked, setLocked] = useState<boolean[]>(digits.map(() => false));
  const [win, setWin] = useState(false);
  const raf = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    let stop = false;
    const startedAt = performance.now();
    const lockAt = digits.map((_, i) => 500 + i * 260); // 左から順に停止
    const spin = () => {
      const now = performance.now() - startedAt;
      setReel(() => digits.map((_, i) => (now >= lockAt[i] ? digits[i] : String(Math.floor(Math.random() * 10)))));
      setLocked(digits.map((_, i) => now >= lockAt[i]));
      if (now >= lockAt[lockAt.length - 1] + 200) { setWin(true); return; }
      if (!stop) raf.current = requestAnimationFrame(spin);
    };
    raf.current = requestAnimationFrame(spin);
    const done = setTimeout(() => doneRef.current(), lockAt[lockAt.length - 1] + 2600);
    return () => { stop = true; cancelAnimationFrame(raf.current); clearTimeout(done); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 桁ごとに {桁 or カンマ} を作る（カンマは digitIndex=-1）
  const cells: { char: string; di: number }[] = [];
  reel.forEach((d, i) => {
    cells.push({ char: d, di: i });
    const fromEnd = reel.length - 1 - i;
    if (fromEnd > 0 && fromEnd % 3 === 0) cells.push({ char: ",", di: -1 });
  });

  return (
    <div onClick={win ? onDone : undefined}
      style={{ position: "absolute", inset: 0, zIndex: 9, background: "rgba(46,33,24,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: "var(--radius-card,24px)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "#FFF3C4" }}>
        {win ? (kind === "zorome" ? "✨ ゾロ目 だ〜！ ✨" : "✨ キリ番 とうたつ！ ✨") : "スロット…"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.95)", padding: "8px 12px", borderRadius: 14, boxShadow: "var(--shadow-md)" }}>
        <span style={{ fontFamily: "var(--font-number)", fontWeight: 900, fontSize: 26, color: "var(--text-brand)" }}>¥</span>
        {cells.map((c, i) => c.di < 0 ? (
          <span key={i} style={{ fontFamily: "var(--font-number)", fontWeight: 900, fontSize: 26, color: "var(--text-strong)" }}>,</span>
        ) : (
          <span key={i} style={{ display: "inline-flex", width: 20, justifyContent: "center", fontFamily: "var(--font-number)", fontWeight: 900, fontSize: 28, color: locked[c.di] ? "var(--text-brand)" : "var(--text-muted)", transition: "color .1s", transform: locked[c.di] ? "scale(1.12)" : "none" }}>{c.char}</span>
        ))}
      </div>
      {win && <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "#FFF3C4" }}>タップでとじる</div>}
    </div>
  );
}
