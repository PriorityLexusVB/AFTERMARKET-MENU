import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: true },
})


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: true },
})

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, cwd(), '');
  return {
    plugins: [react()],
    publicDir: false,
    define: {
      'process.env': env
    },
    build: { outDir: 'dist', sourcemap: true }
  }
})

