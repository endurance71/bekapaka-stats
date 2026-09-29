import { describe, expect, it } from 'vitest';
import { validateScrapeOutput } from '../../kalk/validateScrapeOutput.js';

const valid = { version: 2, scrapeManifest: { seasonSlug: '2026-2027' }, table: [{ name: 'BKPK' }], schedule: [{ date: '2026-09-29' }] };

describe('validateScrapeOutput', () => {
  it('accepts a fresh complete scrape', () => {
    expect(() => validateScrapeOutput(valid, 100, 200, '2026-2027')).not.toThrow();
  });
  it('rejects a stale file even if it contains valid old data', () => {
    expect(() => validateScrapeOutput(valid, 100, 100, '2026-2027')).toThrow('nie zapisał nowego');
  });
  it('rejects empty maintenance-page data before any DB writes', () => {
    expect(() => validateScrapeOutput({ version: 2, table: [], schedule: [] }, 100, 200, '2026-2027')).toThrow('niekompletny');
  });
  it('rejects data from another season', () => {
    expect(() => validateScrapeOutput(valid, 100, 200, '2025-2026')).toThrow('innego sezonu');
  });
});
