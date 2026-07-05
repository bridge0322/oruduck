import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ITEMS, isUnlocked } from "./dressup";
import type { Item, Slot } from "./dressup";
import type { LifeState } from "./lifeState";
import { LifeCorgi } from "./LifeCorgi";
import { itemById } from "./dressup";

// クローゼット：解放済みアイテムを装着/はずす。装着すると犬が「にあう？」と一回転。
export interface ClosetSheetProps {
  life: LifeState;
  setLife: Dispatch<SetStateAction<LifeState>>;
  onClose: () => void;
  onWear: () => void;
}

const SLOTS: { key: Slot; label: string }[] = [
  { key: "collar", label: "くびわ" },
  { key: "bandana", label: "バンダナ" },
  { key: "hat", label: "ぼうし" },
  { key: "shirt", label: "ふく" },
];

export function ClosetSheet({ life, setLife, onClose, onWear }: ClosetSheetProps) {
  const [slot, setSlot] = useState<Slot>("collar");
  const wd = life.wardrobe || { collar: null, bandana: null, hat: null, shirt: null };
  const items = ITEMS.filter((it) => it.slot === slot);
  const unlockedCount = ITEMS.filter((it) => isUnlocked(it, life)).length;

  const toOutfit = (id: string | null) => {
    const it = itemById(id);
    return it ? { id: it.id, color: it.color, sub: it.sub } : undefined;
  };
  const preview = { collar: toOutfit(wd.collar), bandana: toOutfit(wd.bandana), hat: toOutfit(wd.hat), shirt: toOutfit(wd.shirt) };

  const wear = (it: Item) => {
    if (!isUnlocked(it, life)) return;
    const cur = wd[it.slot];
    const next = cur === it.id ? null : it.id; // もう一度タップで はずす
    setLife((s) => ({ ...s, wardrobe: { ...(s.wardrobe || wd), [it.slot]: next } }));
    if (next) onWear();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, maxWidth: 480, margin: "0 auto", background: "rgba(60,45,35,0.35)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface-app)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "16px 18px calc(20px + env(safe-area-inset-bottom,0px))", boxShadow: "var(--shadow-lg)", animation: "sheet-up .3s var(--ease-out)", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-lg)", color: "var(--text-strong)" }}>👕 きせかえ</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 700 }}>あつめた {unlockedCount}/{ITEMS.length}</div>
        </div>

        {/* プレビュー */}
        <div style={{ width: 150, height: 146, margin: "0 auto 6px" }}>
          <LifeCorgi level={8} pose="sit" legPhase={0} tailWag={8} eyes="happy" mouth="tongue" blush outfit={preview} />
        </div>

        {/* スロット切替 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {SLOTS.map((sl) => (
            <button key={sl.key} type="button" onClick={() => setSlot(sl.key)}
              style={{ flex: 1, minHeight: 40, borderRadius: 999, border: "2px solid " + (slot === sl.key ? "var(--brand)" : "var(--border-strong)"), background: slot === sl.key ? "var(--brand-soft)" : "var(--surface-card)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", color: slot === sl.key ? "var(--text-brand)" : "var(--text-muted)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
              {sl.label}
            </button>
          ))}
        </div>

        {/* アイテムグリッド */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {items.map((it) => {
            const unlocked = isUnlocked(it, life);
            const equipped = wd[it.slot] === it.id;
            return (
              <button key={it.id} type="button" onClick={() => wear(it)} disabled={!unlocked}
                style={{ position: "relative", aspectRatio: "1", borderRadius: "var(--radius-md)", border: "3px solid " + (equipped ? "var(--brand)" : "var(--border)"), background: unlocked ? "var(--surface-card)" : "var(--surface-sunken)", cursor: unlocked ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 6, WebkitTapHighlightColor: "transparent" }}>
                {unlocked ? (
                  <>
                    <span style={{ width: 30, height: 30, borderRadius: "50%", background: it.color, border: "2px solid " + (it.sub || "#7A5230"), display: "inline-block" }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-body)", lineHeight: 1.2, textAlign: "center" }}>{it.name}</span>
                    {equipped && <span style={{ position: "absolute", top: 3, right: 4, fontSize: 12 }}>✓</span>}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 22, opacity: 0.5 }}>🔒</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", lineHeight: 1.2, textAlign: "center" }}>{it.hint}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 10, fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
          もういちど タップで はずせるよ
        </div>
      </div>
    </div>
  );
}
