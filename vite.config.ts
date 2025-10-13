import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import fileURLToPath to handle ES module paths.
import { fileURLToPath } from 'url';

// Fix for both errors:
// 1. `process.cwd()` type error: This is replaced with `__dirname`.
// 2. `__dirname` not defined: This is defined for an ES module context using `import.meta.url`.
// This works because `vite.config.ts` is at the project root, making `__dirname` equivalent to `process.cwd()`.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, '');

    // Expose all environment variables to the client, stringified.
    const processEnv = {};
    for (const key in env) {
      if (Object.prototype.hasOwnProperty.call(env, key)) {
        processEnv[key] = JSON.stringify(env[key]);
      }
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env': processEnv,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    };
});
