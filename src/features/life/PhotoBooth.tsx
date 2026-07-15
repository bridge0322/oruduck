import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";
import { LifeCorgi } from "./LifeCorgi";
import { callName, withHonorific } from "./lifeState";
import type { LifeState } from "./lifeState";
import { outfitOf } from "./dressup";
import { YEN } from "../tracker/logic/format";
import { ROOM_STAGES, roomLevelFromAmount, endlessStage } from "../tracker/logic/roomStages";
import type { Record_ } from "../tracker/logic/persistence";

export interface PhotoBoothProps {
  life: LifeState;
  records: Record_[];
}

// きねん撮影：いまの子（着せ替え・称号・いっしょの日数・日付）を1枚の画像にして
// 保存・共有できる。バックエンドなしの「見せられる思い出」。金額はプライバシーに
// かかわるので、のせるかどうかを選べる（既定はのせない）。
export function PhotoBooth({ life, records }: PhotoBoothProps) {
  const [img, setImg] = useState<string | null>(null);
  const [withAmount, setWithAmount] = useState(false);
  const [busy, setBusy] = useState(false);

  const cur = records.length ? records[records.length - 1] : null;
  const principal = cur ? cur.principal : 0;
  const level = roomLevelFromAmount(principal);
  const endless = endlessStage(principal);
  const title = endless ? endless.title : ROOM_STAGES[level - 1].name;

  const take = async () => {
    setBusy(true);
    try {
      const svgStr = renderToStaticMarkup(
        <LifeCorgi level={level} pose="sit" legPhase={0} tailWag={16} eyes="happy" mouth="tongue" blush outfit={outfitOf(life.wardrobe)} />
      );
      const svgUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(
        svgStr.startsWith("<svg") ? svgStr.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"') : svgStr
      )));
      const dog = new Image();
      await new Promise<void>((res, rej) => { dog.onload = () => res(); dog.onerror = () => rej(new Error("svg")); dog.src = svgUrl; });

      const W = 720, H = 900;
      const cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      const g = cv.getContext("2d")!;

      // 背景：あかるい空→草原
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#CBE7F5"); sky.addColorStop(0.62, "#EDF6E4"); sky.addColorStop(0.62, "#CFE7B4"); sky.addColorStop(1, "#B9DB9B");
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      // おひさま
      g.fillStyle = "#FFE9A8"; g.beginPath(); g.arc(W - 110, 110, 52, 0, Math.PI * 2); g.fill();

      // 犬（中央）
      const dw = 460; const dh = dw * (388 / 400);
      g.drawImage(dog, (W - dw) / 2, H * 0.62 - dh + 40, dw, dh);

      // 下の帯
      g.fillStyle = "rgba(255,252,247,0.94)";
      const bandY = H - 250;
      g.beginPath(); g.roundRect(28, bandY, W - 56, 250 - 28, 24); g.fill();

      const name = life.name ? withHonorific(life.name, life.honorific) : "わたし";
      g.textAlign = "center"; g.fillStyle = "#5A4632";
      g.font = "900 40px 'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif";
      g.fillText(`${name}と いっしょに ${life.visitDayCount}日目`, W / 2, bandY + 62);
      g.font = "800 30px 'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif";
      g.fillStyle = "#C77F35";
      g.fillText(`「${title}」`, W / 2, bandY + 112);
      let line3 = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
      if (withAmount && cur) line3 += `　オルカン ¥${YEN(cur.value)}`;
      g.font = "700 24px 'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif";
      g.fillStyle = "#8A7358";
      g.fillText(line3, W / 2, bandY + 158);
      g.font = "700 20px sans-serif";
      g.fillText("🐾 オルックス", W / 2, bandY + 198);

      setImg(cv.toDataURL("image/png"));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!img) return;
    const a = document.createElement("a");
    a.href = img;
    a.download = `oruduck-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)", flex: 1 }}>📸 きねん撮影</div>
        <label style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={withAmount} onChange={(e) => setWithAmount(e.target.checked)} style={{ width: 16, height: 16 }} />
          きんがくも のせる
        </label>
      </div>
      <Button variant="secondary" size="md" fullWidth onClick={take} disabled={busy} iconLeft={<i className="ph-fill ph-camera" />}>
        {busy ? "さつえいちゅう…" : `${callName(life)}と いまの きねんを のこす`}
      </Button>

      {img && (
        <div onClick={() => setImg(null)} style={{ position: "fixed", inset: 0, zIndex: 80, maxWidth: 480, margin: "0 auto", background: "rgba(60,45,35,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: 14, width: "100%", maxWidth: 340, boxShadow: "var(--shadow-lg)", animation: "pop-in .3s var(--ease-bounce)" }}>
            <img src={img} alt="きねん写真" style={{ width: "100%", borderRadius: "var(--radius-md)", display: "block" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Button variant="primary" size="md" fullWidth onClick={save} iconLeft={<i className="ph ph-download-simple" />}>ほぞん</Button>
              <Button variant="secondary" size="md" fullWidth onClick={() => setImg(null)}>とじる</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
