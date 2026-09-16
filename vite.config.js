import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      // Previously provided by @base44/vite-plugin; jsconfig.json's "@/*" path
      // only helps editor/TS tooling, it doesn't affect Vite's own resolver.
      '@': path.resolve(__dirname, './src'),
    },
  },
});
