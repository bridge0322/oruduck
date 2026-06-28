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
  onSave: (rec: { principal: number | null; value: number }) => void;
}

export function RecordSheet({ cur, onClose, onSave }: RecordSheetProps) {
  const [principal, setPrincipal] = useState(cur ? String(cur.principal) : "");
  const [value, setValue] = useState(cur ? String(cur.value) : "");
  const p = toNum(principal), v = toNum(value);
  const ok = !isNaN(p) && !isNaN(v) && p > 0;
  const rate = ok ? ((v - p) / p) * 100 : 0;
  const cond = condFor(rate);
  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12 }}>
        <CorgiMascot stage="adult" condition={ok ? cond.key : "happy"} size={92} bob />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-xl)", color: "var(--text-strong)", marginTop: 4 }}>きょうの記録</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>楽天証券の数字を入力してね</div>
      </div>
      <Input label="投資元本（取得金額）" prefix="¥" inputMode="numeric" value={principal}
        onChange={(e) => setPrincipal(e.target.value)} style={{ marginBottom: 12 }} />
      <Input label="評価額（時価）" prefix="¥" inputMode="numeric" value={value}
        onChange={(e) => setValue(e.target.value)} style={{ marginBottom: 8 }} />
      <div style={{ textAlign: "center", minHeight: 22, marginBottom: 12, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: rate >= 0 ? "var(--positive)" : "var(--negative)" }}>
        {ok ? `評価損益 ${rate >= 0 ? "+" : "−"}¥${YEN(Math.abs(v - p))}（${rate >= 0 ? "+" : "−"}${Math.abs(rate).toFixed(2)}%）→ ${cond.label}` : " "}
      </div>
      <Button variant="primary" size="lg" fullWidth disabled={!ok}
        onClick={() => onSave({ principal: p, value: v })} iconLeft={<i className="ph-fill ph-paw-print" />}>記録する</Button>
    </Sheet>
  );
}
