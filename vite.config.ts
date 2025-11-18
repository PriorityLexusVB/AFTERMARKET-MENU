import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite automatically loads environment variables prefixed with VITE_
// from .env files and exposes them via import.meta.env
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})