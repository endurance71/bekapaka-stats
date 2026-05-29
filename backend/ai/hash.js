import { createHash } from 'node:crypto';

/**
 * Stable SHA-256 hash for cache invalidation.
 * @param {unknown} value
 * @returns {string}
 */
export function hashPayload(value) {
  const json = JSON.stringify(value);
  return createHash('sha256').update(json).digest('hex');
}
