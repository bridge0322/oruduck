# オルックス（oruduck）開発ガイド

妻・ゆうり向けの「投資×犬育成」アプリ。目的はオルカン積立を楽しく続けてもらうこと。
設計の最上位原則は **明日また開きたくなること（daily retention）**。すべての実装判断は
この原則に照らして行う。

公開URL: https://bridge0322.github.io/oruduck/ （main への push で `.github/workflows/deploy.yml` が自動デプロイ）

## 技術スタック（現状）

- React 18 + TypeScript + Vite（`rolldown-vite`）。GitHub Pages 配信の静的SPA。
- 検証: `npm run lint`（oxlint・警告ゼロ維持）と `npm run build`。テストランナーは無い。
  UI検証は `npm run preview` + Playwright（グローバル: `/opt/pw-browsers/chromium`）で
  スクリーンショット確認するのが慣例。

## 絶対制約（違反不可）

1. **静的サイト・バックエンドなし。** 全状態は localStorage（`SCHEMA.md` 参照）。
   サーバー・API・DB前提のコードを書かない（天気の Open-Meteo 取得のみ例外として既存）。
2. **新しい依存・フレームワーク・ビルドツールを追加しない。** 既存スタックの範囲で書く。
3. **犬のリグ（`src/features/life/LifeCorgi.tsx`）の構造変更は禁止。**
   props（pose/eyes/mouth/lift/outfit/sleepStyle…）駆動のSVGで、体・頭・脚・首輪の
   グループ変換の関係が調整済み。リグに触れた場合は「立ち→おすわり→（お手の芸）→立ち」
   「寝相5種＋首輪」の描画を目視確認できる状態にすること。
4. **localStorage スキーマ変更時は必ず冪等なマイグレーションを実装**（`migrateLife()` /
   `migrate()`）。既存ユーザーのなつき度・日記・訪問履歴が消えるのは最悪の障害。
   変更のたびに `SCHEMA.md` を更新する。
5. **コミットは機能1つにつき1コミット。** コミットメッセージに動作確認内容を書く。

## 作業手順

1. 書き始める前にリポジトリの現状を読む。特に `lifeState.ts`（状態とマイグレーション）、
   `CompanionStage.tsx`（アニメーションループ・イベントキュー・セリフ）、
   `dialogueEngineV2.ts`（条件マッチ＋30日重複回避）、`roomStages.ts`（成長）。推測で書かない。
2. スキーマを変えたら `SCHEMA.md` を更新。
3. 機能ごとに lint / build / Playwright スクリーンショットで動作確認してからコミット。
4. スコープ外の改善に気づいたら実装せず `TODO.md` に書き残す。

## 日付の扱い

日付キーは `dayKey()` = Asia/Tokyo 固定。利用者は日本在住前提で、端末TZに依存させない。

## 姉妹アプリ

`bridge0322/orucogi`（オルコギ・コーギー版）は同系のコードベース。oruduck に入れた機能は
基本的にオルコギにも移植する（別リポジトリ・別セッションが必要）。犬のデザインは
リポジトリごとに固有（oruduck=ダックスフンド風、orucogi=コーギー）で、混ぜないこと。
