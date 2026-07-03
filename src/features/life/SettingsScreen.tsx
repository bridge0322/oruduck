import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";
import { SegmentedControl } from "../../design-system/SegmentedControl";
import type { AnimLevel, LifeState } from "./lifeState";

// せってい：よびな・毎月の積立日・アニメーションの強さ。
export interface SettingsScreenProps {
  life: LifeState;
  setLife: Dispatch<SetStateAction<LifeState>>;
}

export function SettingsScreen({ life, setLife }: SettingsScreenProps) {
  const [name, setName] = useState(life.name || "");
  const [saved, setSaved] = useState(false);

  const saveName = () => {
    setLife((s) => ({ ...s, name: name.trim() || null }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const animValue = life.animLevel || "auto";
  const setAnim = (v: string) => {
    setLife((s) => ({ ...s, animLevel: v === "auto" ? null : (v as AnimLevel) }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
      <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>🐶 よびな</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          ダックスフンドが よぶ なまえ。「ちゃん」は かってに つくよ。
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="れい：ゆうり" maxLength={10}
            style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", fontFamily: "var(--font-body)", fontSize: "var(--text-md)", background: "var(--surface-card)", outline: "none" }} />
          <Button variant="primary" size="md" onClick={saveName}>{saved ? "ほぞんした！" : "ほぞん"}</Button>
        </div>
      </Card>

      <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>🎉 まいつきの つみたて日</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          この日に ひらくと、ダックスフンドが おいわい してくれるよ。
        </div>
        <select
          value={life.settleDay ?? ""}
          onChange={(e) => setLife((s) => ({ ...s, settleDay: e.target.value === "" ? null : +e.target.value }))}
          style={{ padding: "12px 14px", minHeight: 48, borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", fontFamily: "var(--font-body)", fontSize: "var(--text-base)", background: "var(--surface-card)", color: "var(--text-body)", outline: "none" }}
        >
          <option value="">せっていしない</option>
          {Array.from({ length: 31 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>まいつき {i + 1}にち</option>
          ))}
        </select>
      </Card>

      <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>🎞️ アニメーションの つよさ</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          「おまかせ」は 端末の「視差効果を減らす」設定に あわせるよ。
        </div>
        <SegmentedControl
          value={animValue}
          onChange={setAnim}
          options={[
            { value: "auto", label: "おまかせ" },
            { value: "full", label: "いっぱい" },
            { value: "soft", label: "ふつう" },
            { value: "min", label: "ひかえめ" },
          ]}
        />
      </Card>

      <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
        なつき度：{life.bond}／100 ・ れんぞく {life.streak}日<br />
        データは この端末にだけ ほぞんされます。
      </div>
    </div>
  );
}
