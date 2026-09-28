/** Process-local login throttle. Never trust client-supplied forwarding headers. */
export function createLoginThrottle({ limit = 20, windowMs = 15 * 60_000, now = Date.now } = {}) {
  const attempts = new Map();

  return {
    check(ip, username) {
      const key = `${ip || 'unknown'}:${String(username).trim().toLowerCase()}`;
      const time = now();
      const entry = attempts.get(key);
      if (!entry || time >= entry.expiresAt) {
        if (attempts.size >= 10_000) {
          for (const [oldKey, oldEntry] of attempts) {
            if (time >= oldEntry.expiresAt) attempts.delete(oldKey);
          }
          if (attempts.size >= 10_000) attempts.delete(attempts.keys().next().value);
        }
        attempts.set(key, { count: 1, expiresAt: time + windowMs });
        return true;
      }
      if (entry.count >= limit) return false;
      entry.count += 1;
      return true;
    },
    clear(ip, username) {
      attempts.delete(`${ip || 'unknown'}:${String(username).trim().toLowerCase()}`);
    }
  };
}
