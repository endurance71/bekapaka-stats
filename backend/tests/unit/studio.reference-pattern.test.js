// The owner-approved post-match publication (BeKaPaKa – GMVT TEAM 56:54, 18.10.2026) is the pattern for
// Studio copy: the schematic texts follow its structure and the brand lint accepts the reference texts.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { factsSchema } from '../../studio/publications/channels.js';
import { playbook } from '../../studio/publications/playbooks.js';
import { schematicCopy } from '../../studio/publications/templates.js';
import { lintCopy } from '../../studio/publications/brand-lint.js';
import { channelInstructions } from '../../studio/publications/prompts.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/studio-reference');
const read = (name) => fs.readFileSync(path.join(dir, name), 'utf8').trim();
const facts = factsSchema.parse(JSON.parse(read('gmvt-2026-10-18.facts.json')));
const settings = { hashtags: { instagram: ['#BKPK'], facebook: [] }, sponsorFooter: 'Dziękujemy naszym partnerom:\nGmina Bobolice' };
const copy = schematicCopy(playbook('match-result'), facts, settings);
const warnings = (channel, value) => lintCopy(channel, value, facts).filter((i) => i.level !== 'info');
const order = (text, parts) => parts.map((p) => text.indexOf(p));

describe('post-match reference pattern (GMVT TEAM 56:54)', () => {
  it('builds the website article in the reference section order, without tables', () => {
    const content = copy.website.content;
    const positions = order(content, [
      'BeKaPaKa Bobolice 56:54 GMVT TEAM',
      '- **Kwarty:** 15:10 | 12:15 | 16:13 | 13:16',
      '- **Do przerwy:** 27:25',
      '## Przebieg meczu',
      '## Walka na tablicach i punkty po stratach',
      '## Wyróżniający się zawodnicy',
      '## Mecz w danych',
      '## Statystyki naszych zawodników',
      '## Następny mecz',
    ]);
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(content).not.toMatch(/^\|/m);
    expect(content).toContain('- **Zbiórki w ataku:** BeKaPaKa 22 · GMVT TEAM 9');
    expect(content).toContain('- **Punkty drugiej szansy:** BeKaPaKa 14 · GMVT TEAM 4');
    expect(content).toContain('- **Emil Kłos (#23):** 2 pkt, 1/3 z gry');
    expect(warnings('website', copy.website)).toEqual([]);
  });

  it('builds the Facebook and Instagram posts in the reference structure', () => {
    const fb = copy.facebook.text;
    expect(fb.split('\n')[0]).toBe('🏀 BeKaPaKa Bobolice 56:54 GMVT TEAM');
    for (const part of ['💪 22 zbiórki w ataku', '🎯 Nasi liderzy:', '🏀 Filip Karpiński – 20 pkt', '📅 Następny mecz: w sobotę, 7 listopada, o 16:50', '🆚 Grubik Team', '📍 KOSiR Koszalin', '📲 Pełna relacja'])
      expect(fb).toContain(part);
    expect(fb).not.toContain('**');
    expect(warnings('facebook', copy.facebook)).toEqual([]);
    expect(copy.instagram_feed.caption).toContain('link w bio');
    expect(warnings('instagram_feed', copy.instagram_feed)).toEqual([]);
  });

  it('accepts the owner-approved reference texts without warnings', () => {
    expect(warnings('facebook', { ...copy.facebook, text: read('gmvt-2026-10-18.facebook.txt') })).toEqual([]);
    expect(warnings('instagram_feed', { ...copy.instagram_feed, caption: read('gmvt-2026-10-18.instagram.txt') })).toEqual([]);
    expect(warnings('website', { ...copy.website, content: read('gmvt-2026-10-18.website.md') })).toEqual([]);
  });

  it('still flags numbers that are not in the facts and emoji on the website', () => {
    expect(lintCopy('facebook', { ...copy.facebook, text: `${copy.facebook.text}\nRekord: 77 punktów.` }, facts).some((i) => /77/.test(i.message))).toBe(true);
    expect(lintCopy('website', { ...copy.website, content: `${copy.website.content} 🔥` }, facts).some((i) => /bez emoji/i.test(i.message))).toBe(true);
  });

  it('tells the AI the post-match structure for Facebook and the website', () => {
    expect(channelInstructions.facebook).toContain('🎯 Nasi liderzy:');
    expect(channelInstructions.website).toContain('## Walka na tablicach i punkty po stratach');
    expect(channelInstructions.website).toContain('strona nie wyświetla tabel');
  });
});
