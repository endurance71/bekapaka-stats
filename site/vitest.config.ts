import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@bekapaka/safari-overlay': fileURLToPath(new URL('../packages/safari-overlay/index.ts', import.meta.url)) },
    dedupe: ['react', 'react-dom'],
  },
})
