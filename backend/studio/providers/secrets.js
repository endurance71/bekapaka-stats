// Provider API keys entered in Studio. AES-256-GCM with STUDIO_SECRETS_KEY (32 bytes, base64), shared by the
// API and the worker. Keys are never returned to the browser — only the provider, the last 4 characters and
// test results. A key from the server environment (.env) is the fallback when none is stored.
import crypto from 'node:crypto';
import { z } from 'zod';
import { fail } from '../config.js';
import { providerIds, providers } from './catalog.js';

function encryptionKey() {
  const raw = process.env.STUDIO_SECRETS_KEY || '';
  const key = Buffer.from(raw, 'base64');
  return key.length === 32 ? key : null;
}
export const secretsConfigured = () => !!encryptionKey();

export function encrypt(plain) {
  const key = encryptionKey();
  if (!key) fail(503, 'Brak klucza szyfrowania STUDIO_SECRETS_KEY na serwerze — zapis kluczy API jest wyłączony.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return { ciphertext: data.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
}
export function decrypt({ ciphertext, iv, tag }) {
  const key = encryptionKey();
  if (!key) fail(503, 'Brak klucza szyfrowania STUDIO_SECRETS_KEY na serwerze.');
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    // A rotated STUDIO_SECRETS_KEY makes stored keys unreadable; the owner enters them again.
    fail(409, 'Nie można odczytać zapisanego klucza (zmieniony klucz szyfrowania). Wprowadź klucz API ponownie.');
  }
}

const keySchema = z
  .string()
  .trim()
  .min(20, 'Klucz API jest za krótki')
  .max(400, 'Klucz API jest za długi')
  .regex(/^[\x21-\x7e]+$/, 'Klucz API nie może zawierać spacji ani polskich znaków');
const provider = (p) => z.enum(providerIds).parse(p);

export async function saveProviderKey(db, owner, providerId, input) {
  const id = provider(providerId);
  const apiKey = keySchema.parse(input?.apiKey);
  const sealed = encrypt(apiKey);
  await db.studioSecret.upsert({
    where: { ownerId_provider: { ownerId: owner, provider: id } },
    create: { ownerId: owner, provider: id, ...sealed, last4: apiKey.slice(-4), lastTestOk: null, lastTestedAt: null },
    update: { ...sealed, last4: apiKey.slice(-4), lastTestOk: null, lastTestedAt: null, lastError: null },
  });
}
export async function deleteProviderKey(db, owner, providerId) {
  await db.studioSecret.deleteMany({ where: { ownerId: owner, provider: provider(providerId) } });
}

/** The key used for calls: stored in Studio first, then the server environment. */
export async function providerKey(db, owner, providerId) {
  const row = await db.studioSecret.findUnique({ where: { ownerId_provider: { ownerId: owner, provider: providerId } } });
  if (row) return { apiKey: decrypt(row), source: 'studio' };
  const env = process.env[providers[providerId].envKey];
  return env ? { apiKey: env, source: 'env' } : null;
}

/** Status per provider for the Settings page — never the key itself. */
export async function keyStatus(db, owner) {
  const rows = await db.studioSecret.findMany({ where: { ownerId: owner } });
  return providerIds.map((id) => {
    const row = rows.find((r) => r.provider === id);
    return {
      provider: id,
      label: providers[id].label,
      hint: providers[id].keyHint,
      source: row ? 'studio' : process.env[providers[id].envKey] ? 'env' : null,
      last4: row?.last4 || null,
      updatedAt: row?.updatedAt || null,
      lastTestOk: row?.lastTestOk ?? null,
      lastTestedAt: row?.lastTestedAt || null,
      lastError: row?.lastError || null,
    };
  });
}
export async function recordTest(db, owner, providerId, ok, error) {
  await db.studioSecret.updateMany({
    where: { ownerId: owner, provider: providerId },
    data: { lastTestOk: ok, lastTestedAt: new Date(), lastError: ok ? null : String(error || '').slice(0, 300) },
  });
}
