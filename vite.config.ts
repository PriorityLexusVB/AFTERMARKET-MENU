import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // FIX: Replaced `process.cwd()` with `'.'` to resolve a TypeScript type error.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    publicDir: false,
    define: {
      'process.env': env
    },
    build: { outDir: 'dist', sourcemap: true }
  }
})
