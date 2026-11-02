// Przygotowuje mecz do wzorów filmów:
// 1. kopiuje zasoby marki do public/brand (fonty, znaki, faktury),
// 2. renderuje zapowiedź w Studio (render.py, styl „sport” i „editorial”, story 1080×1920),
// 3. tnie SVG „sport” na części (split.py), a „editorial” zapisuje jako PNG planszy końcowej.
// Użycie: npm run prepare-match -- data/<mecz>.json
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, '..');
const repo = path.resolve(pkg, '../..');
const studio = path.join(repo, 'backend/studio');
const brand = path.join(studio, 'brand/02_system');
const python = process.env.STUDIO_PYTHON || path.join(studio, '.venv/bin/python');
const sharp = createRequire(path.join(repo, 'backend/package.json'))('sharp');

const file = process.argv[2];
if (!file) throw new Error('Podaj plik meczu, np. npm run prepare-match -- data/grubik-2026-11-07.json');
const match = JSON.parse(fs.readFileSync(path.resolve(pkg, file), 'utf8'));

// 1. Zasoby marki - zawsze z repo (reguła: logo i fonty tylko z plików marki).
const brandOut = path.join(pkg, 'public/brand');
fs.mkdirSync(brandOut, { recursive: true });
const assets = [
  ...['BarlowCondensed-ExtraBold.ttf', 'Barlow-SemiBold.ttf', 'Barlow-Regular.ttf'].map((f) => `fonts/${f}`),
  ...['przetarcia-liter.png', 'plyta-czarna.png', 'lineup-paper.png'].map((f) => `materialy/${f}`),
  ...['znak-v.svg', 'wzor-skrzydla.svg', 'herb2-kolor.svg'].map((f) => `symbole/svg/${f}`),
];
for (const a of assets) fs.copyFileSync(path.join(brand, a), path.join(brandOut, path.basename(a)));
// Maska zdartego nadruku: ten sam plik co filtr „nadruk” w Studio, odwrócony do maski CSS.
const wear = await sharp(path.join(brand, 'materialy/przetarcia-liter.png')).negate().toColourspace('b-w').toBuffer();
await sharp({ create: { width: 1080, height: 1920, channels: 3, background: '#fff' } }).joinChannel(wear).png().toFile(path.join(brandOut, 'przetarcia-maska.png'));

// 2. Render Studio z danymi meczu.
const { postTypes } = await import(pathToFileURL(path.join(studio, 'contracts.js')));
const { fixture } = await import(pathToFileURL(path.join(studio, 'catalog-fixtures.js')));
const type = postTypes.find((t) => t.id === 'preview');
const out = path.join(pkg, 'public/generated', match.posterId);
fs.mkdirSync(out, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkpk-motion-'));
const svgFor = (style) => {
  const project = fixture(type, style);
  Object.assign(project.content, {
    opponent: match.opponent,
    opponentShort: match.opponentShort,
    date: match.kickoff,
    venue: match.venue,
    kicker: match.round || '',
    entryInfo: match.entry || '',
    photoAssetId: null,
    kit: match.kit || 'A',
  });
  const dir = path.join(tmp, style);
  const req = path.join(tmp, `${style}.json`);
  fs.writeFileSync(req, JSON.stringify({ project, format: 'story', output: dir, mode: 'export', assets: {}, partners: [] }));
  const res = JSON.parse(execFileSync(python, [path.join(studio, 'renderer/render.py'), req], { encoding: 'utf8' }));
  if (res.error) throw new Error(`Studio: ${res.error}`);
  return res.files[0].svg;
};

// 3. Części do animacji i plansza redakcyjna.
execFileSync('python3', [path.join(here, 'split.py'), svgFor('sport'), out, match.opponent], { stdio: 'inherit' });
await sharp(svgFor('editorial')).png().toFile(path.join(out, 'poster-editorial.png'));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Gotowe: public/generated/${match.posterId}`);
