import { useState } from "react";
import type { CSSProperties } from "react";
import { recognize } from "tesseract.js";
import { Button } from "../../design-system/Button";
import { Badge } from "../../design-system/Badge";
import { SegmentedControl } from "../../design-system/SegmentedControl";
import { Input } from "../../design-system/Input";
import { Sheet } from "./Sheet";
import { decodeBuffer, extractHoldings, isOrukan, toNum } from "./logic/csv";
import type { Fund } from "./logic/csv";
import { parseOcr } from "./logic/ocr";
import { YEN } from "./logic/format";

export interface ImportSheetProps {
  onClose: () => void;
  onSave: (rec: { principal: number | null; value: number }) => void;
}

const dropS: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: "var(--radius-md)", border: "2px dashed var(--border-strong)", background: "var(--surface-card)", color: "var(--text-brand)", fontFamily: "var(--font-body)", fontWeight: 700, cursor: "pointer" };
const errS: CSSProperties = { color: "var(--negative)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: 12 };

export function ImportSheet({ onClose, onSave }: ImportSheetProps) {
  const [mode, setMode] = useState("csv");
  const [funds, setFunds] = useState<Fund[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [picked, setPicked] = useState<Fund | null>(null);
  const [ocrState, setOcrState] = useState<"idle" | "running" | "done">("idle");
  const [prog, setProg] = useState(0);
  const [pIn, setPIn] = useState("");
  const [vIn, setVIn] = useState("");

  const onCsv = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = decodeBuffer(reader.result as ArrayBuffer);
      const { error, funds } = extractHoldings(text);
      if (error) { setErr(error); setFunds([]); return; }
      if (!funds.length) { setErr("保有商品が見つかりませんでした。"); setFunds([]); return; }
      setErr(null); setFunds(funds);
      const ork = funds.find((f) => isOrukan(f.name));
      setPicked(ork || (funds.length === 1 ? funds[0] : null));
    };
    reader.readAsArrayBuffer(file);
  };

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    setErr(null); setOcrState("running"); setProg(0);
    try {
      const { data } = await recognize(file, "jpn+eng", {
        logger: (m) => { if (m.status === "recognizing text") setProg(Math.round(m.progress * 100)); },
      });
      const res = parseOcr(data.text || "");
      setPIn(res.principal != null ? String(Math.round(res.principal)) : "");
      setVIn(res.value != null ? String(Math.round(res.value)) : "");
      setOcrState("done");
    } catch {
      setErr("画像を読み取れませんでした。別のスクショか手入力をお試しください。");
      setOcrState("idle");
    }
  };

  const p = toNum(pIn), v = toNum(vIn);
  const ocrOk = !isNaN(p) && !isNaN(v) && p > 0;

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 38 }}>{mode === "csv" ? "📥" : "📸"}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-xl)", color: "var(--text-strong)", marginTop: 2 }}>楽天証券から取り込む</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SegmentedControl value={mode} onChange={setMode}
          options={[{ value: "csv", label: "CSVファイル" }, { value: "img", label: "スクショ画像" }]} />
      </div>

      {mode === "csv" && (
        <div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center", marginBottom: 12, lineHeight: 1.5 }}>
            楽天証券 ＞ 保有商品一覧 ＞「CSVで保存」のファイルを選択。<br />元本は「評価額 − 評価損益」で自動計算します。
          </div>
          <label style={{ display: "block", marginBottom: 12 }}>
            <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => onCsv(e.target.files?.[0])} />
            <span style={dropS}><i className="ph ph-file-csv" style={{ fontSize: 22 }} /> CSVファイルを選ぶ</span>
          </label>
          {err && <div style={errS}>{err}</div>}
          {funds && funds.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>反映する銘柄を選択</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
                {funds.map((f, i) => {
                  const sel = picked === f;
                  return (
                    <button key={i} onClick={() => setPicked(f)} style={{ textAlign: "left", padding: "10px 12px", borderRadius: "var(--radius-sm)", border: `2px solid ${sel ? "var(--brand)" : "var(--border)"}`, background: sel ? "var(--brand-soft)" : "var(--surface-card)", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                        {isOrukan(f.name) && <Badge tone="brand">オルカン</Badge>}
                      </div>
                      <div style={{ fontFamily: "var(--font-number)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                        評価額 ¥{YEN(f.value)}{!isNaN(f.principal) ? ` ／ 元本 ¥${YEN(f.principal)}` : "（元本は手入力）"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Button variant="primary" size="lg" fullWidth disabled={!picked || isNaN(picked.value)}
            onClick={() => picked && onSave({ principal: isNaN(picked.principal) ? null : picked.principal, value: picked.value })}
            iconLeft={<i className="ph-fill ph-check" />}>この内容で反映</Button>
        </div>
      )}

      {mode === "img" && (
        <div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center", marginBottom: 12, lineHeight: 1.5 }}>
            楽天証券アプリの「保有商品」画面のスクショを選択。<br />評価額・評価損益が写っていればOK（読み取り後に確認・修正できます）。
          </div>
          <label style={{ display: "block", marginBottom: 12 }}>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onImage(e.target.files?.[0])} />
            <span style={dropS}><i className="ph ph-image" style={{ fontSize: 22 }} /> スクショ画像を選ぶ</span>
          </label>
          {ocrState === "running" && (
            <div style={{ textAlign: "center", marginBottom: 12, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-brand)" }}>
              読み取り中… {prog}%<div style={{ marginTop: 8 }}><div style={{ height: 8, borderRadius: 999, background: "var(--cream-200)", overflow: "hidden" }}><div style={{ width: `${prog}%`, height: "100%", background: "var(--brand)", transition: "width .2s" }} /></div></div>
            </div>
          )}
          {err && <div style={errS}>{err}</div>}
          {ocrState === "done" && (
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>読み取り結果（確認して必要なら修正）</div>
              <Input label="投資元本（取得金額）" prefix="¥" inputMode="numeric" value={pIn} onChange={(e) => setPIn(e.target.value)} style={{ marginBottom: 10 }} />
              <Input label="評価額（時価）" prefix="¥" inputMode="numeric" value={vIn} onChange={(e) => setVIn(e.target.value)} style={{ marginBottom: 4 }} />
              <div style={{ textAlign: "center", minHeight: 20, marginBottom: 12, fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {ocrOk ? `評価損益 ${v - p >= 0 ? "+" : "−"}¥${YEN(Math.abs(v - p))}（${((v - p) / p * 100).toFixed(2)}%）` : "数字を確認してください"}
              </div>
              <Button variant="primary" size="lg" fullWidth disabled={!ocrOk}
                onClick={() => onSave({ principal: p, value: v })} iconLeft={<i className="ph-fill ph-check" />}>この内容で反映</Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
