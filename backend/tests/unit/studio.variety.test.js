import { describe, it, expect } from 'vitest';
import { compositionKey, compositionName, signatureOf, varietyWarnings } from '../../studio/publications/variety.js';

const board = { family: 'result', postType: 'final', visualStyle: 'sport', kit: 'A', material: 'brand' };
const marks = { family: 'announcement', postType: 'preview', visualStyle: 'sport', kit: 'A', material: 'brand' };
const paper = { family: 'statistics', postType: 'leaders', visualStyle: 'editorial', kit: 'A', material: 'brand' };
const post = (signature, day) => ({ signature, publishedAt: `2026-10-${String(day).padStart(2, '0')}T16:00:00.000Z` });

describe('feed variety rules', () => {
  it('reads the signature of a project payload', () => {
    expect(signatureOf({ family: 'result', postType: 'final', visualStyle: 'sport', content: { kit: 'B', backgroundAssetId: 'hala' } })).toEqual({
      family: 'result',
      postType: 'final',
      visualStyle: 'sport',
      kit: 'B',
      material: 'hala',
    });
    expect(compositionKey(board)).toBe('final:sport');
    expect(compositionKey({ composition: 'external' })).toBeNull();
    expect(compositionName({ composition: 'external' })).toBe('grafika spoza Studio');
    expect(compositionName(board)).toContain('Wynik końcowy');
  });

  it('warns when the previous post used the same composition', () => {
    const w = varietyWarnings({ signature: board, plannedAt: '2026-10-18T17:00:00.000Z' }, [post(board, 17), post(marks, 15)]);
    expect(w.map((x) => x.rule)).toEqual(['previous']);
  });

  it('warns when the composition fills half of the recent grid', () => {
    const history = [post(paper, 17), post(board, 16), post(marks, 15), post(board, 14)];
    const w = varietyWarnings({ signature: board, plannedAt: '2026-10-18T17:00:00.000Z' }, history);
    expect(w.map((x) => x.rule)).toEqual(['frequent']);
    expect(w[0].message).toMatch(/3 z ostatnich 5/);
  });

  it('warns about the same background but not about the brand material', () => {
    const hall = { ...marks, material: 'hala' };
    expect(varietyWarnings({ signature: { ...paper, material: 'hala' }, plannedAt: '2026-10-18T17:00:00.000Z' }, [post(hall, 17)]).map((x) => x.rule)).toEqual(['material']);
    expect(varietyWarnings({ signature: paper, plannedAt: '2026-10-18T17:00:00.000Z' }, [post(marks, 17)])).toEqual([]);
  });

  it('only compares with posts before the candidate and ignores external graphics', () => {
    const later = { signature: board, plannedAt: '2026-10-20T16:00:00.000Z' };
    expect(varietyWarnings({ signature: board, plannedAt: '2026-10-18T17:00:00.000Z' }, [later, post({ composition: 'external' }, 17)])).toEqual([]);
  });
});
