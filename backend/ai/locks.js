const activeLocks = new Set();

/**
 * @param {string} key
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withAiLock(key, fn) {
  if (activeLocks.has(key)) {
    const { AiBusyError } = await import('./errors.js');
    throw new AiBusyError();
  }
  activeLocks.add(key);
  try {
    return await fn();
  } finally {
    activeLocks.delete(key);
  }
}
