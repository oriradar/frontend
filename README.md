# Oriradar — frontend

Vue 3 + Vite + Vue Router + Supabase client.

Ce dossier est aussi publié tel quel sur **[github.com/oriradar/frontend](https://github.com/oriradar/frontend)** (`./scripts/publish-to-frontend-repo.sh` depuis le monorepo).

## Commands

**Dans le monorepo** (`oriradar/`) :

```bash
cd frontend && npm install && npm run dev
```

**Clone du dépôt [oriradar/frontend](https://github.com/oriradar/frontend) seul** :

```bash
git clone https://github.com/oriradar/frontend.git && cd frontend
npm install && npm run dev
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run check-supabase` | Vérifie URL / clés Supabase (lit le `.env` adapté) |
| `npm run generate-countries` | Régénère `src/data/countries.json` |

## Environment

- **Monorepo** : copier `.env.example` → **`.env` à la racine du dépôt parent** (là où vivent `backend/`, `supabase/`), si ce fichier existe — sinon `.env` dans `frontend/`.
- **Dépôt [oriradar/frontend](https://github.com/oriradar/frontend) seul** : copier `.env.example` → **`.env` à la racine du clone** (à côté de `package.json`).

Vite choisit le dossier d’env via `vite.config.js` (`envDir`).

## Local scan API proxy

Avec `VITE_SCAN_API_BASE_URL=/api/oriradar`, Vite proxifie vers `http://127.0.0.1:8000` — voir `vite.config.js`.

## Layout

- `src/` — application code
- `public/` — static assets for `dist/`
- `scripts/` — maintenance (pays, check Supabase)
