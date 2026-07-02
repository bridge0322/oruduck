import { useState } from "react";
import { LifeCorgi } from "./LifeCorgi";
import { Button } from "../../design-system/Button";

// 初回起動時に呼び名を聞くオンボーディング。
export interface OnboardingProps {
  onDone: (name: string | null) => void;
}

export function Onboarding({ onDone }: OnboardingProps) {
  const [name, setName] = useState("");
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
      <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 8 }}>
        「ちゃん」は つけなくて だいじょうぶ
      </div>
      <div style={{ marginTop: 20, width: "80%", maxWidth: 260, display: "flex", flexDirection: "column", gap: 10 }}>
        <Button variant="primary" size="lg" fullWidth disabled={!name.trim()} onClick={() => onDone(name.trim())}>
          よろしくね！
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={() => onDone(null)}>
          あとで きめる
        </Button>
      </div>
    </div>
  );
}
