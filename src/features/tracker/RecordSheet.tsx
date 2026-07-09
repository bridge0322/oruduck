import { useState } from "react";
import { Button } from "../../design-system/Button";
import { Input } from "../../design-system/Input";
import { CorgiMascot } from "../../design-system/CorgiMascot";
import { Sheet } from "./Sheet";
import { condFor } from "./logic/conditions";
import { toNum } from "./logic/csv";
import { YEN } from "./logic/format";
import type { Record_ } from "./logic/persistence";

export interface RecordSheetProps {
  cur: Record_ | null;
  onClose: () => void;
  onSave: (rec: { principal: number | null; value: number; units?: number; nav?: number }) => void;
}

type Mode = "value" | "units";

// 口数×基準価額から評価額を出す。基準価額は「1万口あたり」で表示される慣習に合わせる。
const valueFromUnits = (units: number, nav: number) => Math.round((units * nav) / 10000);

export function RecordSheet({ cur, onClose, onSave }: RecordSheetProps) {
  // 前回が口数モードならその続きから（口数はそのまま、基準価額だけ更新すればよい）。
  const [mode, setMode] = useState<Mode>(cur && cur.units ? "units" : "value");
  const [principal, setPrincipal] = useState(cur ? String(cur.principal) : "");
  const [value, setValue] = useState(cur ? String(cur.value) : "");
  const [units, setUnits] = useState(cur && cur.units ? String(cur.units) : "");
  const [nav, setNav] = useState(cur && cur.nav ? String(cur.nav) : "");

  const p = toNum(principal);
  const u = toNum(units), nv = toNum(nav);
  const unitsOk = mode === "units" && !isNaN(u) && u > 0 && !isNaN(nv) && nv > 0;
  const v = mode === "units" ? (unitsOk ? valueFromUnits(u, nv) : NaN) : toNum(value);
  const ok = !isNaN(p) && p > 0 && !isNaN(v) && v > 0;
  const rate = ok ? ((v - p) / p) * 100 : 0;
  const cond = condFor(rate);

  const tab = (m: Mode, label: string) => (
    <button type="button" onClick={() => setMode(m)} style={{
      flex: 1, padding: "9px 8px", border: "none", cursor: "pointer",
      fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)",
      borderRadius: "var(--radius-md)",
      background: mode === m ? "var(--brand)" : "transparent",
      color: mode === m ? "#fff" : "var(--text-muted)",
    }}>{label}</button>
  );

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12 }}>
        <CorgiMascot stage="adult" condition={ok ? cond.key : "happy"} size={92} bob />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-xl)", color: "var(--text-strong)", marginTop: 4 }}>きょうの記録</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          {mode === "units" ? "基準価額だけ 更新すればOK 🐾" : "楽天証券の数字を入力してね"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--cream-200)", borderRadius: "var(--radius-md)", marginBottom: 14 }}>
        {tab("value", "評価額で入力")}
        {tab("units", "口数で入力")}
      </div>

      <Input label="投資元本（取得金額）" prefix="¥" inputMode="numeric" value={principal}
        onChange={(e) => setPrincipal(e.target.value)} style={{ marginBottom: 12 }} />

      {mode === "value" ? (
        <Input label="評価額（時価）" prefix="¥" inputMode="numeric" value={value}
          onChange={(e) => setValue(e.target.value)} style={{ marginBottom: 8 }} />
      ) : (
        <>
          <Input label="保有口数" suffix="口" inputMode="numeric" value={units}
            onChange={(e) => setUnits(e.target.value)} style={{ marginBottom: 12 }} />
          <Input label="基準価額（1万口あたり）" prefix="¥" inputMode="numeric" value={nav}
            onChange={(e) => setNav(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ textAlign: "center", minHeight: 20, marginBottom: 4, fontFamily: "var(--font-number)", fontWeight: 800, fontSize: "var(--text-md)", color: "var(--text-strong)" }}>
            {unitsOk ? `評価額 ¥${YEN(v)}` : " "}
          </div>
        </>
      )}

      <div style={{ textAlign: "center", minHeight: 22, marginBottom: 12, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: rate >= 0 ? "var(--positive)" : "var(--negative)" }}>
        {ok ? `評価損益 ${rate >= 0 ? "+" : "−"}¥${YEN(Math.abs(v - p))}（${rate >= 0 ? "+" : "−"}${Math.abs(rate).toFixed(2)}%）→ ${cond.label}` : " "}
      </div>
      <Button variant="primary" size="lg" fullWidth disabled={!ok}
        onClick={() => onSave(mode === "units" ? { principal: p, value: v, units: u, nav: nv } : { principal: p, value: v })}
        iconLeft={<i className="ph-fill ph-paw-print" />}>記録する</Button>
    </Sheet>
  );
}
