import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'yiz-editor': fileURLToPath(new URL('./scripts', import.meta.url))
    }
  },
  test: {
    environment: 'node'
  }
})
