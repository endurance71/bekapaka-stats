import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { channelTexts } from '../../studio/publications/texts.js';

// The owner never agreed to AI disclosures: nothing published by Studio may carry an AI label.
const published = [
  'studio/render.js',
  'studio/renderer/render.py',
  'studio/renderer/render_v2.py',
  'studio/renderer/render_v3.py',
  'studio/renderer/references/core.py',
  'studio/publications/texts.js',
  'studio/publications/website.js',
];
const forbidden = [/ilustracj\w* AI/i, /przy użyciu AI/i, /oznaczenie-ai/i, /wygenerowan\w* (przez|przy użyciu) AI/i];

describe('no AI labels', () => {
  it('renderers and publication texts carry no AI disclosure', () => {
    for (const file of published) {
      const source = fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
      for (const pattern of forbidden) expect(source, `${file} ${pattern}`).not.toMatch(pattern);
    }
  });
  it('channel texts do not append an AI note for AI backgrounds', () => {
    const copy = { caption: 'Wygraliśmy', hashtags: ['#BKPK'], firstComment: '', altText: 'Grafika', text: 'Wygraliśmy', sponsors: '', link: '', title: 'T', excerpt: 'E', tags: [], coverAlt: 'C', content: 'Treść' };
    for (const channel of ['instagram_feed', 'facebook', 'website'])
      for (const text of Object.values(channelTexts({ channel, copy }, { aiAssets: true }))) expect(text).not.toMatch(/\bAI\b/);
  });
});
