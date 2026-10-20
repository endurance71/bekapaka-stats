import { describe, expect, it } from 'vitest';
import { duplicateRevisions } from '../../scripts/studio-prune-duplicate-revisions.js';

const rev = (number, contentHash, templateVersion = 't1') => ({ id: `r${number}`, number, contentHash, templateVersion, brandVersion: 'b1' });

describe('Studio duplicate revision pruning', () => {
  it('keeps the newest of each run of identical consecutive revisions', () => {
    const revisions = [rev(1, 'a'), rev(2, 'b', 't0'), rev(3, 'b'), rev(4, 'b'), rev(5, 'b'), rev(6, 'c')];
    // 2 differs from 3 by templateVersion (the one legitimate key upgrade), 3–4 duplicate 5.
    expect(duplicateRevisions(revisions, new Set([6])).map((r) => r.number)).toEqual([3, 4]);
  });
  it('keeps content that returns after another change and protected revisions', () => {
    const revisions = [rev(1, 'a'), rev(2, 'b'), rev(3, 'a'), rev(4, 'a'), rev(5, 'a'), rev(6, 'a')];
    expect(duplicateRevisions(revisions, new Set([4, 6])).map((r) => r.number)).toEqual([3, 5]);
  });
});
