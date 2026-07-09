import type { ReactNode } from "react";
import { Card } from "../../design-system/Card";
import { Badge } from "../../design-system/Badge";
import { ProgressBar } from "../../design-system/ProgressBar";
import { condFor, condTone } from "./logic/conditions";
import { crashState } from "./logic/feast";
import { ROOM_STAGES, roomLevelFromAmount, endlessStage } from "./logic/roomStages";
import { YEN } from "./logic/format";
import type { Record_ } from "./logic/persistence";

export interface HeroProps {
  cur: Record_;
  peak: number;
  scene: ReactNode; // 生きているコーギーの舞台（CompanionStage）
}

export function Hero({ cur, peak, scene }: HeroProps) {
  const gain = cur.value - cur.principal;
  const rate = cur.principal > 0 ? (gain / cur.principal) * 100 : 0;
  const cond = condFor(rate);
  const lv = roomLevelFromAmount(cur.principal);
  const st = ROOM_STAGES[lv - 1];
  // ¥100万到達後は無限に続く「生涯ステージ」へ。それ未満は通常の成長ステージ。
  const endless = endlessStage(cur.principal);
  const title = endless ? endless.title : st.name;
  const nextName = endless ? endless.nextTitle : (ROOM_STAGES[lv] ? ROOM_STAGES[lv].name : null);
  const nextAmount = endless ? endless.nextAmount : (ROOM_STAGES[lv] ? ROOM_STAGES[lv].amount : null);
  const baseAmount = endless ? endless.curAmount : st.amount;
  const toNext = nextAmount != null ? Math.min(100, Math.round(((cur.principal - baseAmount) / (nextAmount - baseAmount)) * 100)) : 100;

  const crash = crashState(cur.value, peak);
  const inEvent = crash.level >= 1;

  return (
    <Card tone="fur" elevation="md" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px 0" }}>
        <Badge tone="brand">{endless ? title : `Lv.${lv} ${title}`}</Badge>
        {inEvent
          ? <Badge tone="negative"><i className="ph-fill ph-cloud-rain" style={{ marginRight: 3 }} />{crash.label}</Badge>
          : <Badge tone={condTone(cond.key)}>{cond.label}</Badge>}
        <span style={{ marginLeft: "auto", flexShrink: 0, whiteSpace: "nowrap", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 700 }}>
          なでても あそべるよ 🐾
        </span>
      </div>

      {scene}

      <div style={{ padding: "0 4px" }}>
        <ProgressBar value={toNext} color="var(--brand)"
          label={nextAmount != null ? <span>次の <b style={{ color: "var(--text-brand)" }}>{nextName}</b> まで 積立 あと ¥{YEN(nextAmount - cur.principal)}</span> : "最高ステージに到達！"}
          showValue={nextAmount != null} />
      </div>
    </Card>
  );
}
