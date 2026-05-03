# Oriradar — frontend

Vue 3 + Vite + Vue Router + Supabase client. **All** npm dependencies and UI code live here.

## Commands

```bash
cd frontend
npm install
npm run dev
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build → `dist/` (inside `frontend/`) |
| `npm run preview` | Preview production build |
| `npm run check-supabase` | Verify Supabase URL/keys (reads repo root `.env`) |
| `npm run generate-countries` | Regenerate `src/data/countries.json` from REST Countries API |

## Environment

Copy **`.env.example`** from this folder to **`.env` at the repository root** (parent of `frontend/`). Vite is configured with `envDir: '..'` so variables are loaded from there.

## Local scan API proxy

The frontend talks to **oritypo-solver** (the Oriradar FastAPI backend) via `{VITE_SCAN_API_BASE_URL}/v1/scans`. For local dev with the backend on `http://127.0.0.1:8000`:

- Set `VITE_SCAN_API_BASE_URL=/api/oriradar` in the root `.env`
- Vite proxies `/api/oriradar/*` → `http://127.0.0.1:8000/*` (see `vite.config.js`)
- In production, set `VITE_SCAN_API_BASE_URL=https://api.your-domain.com`

## Layout

- `src/` — application code
- `public/` — static assets for `dist/`
- `scripts/` — maintenance scripts (e.g. country list generation)
