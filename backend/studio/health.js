import fs from 'node:fs/promises';
import { filePath } from './storage.js';
try { const stat = await fs.stat(filePath('.worker-health')); if (Date.now() - stat.mtimeMs > 90_000) process.exitCode = 1; } catch { process.exitCode = 1; }
