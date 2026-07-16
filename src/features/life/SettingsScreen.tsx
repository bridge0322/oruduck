import { useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";
import { SegmentedControl } from "../../design-system/SegmentedControl";
import { Switch } from "../../design-system/Switch";
import { feat } from "./features";
import { personalityMeta } from "./mood";
import { configureSound, playSound } from "./sound";
import { DEFAULT_HOUSE_THRESHOLDS, withHonorific } from "./lifeState";
import type { AnimLevel, Honorific, LifeState } from "./lifeState";
import { applyTransferCode, downloadBackupJson, downloadTransferCode, makeTransferCode } from "./transfer";

// せってい：よびな・毎月の積立日・アニメーションの強さ・データのひきつぎ。
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

  // ---- データのひきつぎ ----
  const [exportCode, setExportCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPhase, setImportPhase] = useState<"idle" | "confirm" | "done">("idle");
  const [importErr, setImportErr] = useState<string | null>(null);

  const makeCode = async () => {
    setCopied(false);
    setExportCode(await makeTransferCode());
  };
  const copyCode = async () => {
    if (!exportCode) return;
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* 権限なし等。テキストエリアから手動コピーできる */ }
  };
  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImportText(String(reader.result || "")); setImportPhase("idle"); setImportErr(null); };
    reader.readAsText(file);
  };
  const runImport = async () => {
    setImportErr(null);
    const res = await applyTransferCode(importText);
    if (!res.ok) { setImportPhase("idle"); setImportErr(res.error || "よみこみに しっぱいしたよ"); return; }
    setImportPhase("done");
    setTimeout(() => location.reload(), 900); // アプリは起動時にデータを読むので再読み込み
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
      <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>🐶 よびな</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          ダックスフンドが よぶ なまえ。けいしょうは「ちゃん」「くん」「なし（呼び捨て）」から えらべるよ。
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="れい：ゆうり" maxLength={10}
            style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", fontFamily: "var(--font-body)", fontSize: "var(--text-md)", background: "var(--surface-card)", outline: "none" }} />
          <Button variant="primary" size="md" onClick={saveName}>{saved ? "ほぞんした！" : "ほぞん"}</Button>
        </div>
        <SegmentedControl
          value={life.honorific}
          onChange={(v) => setLife((s) => ({ ...s, honorific: v as Honorific }))}
          options={[
            { value: "chan", label: "ちゃん" },
            { value: "kun", label: "くん" },
            { value: "none", label: "なし" },
          ]}
        />
        {(name.trim() || life.name) && (
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-sm)", color: "var(--text-brand)", textAlign: "center" }}>
            「{withHonorific((name.trim() || life.name || ""), life.honorific)}」って よぶね！
          </div>
        )}
      </Card>

      {/* この子の性格（お迎えのときから決まっている個性・変更不可） */}
      {life.personality && (
        <Card elevation="sm" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, flex: "none", borderRadius: "var(--radius-md)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            {personalityMeta(life.personality).emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>
              せいかく：{personalityMeta(life.personality).label}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>
              {personalityMeta(life.personality).desc}
            </div>
          </div>
        </Card>
      )}

      <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>🎉 まいつきの つみたて日</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          この日に ひらくと、ダックスフンドが おいわい してくれるよ。ふくすう とうろくOK。
          31にち など「その月に ない日」は 月末に おいわいするよ。まえの日には よこくも してくれる。
        </div>
        {(life.settleDays ?? []).length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[...(life.settleDays ?? [])].sort((a, b) => a - b).map((d) => (
              <button key={d} type="button"
                onClick={() => setLife((s) => ({ ...s, settleDays: (s.settleDays ?? []).filter((x) => x !== d) }))}
                aria-label={`毎月${d}日を削除`}
                style={{ minHeight: 40, padding: "8px 12px", borderRadius: 999, border: "2px solid var(--brand)", background: "var(--brand-soft)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", color: "var(--text-brand)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                まいつき {d}にち ×
              </button>
            ))}
          </div>
        )}
        <select
          value=""
          onChange={(e) => {
            const d = +e.target.value;
            if (!d) return;
            setLife((s) => ({ ...s, settleDays: (s.settleDays ?? []).includes(d) ? (s.settleDays ?? []) : [...(s.settleDays ?? []), d] }));
          }}
          style={{ padding: "12px 14px", minHeight: 48, borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", fontFamily: "var(--font-body)", fontSize: "var(--text-base)", background: "var(--surface-card)", color: "var(--text-body)", outline: "none" }}
        >
          <option value="">＋ 日にちを ついか</option>
          {Array.from({ length: 31 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>まいつき {i + 1}にち</option>
          ))}
        </select>
      </Card>

      {feat("goalMap") && (
        <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>🎯 もくひょうの きんがく</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
            にっき の おさんぽマップの ゴールに なるよ。
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" inputMode="numeric" value={life.goalAmount || 1000000} min={0} step={100000}
              onChange={(e) => setLife((s) => ({ ...s, goalAmount: Math.max(0, +e.target.value || 0) }))}
              style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", fontFamily: "var(--font-number)", fontSize: "var(--text-md)", background: "var(--surface-card)", outline: "none" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>円</span>
          </div>
        </Card>
      )}

      {feat("houseUpgrade") && (
        <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>🏠 おうちが そだつ きんがく</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
            積立累計が この額を こえると、犬小屋→洋風ハウス→豪邸に なるよ。
          </div>
          {[0, 1, 2].map((i) => {
            const th = life.houseThresholds && life.houseThresholds.length === 3 ? life.houseThresholds : DEFAULT_HOUSE_THRESHOLDS;
            const labels = ["犬小屋", "洋風ハウス", "庭付き豪邸"];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: "none", width: 78, fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-body)" }}>{labels[i]}</span>
                <input type="number" inputMode="numeric" value={th[i]} min={0} step={100000}
                  onChange={(e) => setLife((s) => { const cur = (s.houseThresholds && s.houseThresholds.length === 3 ? [...s.houseThresholds] : [...DEFAULT_HOUSE_THRESHOLDS]); cur[i] = Math.max(0, +e.target.value || 0); return { ...s, houseThresholds: cur }; })}
                  style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", fontFamily: "var(--font-number)", fontSize: "var(--text-sm)", background: "var(--surface-card)", outline: "none" }} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>円</span>
              </div>
            );
          })}
        </Card>
      )}

      {feat("sound") && (
        <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>🔊 こうかおん</div>
            <Switch checked={!!life.soundOn} onChange={(v) => { setLife((s) => ({ ...s, soundOn: v })); configureSound(v, life.soundVol ?? 0.5); if (v) playSound("wag"); }} />
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
            甘え鳴き・寝息・カリカリなどを ならすよ（きどうじは オフ）。
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: life.soundOn ? 1 : 0.45 }}>
            <span style={{ fontSize: 14 }}>🔈</span>
            <input type="range" min={0} max={100} value={Math.round((life.soundVol ?? 0.5) * 100)} disabled={!life.soundOn}
              onChange={(e) => { const v = +e.target.value / 100; setLife((s) => ({ ...s, soundVol: v })); configureSound(!!life.soundOn, v); }}
              onMouseUp={() => playSound("crunch")} onTouchEnd={() => playSound("crunch")}
              style={{ flex: 1 }} />
            <span style={{ fontSize: 16 }}>🔊</span>
          </div>
        </Card>
      )}

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

      <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>📦 データの ひきつぎ</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          きしゅへんの まえに「ひきつぎコード」を つくって、あたらしい たんまつで よみこんでね。
          きろくも なつき度も おもいでも、まるごと ひっこしできるよ。
        </div>

        {/* つくる（バックアップ） */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="md" fullWidth style={{ whiteSpace: "nowrap", padding: "12px 8px" }} onClick={makeCode}>
            ひきつぎコードを つくる
          </Button>
          <Button variant="secondary" size="md" fullWidth style={{ whiteSpace: "nowrap", padding: "12px 8px" }} onClick={downloadBackupJson} iconLeft={<i className="ph ph-download-simple" />}>
            バックアップを ほぞん
          </Button>
        </div>
        {exportCode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea readOnly value={exportCode} onFocus={(e) => e.currentTarget.select()} rows={3} style={taS} />
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="primary" size="md" fullWidth style={{ whiteSpace: "nowrap", padding: "12px 8px" }} onClick={copyCode}>{copied ? "コピーした！" : "コードを コピー"}</Button>
              <Button variant="secondary" size="md" fullWidth style={{ whiteSpace: "nowrap", padding: "12px 8px" }} onClick={() => downloadTransferCode(exportCode)}>ファイルで ほぞん</Button>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

        {/* よみこむ（復元） */}
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-body)" }}>
          あたらしい たんまつで よみこむ
        </div>
        <textarea
          value={importText}
          onChange={(e) => { setImportText(e.target.value); setImportPhase("idle"); setImportErr(null); }}
          placeholder="ここに ひきつぎコードを はりつけ" rows={3} style={taS}
        />
        <label style={{ display: "block" }}>
          <input type="file" accept=".txt,.json,text/plain,application/json" style={{ display: "none" }} onChange={(e) => onImportFile(e.target.files?.[0])} />
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 40, borderRadius: "var(--radius-md)", border: "2px dashed var(--border-strong)", background: "var(--surface-card)", color: "var(--text-brand)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer" }}>
            ほぞんした ファイルを えらぶ
          </span>
        </label>
        {importErr && (
          <div style={{ color: "var(--negative)", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 700 }}>{importErr}</div>
        )}
        {importPhase === "done" ? (
          <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-sm)", color: "var(--text-brand)" }}>
            よみこんだよ！ ひらきなおすね…
          </div>
        ) : importPhase === "confirm" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--negative)", fontWeight: 700, textAlign: "center" }}>
              いまの たんまつの データに うわがきするよ。いい？
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="md" fullWidth onClick={() => setImportPhase("idle")}>やめる</Button>
              <Button variant="primary" size="md" fullWidth onClick={runImport}>うわがきして よみこむ</Button>
            </div>
          </div>
        ) : (
          <Button variant="primary" size="md" fullWidth disabled={!importText.trim()} onClick={() => setImportPhase("confirm")}>
            よみこむ
          </Button>
        )}
      </Card>

      <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
        なつき度：{life.bond}／100 ・ れんぞく {life.streak}日 ・ お休み券 {life.restTickets ?? 0}枚<br />
        （お休み券は 毎月1枚もらえて、1日あいても れんぞくを まもってくれるよ）<br />
        データは この端末にだけ ほぞんされます。
      </div>
    </div>
  );
}

// ひきつぎコード用テキストエリアの共通スタイル
const taS: CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "var(--radius-md)",
  border: "2px solid var(--border-strong)", background: "var(--surface-card)", outline: "none",
  fontFamily: "var(--font-number)", fontSize: 11, lineHeight: 1.5, color: "var(--text-body)",
  resize: "vertical", wordBreak: "break-all",
};
