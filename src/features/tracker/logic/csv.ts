export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [], val = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { val += '"'; i++; } else q = false; }
      else val += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ",") { cur.push(val); val = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        if (val !== "" || cur.length) { cur.push(val); rows.push(cur); cur = []; val = ""; }
      } else val += ch;
    }
  }
  if (val !== "" || cur.length) { cur.push(val); rows.push(cur); }
  return rows;
}

export const toNum = (s: unknown): number => {
  if (s == null) return NaN;
  const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? NaN : n;
};

export function findCol(headers: string[], includes: string[], excludes: string[] = []): number {
  return headers.findIndex((h) => {
    const t = (h || "").replace(/\s/g, "");
    return includes.some((k) => t.includes(k)) && !excludes.some((k) => t.includes(k));
  });
}

export interface Fund {
  name: string;
  value: number;
  pl: number;
  principal: number;
}

export function extractHoldings(text: string): { error: string | null; funds: Fund[] } {
  const rows = parseCSV(text);
  if (!rows.length) return { error: "CSVを読み取れませんでした。", funds: [] };
  let hi = rows.findIndex((r) => r.some((c) => /ファンド名|銘柄|ファンド/.test(c || "")));
  if (hi < 0) hi = 0;
  const headers = rows[hi];
  const nameCol = findCol(headers, ["ファンド名", "銘柄", "ファンド"]);
  const valCol = findCol(headers, ["評価額", "時価評価額"], ["損益"]);
  const plCol = findCol(headers, ["評価損益"], ["率", "％", "%"]);
  if (valCol < 0) return { error: "「評価額」の列が見つかりませんでした。手入力をご利用ください。", funds: [] };
  const funds: Fund[] = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length <= valCol) continue;
    const name = (nameCol >= 0 ? r[nameCol] : r[0]) || "";
    const value = toNum(r[valCol]);
    const pl = plCol >= 0 ? toNum(r[plCol]) : NaN;
    if (!name.trim() || isNaN(value)) continue;
    const principal = !isNaN(pl) ? value - pl : NaN;
    funds.push({ name: name.trim(), value, pl, principal });
  }
  return { error: null, funds };
}

export function decodeBuffer(buf: ArrayBuffer): string {
  try {
    const sjis = new TextDecoder("shift_jis").decode(buf);
    if (!/�/.test(sjis)) return sjis;
    const utf = new TextDecoder("utf-8").decode(buf);
    return (utf.match(/�/g) || []).length < (sjis.match(/�/g) || []).length ? utf : sjis;
  } catch {
    return new TextDecoder("utf-8").decode(buf);
  }
}

export const isOrukan = (name: string) => /オール[・･]?カントリー|全世界株式|オルカン/.test(name);
