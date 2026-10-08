import { describe, it, expect } from 'vitest';
import { hashAiPayload, hashPayload } from '../../ai/hash.js';
import { AI_PROMPT_VERSIONS } from '../../ai/promptVersions.js';
import { findInvalidAiValues, sanitizeAiPayload } from '../../ai/payloadUtils.js';

describe('hashAiPayload', () => {
  const payload = { a: 1, b: [1, 2] };

  it('changes when prompt version changes (analyses become stale)', () => {
    const v1 = hashAiPayload('match', payload, { promptVersion: 'match-v1' });
    const v2 = hashAiPayload('match', payload, { promptVersion: 'match-v2' });
    expect(v1).not.toBe(v2);
    expect(hashAiPayload('match', payload)).toBe(hashAiPayload('match', payload, { promptVersion: AI_PROMPT_VERSIONS.match }));
  });

  it('differs per analysis type and from the bare payload hash', () => {
    expect(hashAiPayload('match', payload)).not.toBe(hashAiPayload('player', payload));
    expect(hashAiPayload('match', payload)).not.toBe(hashPayload(payload));
  });

  it('every analysis type has a prompt version', () => {
    for (const type of ['match', 'player', 'scouting', 'briefing', 'pregame', 'play']) {
      expect(AI_PROMPT_VERSIONS[type]).toMatch(/\S+/);
    }
  });
});

describe('sanitizeAiPayload', () => {
  it('removes undefined, maps NaN/Infinity to null, Date to ISO', () => {
    const out = sanitizeAiPayload({ a: undefined, b: NaN, c: [undefined, Infinity, 2], d: new Date('2026-10-04T10:00:00Z') });
    expect(out).toStrictEqual({ b: null, c: [null, null, 2], d: '2026-10-04T10:00:00.000Z' });
    expect(findInvalidAiValues(out)).toEqual([]);
    expect(findInvalidAiValues({ x: NaN, y: [undefined] })).toEqual(['$.x', '$.y[0]']);
  });
});
