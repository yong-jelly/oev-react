import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5166
  },
  build: {
    // iOS Safari 호환성을 위한 타겟 설정
    target: ['es2020', 'safari14', 'chrome87', 'firefox78'],
  },
  esbuild: {
    // esbuild 타겟도 동일하게 설정
    target: 'es2020',
  },
})
