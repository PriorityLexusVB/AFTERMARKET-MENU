import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Replaced process.cwd() with '' to avoid a TypeScript type error.
  // loadEnv resolves an empty string to the current working directory.
  const env = loadEnv(mode, '', '');
  return {
    plugins: [react()],
    publicDir: false,
    build: {
      outDir: 'dist'
    },
    define: {
      'process.env.API_KEY': env.API_KEY ? JSON.stringify(env.API_KEY) : '""',
      'process.env.FIREBASE_CONFIG': env.FIREBASE_CONFIG ? JSON.stringify(env.FIREBASE_CONFIG) : '""',
      'process.env.SUPABASE_URL': env.SUPABASE_URL ? JSON.stringify(env.SUPABASE_URL) : '""',
      'process.env.SUPABASE_ANON_KEY': env.SUPABASE_ANON_KEY ? JSON.stringify(env.SUPABASE_ANON_KEY) : '""',
    }
  }
})
