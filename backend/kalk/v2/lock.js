/**
 * Blokada importu KALK (Postgres advisory lock) — jeden import/sync naraz (CLI, cron, HTTP).
 *
 * Lock sesyjny trzymany na osobnym połączeniu `pg.Client` (pula Prisma mogłaby zwolnić
 * lock na innym połączeniu niż to, które go założyło).
 */
import pg from 'pg';

export const KALK_SYNC_LOCK_KEY = 74_201_026; // stała aplikacji (dowolna, unikalna)

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ connectionString?: string }} [opts]
 * @returns {Promise<T>}
 */
export async function withKalkSyncLock(fn, opts = {}) {
  const connectionString = opts.connectionString || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL wymagany do blokady KALK');
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const { rows } = await client.query('SELECT pg_try_advisory_lock($1) AS locked', [KALK_SYNC_LOCK_KEY]);
    if (!rows?.[0]?.locked) {
      const err = new Error('Inny import/sync KALK jest w toku (advisory lock zajęty).');
      err.code = 'KALK_LOCKED';
      throw err;
    }
    try {
      return await fn();
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [KALK_SYNC_LOCK_KEY]);
    }
  } finally {
    await client.end();
  }
}
