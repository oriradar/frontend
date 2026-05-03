import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const here = fileURLToPath(new URL('.', import.meta.url));
const parent = fileURLToPath(new URL('..', import.meta.url));

/** Monorepo : `.env` à la racine du dépôt. Dépot [oriradar/frontend](https://github.com/oriradar/frontend) seul : `.env` ici. */
function pickEnvDir() {
  const inParent = (name) => existsSync(join(parent, name));
  if (
    inParent('.env') ||
    inParent('.env.local') ||
    inParent('.env.development') ||
    inParent('.env.development.local')
  ) {
    return parent;
  }
  return here;
}

export default defineConfig({
  envDir: pickEnvDir(),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api/oriradar': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/oriradar/, '')
      }
    }
  }
});
