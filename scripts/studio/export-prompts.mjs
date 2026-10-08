// Writes docs/studio-content-system.md from the Studio publication modules. CI checks that it is up to date.
import fs from 'node:fs/promises';
import { contentSystemDocument } from '../../backend/studio/publications/document.js';
import { tools } from '../../backend/studio/agent/mcp.js';

const target = new URL('../../docs/studio-content-system.md', import.meta.url);
await fs.writeFile(target, contentSystemDocument({ tools }));
console.log('Zapisano docs/studio-content-system.md');
