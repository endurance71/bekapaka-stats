// Renderuje wzory dla meczu: npm run render -- data/<mecz>.json [A-Wracamy D-Tablica ...]
// Bez listy renderuje wszystkie, dla których mecz ma dane. Wynik: out/<posterId>/<wzór>.mp4 (H.264, yuv420p).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [file, ...wanted] = process.argv.slice(2);
if (!file) throw new Error('Podaj plik meczu, np. npm run render -- data/grubik-2026-11-07.json');
const match = JSON.parse(fs.readFileSync(path.resolve(pkg, file), 'utf8'));
if (!fs.existsSync(path.join(pkg, 'public/generated', match.posterId, 'parts.json'))) {
  throw new Error(`Najpierw: npm run prepare-match -- ${file}`);
}
// Te same warunki co `requires` we wzorach - tu tylko po to, żeby pominąć wzory bez danych zamiast przerywać.
const has = {
  'A-Wracamy': () => match.headline,
  'B-Rewanz': () => match.rematch,
  'C-Forma': () => match.season?.scores?.length,
  'D-Tablica': () => true,
  'E-Redakcyjnie': () => true,
};
const ids = wanted.length ? wanted : Object.keys(has).filter((id) => has[id]());
const out = path.join(pkg, 'out', match.posterId);
fs.mkdirSync(out, { recursive: true });
const props = path.join(out, 'props.json');
fs.writeFileSync(props, JSON.stringify({ match }));
for (const id of ids) {
  const target = path.join(out, `${id}.mp4`);
  execFileSync('npx', ['remotion', 'render', 'src/index.ts', id, target, `--props=${props}`, '--codec=h264', '--crf=18', '--pixel-format=yuv420p', '--log=error'], { cwd: pkg, stdio: 'inherit' });
  console.log(`✓ ${path.relative(pkg, target)}`);
}
