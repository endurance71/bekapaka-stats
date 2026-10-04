// Render illustrative, non-production thumbnails with the same renderer as exports.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
const sharp=createRequire(new URL('../../backend/package.json',import.meta.url))('sharp');
import { postTypes } from '../../backend/studio/contracts.js';
import { fixture } from '../../backend/studio/catalog-fixtures.js';
const exec=promisify(execFile),root=process.cwd(),out=path.join(root,'studio/public/designs');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'bkpk-catalog-'));
try {
 await fs.mkdir(out,{recursive:true});
 // The catalogue uses a licensed brand texture, never a fictitious portrait.
 const candidates=await exec('rg',['--files','backend/studio/brand']);
 const photoPath=path.join(root,candidates.stdout.split('\n').find(p=>p.endsWith('/plyta-czysta.png')));
 const meta=await sharp(photoPath).metadata();
 for(const type of postTypes)for(const style of type.styles){
  const request=path.join(temp,'request.json');
  await fs.writeFile(request,JSON.stringify({project:fixture(type,style),format:'feed',output:temp,mode:'preview',assets:{photo:{path:photoPath,width:meta.width,height:meta.height}},partners:['1','2','3','4'].map(id=>({id,name:'Partner '+id}))}));
  const {stdout}=await exec(process.env.STUDIO_PYTHON || 'backend/studio/.venv/bin/python',['backend/studio/renderer/render.py',request],{maxBuffer:4*1024*1024});
  const result=JSON.parse(stdout);
  await sharp(await fs.readFile(result.files[0].svg)).resize(360,450).webp({quality:80}).toFile(path.join(out,`${type.id}-${style}.webp`));
 }
 console.log(`Generated ${postTypes.reduce((sum,p)=>sum+p.styles.length,0)} catalogue thumbnails.`);
} finally{await fs.rm(temp,{recursive:true,force:true});}
