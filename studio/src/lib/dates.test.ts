import { describe, it, expect } from 'vitest';
import { warsawInput, warsawIso, weekday } from './dates';
describe('Warsaw dates', () => {
  it('handles winter and summer offsets without relying on client timezone', () => {
    expect(warsawIso('2026-10-11T14:30')).toBe('2026-10-11T12:30:00.000Z');
    expect(warsawIso('2026-12-11T14:30')).toBe('2026-12-11T13:30:00.000Z');
  });
  it('roundtrips and computes weekday', () => {
    expect(warsawInput(warsawIso('2026-10-11T14:30'))).toBe('2026-10-11T14:30');
    expect(weekday('2026-10-11T12:30:00Z')).toContain('niedziela');
  });
  it('rejects a nonexistent clock during daylight-saving transition', () =>
    expect(() => warsawIso('2026-03-29T02:30')).toThrow());
});
