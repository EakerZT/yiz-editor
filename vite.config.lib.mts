import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./scripts/index.ts', import.meta.url)),
      name: 'YizEditor',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'yiz-editor.mjs' : 'yiz-editor.cjs'),
      cssFileName: 'yiz-editor'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
