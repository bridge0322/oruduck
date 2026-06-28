import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base は GitHub Pages（https://<user>.github.io/oruduck/）で動かすための設定。
// 出力ファイル名はハッシュを付けず固定にする。こうすると更新（再デプロイ）しても
// ファイル名が変わらないため、ホーム画面に保存した古いページが「存在しないファイル」を
// 読みに行って 404（File not found）になる事故を防げる。
export default defineConfig({
  base: '/oruduck/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
