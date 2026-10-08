import crypto from 'node:crypto';
import { z } from 'zod';
import { fail, ownerId } from '../config.js';
import { hash } from '../storage.js';

export const AGENT_SCOPES = ['read', 'draft'];
const PREFIX = 'bkpk_agent_';
const tokenPattern = /^bkpk_agent_[A-Za-z0-9_-]{43}$/;

/** Creates a token; the plain value is returned once and only its SHA-256 is stored. */
export async function createAgentToken(db, owner, input) {
  const { name } = z.object({ name: z.string().trim().min(1).max(80) }).strict().parse(input);
  if ((await db.studioAgentToken.count({ where: { ownerId: owner, revokedAt: null } })) >= 5) fail(422, 'Najwyżej 5 aktywnych tokenów agenta. Odwołaj nieużywany.');
  const token = PREFIX + crypto.randomBytes(32).toString('base64url');
  const row = await db.studioAgentToken.create({ data: { id: hash(token), ownerId: owner, name, prefix: token.slice(0, PREFIX.length + 6), scopes: AGENT_SCOPES } });
  return { token, ...publicToken(row) };
}
export const publicToken = ({ id, ...row }) => ({ ...row, id: id.slice(0, 16) });
export async function listAgentTokens(db, owner) {
  return (await db.studioAgentToken.findMany({ where: { ownerId: owner }, orderBy: { createdAt: 'desc' } })).map(publicToken);
}
export async function revokeAgentToken(db, owner, shortId) {
  const updated = await db.studioAgentToken.updateMany({ where: { ownerId: owner, id: { startsWith: z.string().regex(/^[a-f0-9]{16}$/).parse(shortId) }, revokedAt: null }, data: { revokedAt: new Date() } });
  if (!updated.count) fail(404, 'Token nie istnieje albo jest już odwołany');
}

const lastSeen = new Map();
/** Resolves `Authorization: Bearer bkpk_agent_…` to an active token of the configured Studio owner. */
export async function authenticateAgent(db, header) {
  const token = /^Bearer (.+)$/.exec(header || '')?.[1];
  if (!token || !tokenPattern.test(token)) return null;
  const row = await db.studioAgentToken.findUnique({ where: { id: hash(token) } });
  if (!row || row.revokedAt || row.ownerId !== ownerId()) return null;
  // lastUsedAt is informative; one write per minute is enough.
  if (Date.now() - (lastSeen.get(row.id) || 0) > 60_000) {
    lastSeen.set(row.id, Date.now());
    await db.studioAgentToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  }
  return row;
}

// Fixed window per token: agents are batch tools, not chat clients.
const windows = new Map();
export function allowRequest(tokenId, limit = 120, windowMs = 60_000, now = Date.now()) {
  const w = windows.get(tokenId);
  if (!w || now - w.start > windowMs) {
    windows.set(tokenId, { start: now, count: 1 });
    return true;
  }
  w.count += 1;
  return w.count <= limit;
}
