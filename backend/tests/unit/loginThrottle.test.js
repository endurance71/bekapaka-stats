import { describe, expect, it } from 'vitest';
import { createLoginThrottle } from '../../lib/loginThrottle.js';

describe('login throttle', () => {
  it('limits repeated attempts for the same username and IP', () => {
    let time = 0;
    const throttle = createLoginThrottle({ limit: 2, windowMs: 100, now: () => time });
    expect(throttle.check('ip-a', 'Jan')).toBe(true);
    expect(throttle.check('ip-a', 'jan')).toBe(true);
    expect(throttle.check('ip-a', 'JAN')).toBe(false);
    expect(throttle.check('ip-b', 'jan')).toBe(true);
    time = 100;
    expect(throttle.check('ip-a', 'jan')).toBe(true);
  });

  it('clears the bucket after a successful login', () => {
    const throttle = createLoginThrottle({ limit: 1 });
    expect(throttle.check('ip-a', 'jan')).toBe(true);
    throttle.clear('ip-a', 'jan');
    expect(throttle.check('ip-a', 'jan')).toBe(true);
  });
});
