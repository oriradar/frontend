/**
 * Vérifie que Supabase répond (URL + clé anon).
 * Racine `.env` : dossier parent du monorepo si présent, sinon racine du dépôt frontend seul.
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

var scriptDir = dirname(fileURLToPath(import.meta.url));
var root = resolve(scriptDir, '..');
var envHere = join(root, '.env');
var envUp = join(resolve(root, '..'), '.env');
if (!existsSync(envHere) && existsSync(envUp)) {
  root = resolve(root, '..');
}

function parseEnvFile(path) {
  var out = {};
  if (!existsSync(path)) return out;
  var text = readFileSync(path, 'utf8');
  var lines = text.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    var v = m[2].trim();
    if (
      (v.charAt(0) === '"' && v.slice(-1) === '"') ||
      (v.charAt(0) === "'" && v.slice(-1) === "'")
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

var envFile = parseEnvFile(join(root, '.env'));
var url =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  envFile.VITE_SUPABASE_URL ||
  envFile.SUPABASE_URL;
var key =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  envFile.VITE_SUPABASE_ANON_KEY ||
  envFile.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY or SUPABASE_URL / SUPABASE_ANON_KEY in .env.'
  );
  process.exit(1);
}

var base = String(url).replace(/\/$/, '');
var res = await fetch(base + '/auth/v1/health', {
  headers: {
    apikey: key,
    Authorization: 'Bearer ' + key
  }
});

if (!res.ok) {
  console.error('Supabase health check failed:', res.status, res.statusText, base);
  process.exit(1);
}

console.log('OK — Supabase reachable at', base);
