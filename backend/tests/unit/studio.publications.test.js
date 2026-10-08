import { describe, expect, it } from 'vitest';
import { postTypes, designFormats } from '../../studio/post-types.js';
import { channels, copySchemas, factsSchema } from '../../studio/publications/channels.js';
import { graphicFormats, playbook, playbooks } from '../../studio/publications/playbooks.js';
import { altText, schematicCopy, when } from '../../studio/publications/templates.js';
import { hasErrors, lintCopy } from '../../studio/publications/brand-lint.js';
import { readiness, romanToInt, settingsSchema } from '../../studio/publications/service.js';

const match = factsSchema.parse({
  kind: 'match',
  competition: 'KALK',
  round: '5',
  opponent: 'Pantery',
  date: '2026-10-18T15:00:00.000Z',
  venue: 'KOSiR Koszalin',
  entryInfo: 'Wstęp wolny',
  scoreUs: 78,
  scoreThem: 64,
  leaders: [
    { name: 'Jan Karpiński', value: '24', stat: 'PTS' },
    { name: 'Adam Gośniak', value: '11', stat: 'REB' },
  ],
});

describe('publication playbooks', () => {
  it.each(playbooks.map((p) => [p.id, p]))('%s points to existing graphics, formats and channels', (_id, p) => {
    expect(Object.keys(p.items).length).toBeGreaterThan(0);
    for (const [key, graphic] of Object.entries(p.graphics)) {
      const type = postTypes.find((t) => t.id === graphic.postType);
      expect(type, `${key}: ${graphic.postType}`).toBeTruthy();
      expect(graphicFormats(graphic).length).toBeGreaterThan(0);
      expect(graphicFormats(graphic).some((f) => designFormats(type, type.styles[0]).includes(f))).toBe(true);
    }
    for (const [channel, item] of Object.entries(p.items)) {
      expect(channels[channel]).toBeTruthy();
      expect(p.graphics[item.graphic], `${channel} → ${item.graphic}`).toBeTruthy();
      expect(channels[channel].formats).toContain(item.format);
      expect(p.graphics[item.graphic].formats, `${p.id}/${channel}`).toContain(item.format);
    }
  });
  it('has unique ids', () => expect(new Set(playbooks.map((p) => p.id)).size).toBe(playbooks.length));
});

describe('schematic copy', () => {
  it.each(playbooks.map((p) => [p.id, p]))('%s produces valid copy for its channels even without facts', (_id, p) => {
    const copy = schematicCopy(p, factsSchema.parse({}));
    expect(Object.keys(copy).sort()).toEqual(Object.keys(p.items).sort());
    for (const [channel, c] of Object.entries(copy)) expect(() => copySchemas[channel].parse(c)).not.toThrow();
  });
  it('never leaves placeholders or „undefined”', () => {
    for (const p of playbooks) {
      const text = JSON.stringify(schematicCopy(p, factsSchema.parse({})));
      expect(text).not.toMatch(/undefined|null|NaN|\{\{/);
    }
  });
  it('writes the result with BeKaPaKa first and the leaders from KALK', () => {
    const c = schematicCopy(playbook('match-result'), match);
    expect(c.instagram_feed.caption).toMatch(/^Wygrana! BeKaPaKa Bobolice 78:64 Pantery\./);
    expect(c.instagram_feed.caption).toContain('Jan Karpiński 24 pkt, Adam Gośniak 11 zb.\n');
    expect(c.instagram_feed.hashtags).toEqual(['#BKPK']);
    // The site renders a standalone score line as a score board, so it opens the article.
    expect(c.website.content).toMatch(/^BeKaPaKa Bobolice 78:64 Pantery\n\n5\. kolejka KALK/);
    expect(c.website.content).toContain('Mecz w liczbach: 24 pkt Jan Karpiński · 11 zb. Adam Gośniak');
    expect(c.website.content).toContain('- **Miejsce:** KOSiR Koszalin');
  });
  it('reports a loss plainly', () => {
    const c = schematicCopy(playbook('match-result'), { ...match, scoreUs: 60, scoreThem: 70 });
    expect(c.facebook.text).toMatch(/^Wynik meczu: BeKaPaKa Bobolice 60:70 Pantery\./);
    expect(c.facebook.text).not.toMatch(/Wygrana|porażk/i);
  });
  it('does not decline team names', () => {
    expect(schematicCopy(playbook('match-preview'), match).facebook.text).toMatch(/^Przed nami mecz BeKaPaKa – Pantery \(5\. kolejka\)!/);
  });
  it('formats Warsaw time with the right preposition', () => {
    expect(when('2026-10-18T15:00:00.000Z')).toBe('w niedzielę, 18 października, o 17:00');
    expect(when('2026-10-20T15:00:00.000Z')).toBe('we wtorek, 20 października, o 17:00');
  });
  it('keeps the score out of a preview alt text', () => {
    expect(altText(playbook('match-preview'), match)).not.toContain('78:64');
    expect(altText(playbook('match-result'), match)).toContain('78:64');
  });
  it('uses the owner-approved hashtag sets', () => {
    const c = schematicCopy(playbook('match-result'), match, { hashtags: { instagram: ['#BKPK', '#KALK'], facebook: ['#BKPK'] } });
    expect(c.instagram_feed.hashtags).toEqual(['#BKPK', '#KALK']);
    expect(c.facebook.hashtags).toEqual(['#BKPK']);
  });
});

describe('brand lint', () => {
  const ig = (caption, extra = {}) => ({ caption, hashtags: ['#BKPK'], firstComment: '', altText: 'Wynik meczu', ...extra });
  it('accepts schematic copy', () => {
    const c = schematicCopy(playbook('match-result'), match);
    for (const [channel, copy] of Object.entries(c)) expect(lintCopy(channel, copy, match)).toEqual([]);
  });
  it('blocks wrong club names and tickets', () => {
    expect(hasErrors(lintCopy('instagram_feed', ig('Bekapaka gra dziś'), match))).toBe(true);
    expect(hasErrors(lintCopy('instagram_feed', ig('Bilety w kasie'), match))).toBe(true);
    expect(hasErrors(lintCopy('instagram_feed', ig('Gra BKP'), match))).toBe(true);
    expect(hasErrors(lintCopy('instagram_feed', ig('BKPK i BeKaPaKa'), match))).toBe(false);
  });
  it('warns about numbers outside the confirmed facts', () => {
    const issues = lintCopy('instagram_feed', ig('Wygraliśmy 78:64, Karpiński rzucił 31 punktów'), match);
    expect(issues.find((i) => i.message.includes('31'))?.level).toBe('warning');
    expect(issues.some((i) => i.message.includes('78'))).toBe(false);
  });
  it('warns about home/away wording, missing #BKPK, long hook and links on Instagram', () => {
    const issues = lintCopy('instagram_feed', ig(`${'a'.repeat(130)} mecz na wyjeździe https://bekapaka.pl`, { hashtags: [] }), match);
    expect(issues.map((i) => i.field)).toEqual(expect.arrayContaining(['caption', 'hashtags']));
    expect(issues.filter((i) => i.level === 'warning').length).toBeGreaterThanOrEqual(3);
  });
  it('checks the website excerpt length and required alt texts', () => {
    expect(lintCopy('website', { title: 'T', excerpt: 'krótko', content: 'x', tags: [], coverAlt: '' }, match)[0]).toMatchObject({ level: 'warning', field: 'excerpt' });
    expect(hasErrors(lintCopy('facebook', { text: 'Tekst', hashtags: [], link: '', altText: '' }, match))).toBe(true);
  });
});

describe('publication helpers', () => {
  it('reads tournament editions', () => {
    expect(romanToInt('III')).toBe(3);
    expect(romanToInt('XIV')).toBe(14);
    expect(romanToInt('4')).toBe(4);
    expect(romanToInt('abc')).toBeNull();
  });
  it('defaults hashtags to #BKPK only', () => {
    expect(settingsSchema.parse({})).toEqual({ hashtags: { instagram: ['#BKPK'], facebook: [] } });
    expect(() => settingsSchema.parse({ hashtags: { instagram: ['bez krzyżyka'] } })).toThrow();
  });
  it('lists what blocks approval', () => {
    const p = { facts: match, factsHash: 'a', factsConfirmedHash: null };
    const item = { channel: 'facebook', copy: schematicCopy(playbook('match-result'), match).facebook, projectId: 'x', format: 'feed' };
    expect(readiness(p, item, { hasFormat: true, valid: false, exportJobId: null })).toEqual([
      'Potwierdź fakty publikacji',
      'Zatwierdź grafikę (dane, wygląd, kompozycja)',
    ]);
    expect(readiness({ ...p, factsConfirmedHash: 'a' }, item, { hasFormat: true, valid: true, exportJobId: 'j' })).toEqual([]);
  });
});
