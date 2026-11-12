// Obraz workera Studio kopiuje z backendu tylko wybrane pliki (Dockerfile.worker). Ten test przechodzi statyczne
// importy od punktów wejścia workera i sprawdza, że każdy importowany plik trafia do obrazu — brak pliku
// (np. lib/featureFlags.js po PR #115) wywracał worker w pętli restartów dopiero na produkcji.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ENTRIES = ['studio/worker.js', 'studio/health.js'];

/** Ścieżki (względem backend/) kopiowane do obrazu: `COPY a b ./dest/` albo `COPY katalog ./katalog`. */
function copiedPaths() {
  const dockerfile = fs.readFileSync(path.join(BACKEND, 'studio/Dockerfile.worker'), 'utf8');
  const out = [];
  for (const line of dockerfile.split('\n')) {
    const m = line.match(/^COPY\s+(?!--)(.+)$/);
    if (!m) continue;
    const parts = m[1].trim().split(/\s+/);
    parts.pop(); // cel w obrazie — w tym Dockerfile zawsze odpowiada ścieżce źródłowej pod /app
    out.push(...parts.map((p) => p.replace(/\/$/, '')));
  }
  return out;
}

/** Statyczne importy i re-eksporty względne (`import … from './x.js'`, `export … from '../y.js'`, `import './z.js'`). */
function staticRelativeImports(file) {
  const src = fs.readFileSync(file, 'utf8');
  const specs = new Set();
  const re = /^\s*(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"](\.{1,2}\/[^'"]+)['"]/gm;
  for (const m of src.matchAll(re)) specs.add(m[1]);
  return [...specs];
}

describe('obraz workera Studio', () => {
  it('zawiera każdy plik importowany statycznie przez worker', () => {
    const copied = copiedPaths();
    const inImage = (rel) => copied.some((c) => rel === c || rel.startsWith(`${c}/`));
    const seen = new Set();
    const missing = [];
    const queue = ENTRIES.map((e) => path.join(BACKEND, e));
    while (queue.length) {
      const file = queue.shift();
      const rel = path.relative(BACKEND, file).split(path.sep).join('/');
      if (seen.has(rel)) continue;
      seen.add(rel);
      if (!inImage(rel)) missing.push(rel);
      if (!fs.existsSync(file)) continue;
      for (const spec of staticRelativeImports(file)) queue.push(path.resolve(path.dirname(file), spec));
    }
    expect(seen.size).toBeGreaterThan(5);
    expect(missing).toEqual([]);
  });
});
