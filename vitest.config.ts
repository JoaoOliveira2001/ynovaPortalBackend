import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'whatwg-fetch': resolve(rootDir, 'src/test/polyfills/whatwg-fetch.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setupTests.ts'],
    coverage: {
      reporter: ['text', 'json-summary', 'html'],
    },
    env: {
      VITE_USE_MOCKS: 'true',
    },
  },
})
