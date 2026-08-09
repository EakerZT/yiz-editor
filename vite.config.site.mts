import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/yiz-editor/',
  plugins: [vue()],
  resolve: {
    alias: {
      'yiz-editor': fileURLToPath(new URL('./scripts', import.meta.url))
    }
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true
  }
})
