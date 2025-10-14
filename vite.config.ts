import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: 'src/test/setup.ts',
  }
})
