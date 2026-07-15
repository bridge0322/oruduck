import type { Record_ } from "./persistence";

export interface GoalForecast {
  perMonth: number;    // 月あたりの積立ペース（元本の増加額）
  monthsLeft: number;  // 目標到達までの見込み月数
  etaLabel: string;    // 「YYYYねん Mがつごろ」
}

// 目標ペース予測：直近の積立ペース（元本の増加）から、目標額到達までの見込みを出す。
// 評価額でなく元本で測るので、相場の上下に振り回されない「自分のがんばり」の予測になる。
// 直近120日の記録で推定し、薄ければ全期間。2週間未満・ほぼ増えていない場合は出さない。
export function goalForecast(records: Record_[], goalAmount: number, now = Date.now()): GoalForecast | null {
  if (!records.length || goalAmount <= 0) return null;
  const last = records[records.length - 1];
  if (last.principal >= goalAmount) return null; // すでに到達
  const windowStart = now - 120 * 86400000;
  let base = records.filter((r) => r.t >= windowStart);
  if (base.length < 2) base = records;
  if (base.length < 2) return null;
  const first = base[0];
  const spanMs = last.t - first.t;
  if (spanMs < 14 * 86400000) return null;
  const perMonth = ((last.principal - first.principal) / spanMs) * 30.44 * 86400000;
  if (perMonth < 1000) return null;
  const monthsLeft = (goalAmount - last.principal) / perMonth;
  const eta = new Date(now + monthsLeft * 30.44 * 86400000);
  return { perMonth, monthsLeft, etaLabel: `${eta.getFullYear()}ねん ${eta.getMonth() + 1}がつごろ` };
}
