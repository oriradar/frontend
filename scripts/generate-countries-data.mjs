/**
 * Regenerates `src/data/countries.json` from the REST Countries API.
 * Usage (from `frontend/`): npm run generate-countries
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = dirname(scriptDir);

const res = await fetch('https://restcountries.com/v3.1/all?fields=name');
const j = await res.json();
const names = j.map((x) => x.name.common).sort((a, b) => a.localeCompare(b, 'en'));
const outPath = join(frontendRoot, 'src/data/countries.json');
writeFileSync(outPath, JSON.stringify(names));
console.log('Wrote', names.length, 'countries to', outPath);
