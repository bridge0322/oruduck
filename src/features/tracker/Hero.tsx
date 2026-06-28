import { Card } from "../../design-system/Card";
import { Badge } from "../../design-system/Badge";
import { CorgiRoom } from "../../design-system/CorgiRoom";
import { ProgressBar } from "../../design-system/ProgressBar";
import { WeatherScene } from "./WeatherScene";
import { condFor, condTone } from "./logic/conditions";
import { crashState } from "./logic/feast";
import { ROOM_STAGES, roomLevelFromAmount } from "./logic/roomStages";
import { YEN } from "./logic/format";
import type { Record_ } from "./logic/persistence";

export interface HeroProps {
  cur: Record_;
  peak: number;
}

export function Hero({ cur, peak }: HeroProps) {
  const gain = cur.value - cur.principal;
  const rate = cur.principal > 0 ? (gain / cur.principal) * 100 : 0;
  const cond = condFor(rate);
  const lv = roomLevelFromAmount(cur.principal);
  const st = ROOM_STAGES[lv - 1];
  const nextSt = ROOM_STAGES[lv] || null;
  const toNext = nextSt ? Math.min(100, Math.round(((cur.principal - st.amount) / (nextSt.amount - st.amount)) * 100)) : 100;

  const crash = crashState(cur.value, peak);
  const inEvent = crash.level >= 1;

  return (
    <Card tone="fur" elevation="md" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px 0" }}>
        <Badge tone="brand">Lv.{lv} {st.name}</Badge>
        {inEvent
          ? <Badge tone="negative"><i className="ph-fill ph-cloud-rain" style={{ marginRight: 3 }} />{crash.label}</Badge>
          : <Badge tone={condTone(cond.key)}>{cond.label}</Badge>}
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 700 }}>
          {inEvent ? `高値から ${crash.dd.toFixed(1)}%` : "タップであそぶ 🐾"}
        </span>
      </div>

      {inEvent ? <WeatherScene state={crash} /> : <CorgiRoom amount={cur.principal} height={236} />}

      <div style={{ padding: "0 4px" }}>
        <ProgressBar value={toNext} color="var(--brand)"
          label={nextSt ? <span>次の <b style={{ color: "var(--text-brand)" }}>{nextSt.name}</b> まで 積立 あと ¥{YEN(nextSt.amount - cur.principal)}</span> : "最高ステージに到達！"}
          showValue={!!nextSt} />
      </div>
    </Card>
  );
}
