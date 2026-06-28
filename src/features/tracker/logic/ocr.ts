import { toNum } from "./csv";

export function ocrYen(s: unknown): number[] {
  const m = String(s).match(/-?[0-9][0-9,]{2,}/g);
  return m ? m.map((x) => toNum(x)).filter((n) => !isNaN(n) && Math.abs(n) >= 100) : [];
}

export interface OcrResult {
  value: number | null;
  principal: number | null;
  raw: string;
}

export function parseOcr(text: string): OcrResult {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let value: number | null = null, principal: number | null = null, pl: number | null = null, plNeg = false;
  lines.forEach((l, i) => {
    const here = l + " " + (lines[i + 1] || "");
    if (value == null && /評価額|時価評価額/.test(l) && !/損益/.test(l)) {
      const ns = ocrYen(here); if (ns.length) value = Math.abs(ns[0]);
    }
    if (principal == null && /取得金額|取得額|取得価額|投資元本|元本/.test(l)) {
      const ns = ocrYen(here); if (ns.length) principal = Math.abs(ns[0]);
    }
    if (pl == null && /評価損益|損益/.test(l) && !/率|％|%/.test(l)) {
      const seg = here.replace(/[％%]/g, "");
      const ns = ocrYen(seg); if (ns.length) { pl = Math.abs(ns[0]); plNeg = /[-△▲]/.test(seg); }
    }
  });
  if (value == null) { const all = lines.flatMap(ocrYen).map(Math.abs); if (all.length) value = Math.max(...all); }
  if (pl != null && plNeg) pl = -pl;
  if (principal == null && value != null && pl != null) principal = value - pl;
  return { value, principal, raw: text };
}
