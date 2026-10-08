import { describe, expect, it } from 'vitest';
import { cmsItem, roundOptions } from '../../studio/sources.js';

describe('Studio sources', () => {
  it('orders rounds naturally', () => {
    expect(roundOptions(['10', '2', '1']).map(r => r.id)).toEqual(['1', '2', '10']);
  });
  it('maps CMS events from their own fields', () => {
    const item = cmsItem('event', { documentId: 'e1', title: 'Turniej', description: 'Opis', startAt: '2026-11-01T10:00:00Z', location: 'CESiR Bobolice', publishedAt: '2026-10-01' });
    expect(item).toMatchObject({ id: 'e1', body: 'Opis', date: '2026-11-01T10:00:00Z', venue: 'CESiR Bobolice', media: [] });
  });
  it('uses news content as plain text when there is no excerpt and leaves the venue unknown', () => {
    const item = cmsItem('news', { documentId: 'n1', title: 'News', content: '## Wynik\n\nWygraliśmy z [Panterami](https://x) **10 punktami**', publishedAt: '2026-10-01' });
    expect(item.body).toBe('Wynik\n\nWygraliśmy z Panterami 10 punktami');
    expect(item.venue).toBeNull();
  });
  it('keeps the body within the project limit', () => {
    expect(cmsItem('news', { documentId: 'n', excerpt: 'x'.repeat(2000), publishedAt: 'x' }).body).toHaveLength(1500);
  });
});
