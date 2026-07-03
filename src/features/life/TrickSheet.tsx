import type { LifeState } from "./lifeState";
import { nextLockedTrick, totalMastery, TRICKS, unlockedTricks } from "./tricks";
import type { Trick } from "./tricks";

// 芸パネル：習得済みの号令ボタンをタップで犬に芸をさせる。習熟度（成功回数）を表示。
export interface TrickSheetProps {
  life: LifeState;
  onClose: () => void;
  onTrick: (t: Trick) => void;
}

export function TrickSheet({ life, onClose, onTrick }: TrickSheetProps) {
  const m = life.trickMastery || {};
  const unlocked = unlockedTricks(m);
  const next = nextLockedTrick(m);
  const total = totalMastery(m);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, maxWidth: 480, margin: "0 auto", background: "rgba(60,45,35,0.35)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface-app)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "16px 18px calc(20px + env(safe-area-inset-bottom,0px))", boxShadow: "var(--shadow-lg)", animation: "sheet-up .3s var(--ease-out)", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-lg)", color: "var(--text-strong)" }}>🎓 げいを おしえる</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 700 }}>おぼえた {unlocked.length}/{TRICKS.length}</div>
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
          ごうれいを タップ。せいこうを かさねると あたらしい げいを おぼえるよ（つうさん {total}かい）
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {unlocked.map((t) => (
            <button key={t.id} type="button" onClick={() => onTrick(t)}
              style={{ minHeight: 56, borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", background: "var(--surface-card)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, WebkitTapHighlightColor: "transparent" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>{t.name}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-brand)" }}>
                {"★".repeat(Math.min(5, Math.floor((m[t.id] || 0) / 3)))}{(m[t.id] || 0) > 0 ? ` ${m[t.id]}かい` : " まだ"}
              </span>
            </button>
          ))}
          {next && (
            <div style={{ minHeight: 56, borderRadius: "var(--radius-md)", border: "2px dashed var(--border-strong)", background: "var(--surface-sunken)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
              <span style={{ fontSize: 18, opacity: 0.5 }}>🔒</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textAlign: "center" }}>あと {next.unlockAt - total}かいで「{next.name}」</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
