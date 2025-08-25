// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
)

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    proxy: {
      // Forward all /api requests to backend
      '/api': {
        target: 'http://localhost:10000', // your backend port
        changeOrigin: true,
      },
    },
  },
})
