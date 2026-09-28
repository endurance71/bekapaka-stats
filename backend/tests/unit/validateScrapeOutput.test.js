import { describe, expect, it } from 'vitest';
import { validateScrapeOutput } from '../../kalk/validateScrapeOutput.js';

const valid = { version: 2, table: [{ name: 'BKPK' }], schedule: [{ date: '2026-09-29' }] };

describe('validateScrapeOutput', () => {
  it('accepts a fresh complete scrape', () => {
    expect(() => validateScrapeOutput(valid, 100, 200)).not.toThrow();
  });
  it('rejects a stale file even if it contains valid old data', () => {
    expect(() => validateScrapeOutput(valid, 100, 100)).toThrow('nie zapisał nowego');
  });
  it('rejects empty maintenance-page data before any DB writes', () => {
    expect(() => validateScrapeOutput({ version: 2, table: [], schedule: [] }, 100, 200)).toThrow('niekompletny');
  });
});
