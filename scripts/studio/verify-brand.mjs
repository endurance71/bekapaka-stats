import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
const root = fileURLToPath(new URL('../../backend/studio/brand/', import.meta.url));
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
let count = 0;
for (const [file, expected] of Object.entries(manifest.files)) {
 const content = await fs.readFile(path.join(root, file)); const actual = crypto.createHash('sha256').update(content).digest('hex');
 if (actual !== expected) throw new Error(`Brand package hash mismatch: ${file}`); count++;
}
console.log(`Brand ${manifest.version}: verified ${count} files`);
