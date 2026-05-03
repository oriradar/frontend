import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  /** Load `.env` from repo root (parent of `frontend/`) so existing setup keeps working. */
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // Local dev: set VITE_SCAN_API_BASE_URL=/api/oriradar and run oritypo-solver
      // (uvicorn, default port 8000). Calls to /api/oriradar/v1/scans are proxied
      // to http://127.0.0.1:8000/v1/scans.
      '/api/oriradar': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/oriradar/, '')
      }
    }
  }
});
