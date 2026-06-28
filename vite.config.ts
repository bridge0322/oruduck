import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base は GitHub Pages（https://<user>.github.io/orucogi/）で動かすための設定。
// リポジトリ名を変える場合はここも合わせて変更してください。
export default defineConfig({
  base: '/oruduck/',
  plugins: [react()],
})
