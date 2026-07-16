// データの引き継ぎ（バックアップ／復元）。
// 積立記録（orucogi_personal_v1）と生活データ（oruduck_life_v1）を
// 1つの「ひきつぎコード」にまとめる。サーバ不要・端末間はコピペ or ファイルで運ぶ。
// 形式: "ORUX1." + base64(gzip(JSON))。gzip非対応環境では "ORUX0." + base64(JSON)。
import { dayKey } from "./time";

const KEYS = { personal: "orucogi_personal_v1", life: "oruduck_life_v1" } as const;

const MAGIC_GZ = "ORUX1.";
const MAGIC_RAW = "ORUX0.";

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const CH = 0x8000; // call stack を溢れさせないチャンクサイズ
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode(...bytes.subarray(i, i + CH));
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function gzip(data: Uint8Array): Promise<Uint8Array | null> {
  try {
    if (typeof CompressionStream === "undefined") return null;
    const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function gunzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// いまの端末のデータから、ひきつぎコードを作る。
export async function makeTransferCode(): Promise<string> {
  const payload: Record<string, unknown> = { app: "oruduck", v: 1, at: new Date().toISOString() };
  try {
    const personal = localStorage.getItem(KEYS.personal);
    if (personal) payload.personal = JSON.parse(personal);
  } catch { /* 壊れた記録は含めない */ }
  try {
    const life = localStorage.getItem(KEYS.life);
    if (life) payload.life = JSON.parse(life);
  } catch { /* 同上 */ }
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const gz = await gzip(bytes);
  return gz ? MAGIC_GZ + bytesToBase64(gz) : MAGIC_RAW + bytesToBase64(bytes);
}

export interface ImportResult { ok: boolean; error?: string }

// バックアップの中身をスキーマ検証する。壊れたデータで localStorage を
// 上書きしないための関門（失敗したら一切書き込まない）。
function validatePayload(payload: Record<string, unknown>): string | null {
  if (!payload || typeof payload !== "object") return "データの かたちが ちがうみたい";
  if (!payload.personal && !payload.life) return "ひきつぎデータが みつからなかったよ";
  if (payload.personal) {
    const p = payload.personal as Record<string, unknown>;
    if (typeof p !== "object" || !Array.isArray(p.records)) return "つみたて記録が こわれているみたい";
    for (const r of p.records as unknown[]) {
      const rr = r as Record<string, unknown>;
      if (typeof rr?.t !== "number" || typeof rr?.value !== "number") return "つみたて記録が こわれているみたい";
    }
  }
  if (payload.life) {
    const l = payload.life as Record<string, unknown>;
    if (typeof l !== "object" || typeof l.v !== "number") return "犬の データが こわれているみたい";
  }
  return null;
}

// ひきつぎコード（またはバックアップファイルの中身）を読み込んで localStorage に反映する。
// 成功したら呼び出し側でページを再読み込みすること（アプリは起動時にデータを読むため）。
export async function applyTransferCode(code: string): Promise<ImportResult> {
  try {
    const t = code.trim();
    let jsonBytes: Uint8Array;
    if (t.startsWith(MAGIC_GZ) || t.startsWith(MAGIC_RAW)) {
      // base64 部分はコピペで混ざりがちな空白・改行を除去してから復号
      const b64 = t.slice(MAGIC_GZ.length).replace(/\s+/g, "");
      const bytes = base64ToBytes(b64);
      jsonBytes = t.startsWith(MAGIC_GZ) ? await gunzip(bytes) : bytes;
    } else if (t.startsWith("{")) {
      jsonBytes = new TextEncoder().encode(t); // 生JSONのバックアップファイルも受け付ける
    } else {
      return { ok: false, error: "ひきつぎコードの かたちが ちがうみたい" };
    }
    const payload = JSON.parse(new TextDecoder().decode(jsonBytes)) as Record<string, unknown>;
    const bad = validatePayload(payload);
    if (bad) return { ok: false, error: bad };
    if (payload.personal) localStorage.setItem(KEYS.personal, JSON.stringify(payload.personal));
    if (payload.life) localStorage.setItem(KEYS.life, JSON.stringify(payload.life));
    return { ok: true };
  } catch {
    return { ok: false, error: "よみこみに しっぱいしたよ。コードを たしかめてね" };
  }
}

// ひきつぎコードをテキストファイルとして保存する。
export function downloadTransferCode(code: string) {
  downloadBlob(new Blob([code], { type: "text/plain" }), `oruduck-hikitsugi-${dayKey()}.txt`);
}

// 全データを素のJSONファイルとして保存する（人間可読なバックアップ）。
// 復元は applyTransferCode が生JSONも受け付けるので同じ導線でよい。
export function downloadBackupJson() {
  const payload: Record<string, unknown> = { app: "oruduck", v: 1, at: new Date().toISOString() };
  try {
    const personal = localStorage.getItem(KEYS.personal);
    if (personal) payload.personal = JSON.parse(personal);
  } catch { /* 壊れた記録は含めない */ }
  try {
    const life = localStorage.getItem(KEYS.life);
    if (life) payload.life = JSON.parse(life);
  } catch { /* 同上 */ }
  const name = `oruduck_backup_${dayKey().replaceAll("-", "")}.json`;
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), name);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
