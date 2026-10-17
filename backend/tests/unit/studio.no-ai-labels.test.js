import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { channelTexts } from '../../studio/publications/texts.js';

// The owner never agreed to AI disclosures: nothing published by Studio may carry an AI label.
// renderer/references/ are frozen brand-book copies used only by comparison tests, never for publication.
const published = [
  'studio/render.js',
  'studio/renderer/render.py',
  'studio/renderer/render_v2.py',
  'studio/renderer/render_v3.py',
  'studio/publications/texts.js',
  'studio/publications/website.js',
];
const forbidden = [/ilustracj\w* AI/i, /przy użyciu AI/i, /oznaczenie-ai/i, /wygenerowan\w* (przez|przy użyciu) AI/i];
// The Studio UI may name its AI features (proposals, AI backgrounds, provenance in the library),
// but must never promise or describe an AI label on what gets published or exported.
const uiForbidden = [/oznaczeni\w* AI/i, /oznaczenie-ai/i, /aiDisclosure/, /przy użyciu AI/i, /wygenerowan\w* (przez|przy użyciu) AI/i, /(dopis|adnotacj|etykiet)\w* (o )?AI/i];
const studioSrc = fileURLToPath(new URL('../../../studio/src/', import.meta.url));
const uiFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const full = path.join(dir, e.name);
  if (e.isDirectory()) return uiFiles(full);
  return /\.(tsx?|css)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [full] : [];
});

describe('no AI labels', () => {
  it('renderers and publication texts carry no AI disclosure', () => {
    for (const file of published) {
      const source = fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
      for (const pattern of forbidden) expect(source, `${file} ${pattern}`).not.toMatch(pattern);
    }
  });
  it('Studio UI copy does not mention an AI label on exports or publications', () => {
    const files = uiFiles(studioSrc);
    expect(files.length).toBeGreaterThan(20);
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      for (const pattern of uiForbidden) expect(source, `${path.relative(studioSrc, file)} ${pattern}`).not.toMatch(pattern);
    }
  });
  it('channel texts do not append an AI note for AI backgrounds', () => {
    const copy = { caption: 'Wygraliśmy', hashtags: ['#BKPK'], firstComment: '', altText: 'Grafika', text: 'Wygraliśmy', sponsors: '', link: '', title: 'T', excerpt: 'E', tags: [], coverAlt: 'C', content: 'Treść' };
    for (const channel of ['instagram_feed', 'facebook', 'website'])
      for (const text of Object.values(channelTexts({ channel, copy }, { aiAssets: true }))) expect(text).not.toMatch(/\bAI\b/);
  });
});
