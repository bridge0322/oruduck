// おもいで図鑑のラベル。DiaryScreen（図鑑）と GrowthAlbum（成長アルバム）で共有する。
import type { MemoryKind } from "./lifeState";

export const MEMORY_META: Record<MemoryKind, { emoji: string; label: string }> = {
  butterfly: { emoji: "🦋", label: "ちょうちょと かけっこ" },
  star: { emoji: "🌠", label: "ながれぼしに おねがい" },
  twins: { emoji: "🐶", label: "ふたごの おともだち" },
  moon: { emoji: "🌕", label: "まんげつの とおぼえ" },
  rainbow: { emoji: "🌈", label: "にじいろダックスフンドの ひ" },
  visit_cat: { emoji: "🐱", label: "ねこが あそびに きた" },
  visit_bird: { emoji: "🐦", label: "ことりが あそびに きた" },
  visit_butterfly: { emoji: "🦋", label: "ちょうちょが あそびに きた" },
  visit_squirrel: { emoji: "🐿️", label: "りすが あそびに きた" },
  visit_hedgehog: { emoji: "🦔", label: "はりねずみが あそびに きた" },
  visit_frog: { emoji: "🐸", label: "かえるが あそびに きた" },
  visit_ladybug: { emoji: "🐞", label: "てんとうむしが あそびに きた" },
  sleep_curl: { emoji: "😴", label: "まるまり ねんね" },
  sleep_flat: { emoji: "😴", label: "ぺたんこ ねんね" },
  sleep_side: { emoji: "😴", label: "よこむき ねんね" },
  sleep_ball: { emoji: "😴", label: "まんまる ねんね" },
  sleep_loose: { emoji: "😴", label: "だらり ねんね" },
};

// 未知のkind（将来追加）でも落ちないようにフォールバック。
export const metaOf = (k: MemoryKind) => MEMORY_META[k] || { emoji: "✨", label: "たのしい できごと" };
