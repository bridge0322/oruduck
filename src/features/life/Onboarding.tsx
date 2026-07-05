import { useState } from "react";
import { LifeCorgi } from "./LifeCorgi";
import { Button } from "../../design-system/Button";
import { withHonorific } from "./lifeState";
import type { Honorific } from "./lifeState";

// 初回起動時に呼び名と敬称（ちゃん／くん／なし）を聞くオンボーディング。
export interface OnboardingProps {
  onDone: (name: string | null, honorific: Honorific) => void;
}

const HONORIFICS: { value: Honorific; label: string }[] = [
  { value: "chan", label: "ちゃん" },
  { value: "kun", label: "くん" },
  { value: "none", label: "なし" },
];

export function Onboarding({ onDone }: OnboardingProps) {
  const [name, setName] = useState("");
  const [honorific, setHonorific] = useState<Honorific>("chan");
  const trimmed = name.trim();
  const preview = trimmed ? withHonorific(trimmed, honorific) : "";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, maxWidth: 480, margin: "0 auto", background: "rgba(255,246,234,0.98)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
      <div style={{ width: 180, height: 176, animation: "corgi-bob 2.4s ease-in-out infinite" }}>
        <LifeCorgi level={4} pose="sit" legPhase={0} tailWag={10} eyes="open" mouth="tongue" blush />
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-xl)", color: "var(--text-strong)", marginTop: 8 }}>
        はじめまして！
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-base)", color: "var(--text-body)", marginTop: 8, lineHeight: 1.7 }}>
        きみのこと、なんて よべばいい？
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="れい：ゆうり"
        maxLength={10}
        style={{ marginTop: 18, width: "80%", maxWidth: 260, padding: "13px 16px", borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", fontFamily: "var(--font-body)", fontSize: "var(--text-md)", textAlign: "center", background: "var(--surface-card)", outline: "none" }}
      />

      {/* 敬称えらび（ちゃん／くん／なし） */}
      <div style={{ marginTop: 14, display: "flex", gap: 8, width: "80%", maxWidth: 260 }}>
        {HONORIFICS.map((h) => {
          const on = honorific === h.value;
          return (
            <button
              key={h.value}
              type="button"
              onClick={() => setHonorific(h.value)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: "var(--radius-md)", cursor: "pointer",
                border: `2px solid ${on ? "var(--brand)" : "var(--border-strong)"}`,
                background: on ? "var(--brand)" : "var(--surface-card)",
                color: on ? "#fff" : "var(--text-body)",
                fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {h.label}
            </button>
          );
        })}
      </div>
      <div style={{ minHeight: 22, marginTop: 10, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-brand)" }}>
        {preview ? `「${preview}」って よぶね！` : " "}
      </div>

      <div style={{ marginTop: 14, width: "80%", maxWidth: 260, display: "flex", flexDirection: "column", gap: 10 }}>
        <Button variant="primary" size="lg" fullWidth disabled={!trimmed} onClick={() => onDone(trimmed, honorific)}>
          よろしくね！
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={() => onDone(null, honorific)}>
          あとで きめる
        </Button>
      </div>
    </div>
  );
}
