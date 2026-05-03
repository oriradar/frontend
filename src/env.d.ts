/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Oriradar oritypo-solver API base URL (e.g. /api/oriradar in dev with Vite proxy,
   *  or https://api.example.com in production). The frontend calls {base}/v1/scans. */
  readonly VITE_SCAN_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
