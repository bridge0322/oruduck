// 記憶する会話：これまでの積み重ね（撫でた回数・連続日数・得意な芸・図鑑の思い出など）を
// 犬が具体的な数字とともにふり返って話す。定型セリフと違い「自分のことを覚えていてくれる」
// 手ざわりを出すのが目的。すべて LifeState から導出し、外部データには依存しない。
import { callName, SLEEP_LABEL, SLEEP_STYLES } from "./lifeState";
import type { LifeState, MemoryKind } from "./lifeState";
import { TRICKS } from "./tricks";

export interface MemoryLine { id: string; text: string }

// 図鑑の思い出ラベル（DiaryScreen と重複しない最小限。芸・訪問・寝相・レア）。
const VISITOR_LABEL: Record<string, string> = {
  cat: "ねこ", bird: "ことり", butterfly: "ちょうちょ", squirrel: "りす",
  hedgehog: "はりねずみ", frog: "かえる", ladybug: "てんとうむし",
};
const RARE_LABEL: Record<string, string> = {
  butterfly: "ちょうちょと かけっこ", star: "ながれぼしの おねがい",
  twins: "ふたごの おともだち", moon: "まんげつの とおぼえ", rainbow: "にじいろの ひ",
};

function memoryLabel(k: MemoryKind): string {
  if (k.startsWith("visit_")) return `${VISITOR_LABEL[k.slice(6)] ?? "だれか"}が あそびに きた ひ`;
  if (k.startsWith("sleep_")) {
    const st = k.slice(6);
    return (SLEEP_STYLES as readonly string[]).includes(st) ? SLEEP_LABEL[st as keyof typeof SLEEP_LABEL] : "おひるね";
  }
  return RARE_LABEL[k] ?? "ふしぎな ひ";
}

// いちばん練習した芸の名前（習熟3回以上）。
function favoriteTrick(s: LifeState): string | null {
  const m = s.trickMastery || {};
  let bestId: string | null = null; let best = 0;
  for (const [id, n] of Object.entries(m)) if (n > best) { best = n; bestId = id; }
  if (!bestId || best < 3) return null;
  return TRICKS.find((t) => t.id === bestId)?.name ?? null;
}

// 条件を満たす思い出セリフを組み立て、ランダムに1本返す。何もなければ null。
export function pickMemoryLine(s: LifeState): MemoryLine | null {
  const name = callName(s);
  const cands: MemoryLine[] = [];

  if (s.petTotal >= 30)
    cands.push({ id: "mem-pet", text: `なでなで、いままでで ${s.petTotal}かいも してもらったんだよ。ぜんぶ おぼえてる` });
  if (s.visitDayCount >= 5)
    cands.push({ id: "mem-days", text: `${name}と あって ${s.visitDayCount}にちめ。まいにち たのしいなあ` });
  if (s.streak >= 3)
    cands.push({ id: "mem-streak", text: `${s.streak}にち れんぞくで あいに きてくれてるね。うれしくて しっぽ とまらない` });
  if ((s.ballBestCombo || 0) >= 5)
    cands.push({ id: "mem-ball", text: `ボール、いちばんで ${s.ballBestCombo}かい つづいた とき、すごかったよね！` });
  if (s.treatTotal >= 10)
    cands.push({ id: "mem-treat", text: `おやつ、ぜんぶで ${s.treatTotal}こ もらった。どれも おいしかったなあ` });
  if (s.hugTotal >= 5)
    cands.push({ id: "mem-hug", text: `ぎゅ〜、${s.hugTotal}かい してもらった。あったかいの、ちゃんと おぼえてるよ` });
  const trick = favoriteTrick(s);
  if (trick)
    cands.push({ id: "mem-trick", text: `${trick}、いっぱい れんしゅうしたね。いちばん とくいに なったよ` });
  const mem = (s.memories || [])[s.memories.length - 1];
  if (mem)
    cands.push({ id: "mem-book", text: `このまえの「${memoryLabel(mem.kind)}」、たのしかったね。また あるといいな` });
  if ((s.goalReached || []).length >= 1)
    cands.push({ id: "mem-goal", text: `おさんぽ、${s.goalReached.length}こめの ちてんまで きたね。${name}と いっしょに あるいたよ` });
  if (s.lastSettleMonth)
    cands.push({ id: "mem-settle", text: `つみたて、ちゃんと つづいてるね。こつこつ えらいの、しってるよ` });

  if (!cands.length) return null;
  return cands[Math.floor(Math.random() * cands.length)];
}
