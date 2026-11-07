import { describe, expect, it } from 'vitest';
import { factsSchema } from '../../studio/publications/channels.js';
import { projectFromFacts } from '../../studio/publications/service.js';
import { failureHint } from '../../studio/agent/graphics.js';

const notes = 'Źródło: oficjalny protokół meczu nr 4184 (skan od Damiana). BeKaPaKa prowadziła przez 39:23 minut meczu.';
const facts = factsSchema.parse({ kind: 'match', opponent: 'Grubik Team', date: '2026-11-07T15:50:00.000Z', venue: 'KOSiR Koszalin', scoreUs: 68, scoreThem: 48, notes });

describe('graphic text from facts', () => {
  it('keeps working notes off a match report cover, which has room for two lines', () => {
    expect(projectFromFacts({ postType: 'report-cover', formats: ['feed'] }, facts, null, 'Grubik', [], 'Okładka.').content.body).toBe('');
  });
  it('still uses the notes where the body is the post itself', () => {
    const notice = projectFromFacts({ postType: 'notice', formats: ['feed'] }, { ...facts, kind: 'manual', title: 'Zbiórka' }, null, 'Zbiórka', [], 'Ogłoszenie.');
    expect(notice.content.body).toBe(notes);
  });
});

describe('render failure hint for agents', () => {
  const generic = 'Renderowanie nie powiodło się. Sprawdź pola i długość tekstów.';
  it('names the field that is too long', () => {
    expect(failureHint(generic, { body: 'x'.repeat(1305), title: 'Krótki' })).toContain('body (1305 znaków)');
  });
  it('passes specific errors through unchanged', () => {
    expect(failureHint('title: Nagłówek jest za długi.', { body: 'x'.repeat(500) })).toBe('title: Nagłówek jest za długi.');
    expect(failureHint(generic, { body: 'krótko' })).toBe(generic);
  });
});
