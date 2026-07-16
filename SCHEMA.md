# localStorage スキーマ

オルックスの全状態は localStorage の2キーに永続化される。バックエンドはない。
スキーマを変更したら、このファイルと `migrateLife()` / `migrate()` を必ず同時に更新すること。
マイグレーションは冪等（何度実行しても安全）にする。

## キー1: `orucogi_personal_v1` — 積立記録（tracker）

定義: `src/features/tracker/logic/persistence.ts`（`migrate()` が欠損フィールドを補う）

```ts
{
  records: {
    t: number;          // 記録時刻 (epoch ms)
    principal: number;  // 投資元本
    value: number;      // 評価額
    units?: number;     // 保有口数（口数モードで記録した場合）
    nav?: number;       // 基準価額・1万口あたり（同上）
  }[],
  xp: number,           // ごはんの経験値
  feasts: { t: number; food: string; rank: number; amount: number }[],
  lastFed: number | null, // 最後にごはんをあげた時刻
}
```

## キー2: `oruduck_life_v1` — 生きている犬レイヤー（life）

定義: `src/features/life/lifeState.ts`。`SCHEMA_VERSION` は **17**。
`migrateLife()` が旧バージョンを補完する（スプレッドで defaultLife() の既定値を埋める）。

| フィールド | 型 | 導入 | 意味 |
|---|---|---|---|
| v | number | v1 | スキーマバージョン |
| name / honorific / onboarded | string?/enum/bool | v1 | 呼び名・敬称(chan/kun/none)・初期設定済み |
| bond / bondPetToday | number | v1 | なつき度0-100・きょう撫でで増えた分(上限10) |
| petTotal / petThankedAt / hugTotal / treatTotal | number | v1 | ふれあい累計 |
| today | DayStats | v1 | きょうの記録 {day,pets,hugs,treats,rare,market,settle,bond} |
| history | DayStats[] | v1 | 日ごとの記録（最大400日） |
| visitDayCount / streak / lastVisitDay | number/number/string? | v1 | 会った日数・連続日数・最終来訪日 |
| sadReunion | bool | v1 | 3日以上ぶり再会フラグ（演出で消費） |
| lastSeenValue | number? | v1 | 前回訪問時の評価額 |
| settleDay / lastSettleMonth | number?/string? | v1 | 毎月の積立日(1-31)・祝った月"YYYY-MM" |
| rareRolledDay / todayRare | string?/enum? | v1 | レア抽選日・当選種(butterfly/star/twins/moon) |
| memories | {day,kind}[] | v1 | おもいで図鑑（レア/visit_*/sleep_*） |
| usedLines | {id,day}[] | v1 | 旧セリフ重複回避（後方互換） |
| animLevel | "full"/"soft"/"min"/null | v1 | アニメ強度（null=端末設定に従う） |
| usedLinesV2 / pendingTomorrow | {id,day}[] / {day,kind?}? | v2 | 30日重複回避LRU(上限2000)・明日の予告（kind: settle/anniv=翌日の実イベントの確定予告・generic=汎用。旧データのkind無しはgeneric扱い） |
| wardrobe | {collar,bandana,hat,shirt: string?} | v3 | 着せ替え装着中（アイテムid） |
| ballBestCombo / trickMastery / lastBrushDay | number/Record/string? | v3 | 遊びの記録 |
| visitorRolledDay / todayVisitor | string?/enum? | v4 | 来訪動物の抽選（7種） |
| soundOn / soundVol | bool/number | v5 | 効果音（既定OFF） |
| houseThresholds / lastHouseLevel / milestoneShownAt | number[]/number/number | v6 | 家グレード・節目祝い済み |
| jackpotShownValue | number | v7 | ゾロ目スロット重複防止 |
| goalAmount / goalReached / diaryReplies / diaryReplyThanksDay / lettersOpened / awards / lastAwardWeek | — | v8 | 目標・交換日記・手紙・週間表彰 |
| playedDay / missionCheeredDay | string?/string? | v11 | きょうのおねがい（あそんだ印・達成祝い日） |
| pendingAbsence | number? | v12 | るすばん日記（空き日数、カードで消費） |
| adoptedDay / annivShownDay | string?/string? | v13 | お迎え日・記念日祝い済み日 |
| personality | "amaenbo"/"yancha"/"nonbiri"/null | v14 | 性格（名前+お迎え日から決定的に固定） |
| stageCelebrated | number | v15 | レベルアップ祝福済みの成長ステージ（0=未初期化→初回訪問で祝わず現在値に同期） |
| streakCelebrated | number | v16 | ストリーク節目（7/14/30/50/100/200/365/500/1000）の祝福済み最大値。migrationで現streak以下の最大節目に同期 |
| restTickets / ticketMonth / ticketUsedDay | number/string?/string? | v17 | お休み券（保有上限2・月替わり初訪問で+1・1日空きで自動消費しストリーク維持、犬が報告して消費） |

### 日付の扱い

- 日付キーは `dayKey()`（`src/features/life/time.ts`）= **Asia/Tokyo 固定**の "YYYY-MM-DD"。
  端末のタイムゾーン設定に依存しない（利用者は日本在住の前提）。
- 「気分の日」だけは朝5時境界（`moodDayKey()`）。

### バックアップ／復元

- `src/features/life/transfer.ts` — 2キーを `{app:"oruduck", v:1, at, personal, life}` の
  JSONにまとめ、"ORUX1."+base64(gzip(JSON)) のひきつぎコードにする。
  生JSON（`{`はじまり）のファイルもインポート可能。
