// A changed renderer requires an explicit release manifest; CI never rewrites a golden.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const manifest=JSON.parse(await fs.readFile(new URL('../../backend/studio/design-manifest.json',import.meta.url),'utf8'));
for(const [relative,expected] of Object.entries(manifest.files)) {
 const bytes=await fs.readFile(new URL('../../backend/studio/'+relative,import.meta.url));
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==expected)throw new Error('Design release fingerprint differs: '+relative);
}
const digest=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
if(digest!==manifest.sha256)throw new Error('Invalid design release digest');
console.log(`Verified design release ${manifest.version} / ${digest.slice(0,12)}`);
