import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
import sharp from 'sharp';
import { storageDir, fail } from './config.js';
export const hash = (value) => crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
export function filePath(key) {
  const resolved = path.resolve(storageDir, key);
  if (!resolved.startsWith(storageDir + path.sep)) fail(400, 'Nieprawidłowa ścieżka');
  return resolved;
}
export async function saveImage(buffer) {
  if (buffer.length > 20 * 1024 * 1024) fail(413, 'Plik przekracza 20 MB');
  let result;
  const heic = buffer.length > 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp' && /heic|heix|hevc|hevx|mif1|heim|heis/.test(buffer.subarray(8, 64).toString('ascii'));
  if (heic) {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bkpk-heic-'));
    try {
      const src = path.join(tmp, 'source.heic'); const dst = path.join(tmp, 'decoded.png');
      await fs.writeFile(src, buffer, { mode: 0o600 });
      if (process.platform === 'darwin') await exec('/usr/bin/sips', ['-s', 'format', 'png', src, '--out', dst], { timeout: 45_000 });
      else await exec('heif-convert', ['--quiet', src, dst], { timeout: 45_000 });
      buffer = await fs.readFile(dst);
    } catch { fail(400, 'Nie można zdekodować tego HEIC. Wyeksportuj zdjęcie jako JPEG.'); }
    finally { await fs.rm(tmp, { recursive: true, force: true }); }
  }
  try {
    const image = sharp(buffer, { limitInputPixels: 40_000_000, animated: false });
    const meta = await image.metadata();
    if (!['jpeg', 'png', 'webp', 'heif'].includes(meta.format)) fail(400, 'Obsługiwane pliki: JPEG, PNG, WebP i HEIC');
    result = await image.rotate().resize({ width: 4096, height: 4096, fit: 'inside', withoutEnlargement: true }).toColourspace('srgb').png().toBuffer({ resolveWithObject: true });
  } catch (err) { if (err.status) throw err; fail(400, 'Nie można odczytać zdjęcia. Dla tego pliku HEIC spróbuj eksportu do JPEG.'); }
  const key = `assets/${crypto.randomUUID()}.png`;
  await fs.mkdir(path.dirname(filePath(key)), { recursive: true });
  await fs.writeFile(filePath(key), result.data, { mode: 0o600 });
  return { storageKey: key, mime: 'image/png', width: result.info.width, height: result.info.height, contentHash: hash(result.data) };
}
