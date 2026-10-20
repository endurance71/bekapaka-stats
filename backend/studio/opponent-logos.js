import { fail } from './config.js';
import { saveImage } from './storage.js';

// Opponent logos are library assets of kind `opponent-logo` named after the team, so later matches reuse them.
// Brand rule M8: the real logo only when the owner supplies or confirms it; otherwise the neutral shield.
export const teamKey = name => String(name || '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pl-PL').replace(/ł/g, 'l').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// The newest approved, publishable logo for the team, or null.
export async function opponentLogo(db, owner, name) {
  const key = teamKey(name); if (!key) return null;
  const assets = await db.studioAsset.findMany({ where: { ownerId: owner, kind: 'opponent-logo', status: 'approved', consent: { in: ['granted', 'not_required'] } }, orderBy: { updatedAt: 'desc' }, take: 500 });
  return assets.find(a => teamKey(a.name) === key) || null;
}

const KALK_HOSTS = new Set(['www.kalk-koszalin.com', 'kalk-koszalin.com']);
export function kalkMediaUrl(value) {
  let url; try { url = new URL(value); } catch { return null; }
  return url.protocol === 'https:' && KALK_HOSTS.has(url.hostname) && url.pathname.startsWith('/storage/') && !url.username && !url.password ? url : null;
}

// The logo KALK shows for the team (league table or team directory), newest season first.
export async function kalkLogoUrl(db, name) {
  const key = teamKey(name); if (!key) return null;
  const select = { name: true, logoUrl: true, updatedAt: true };
  const [teams, table] = await Promise.all([
    db.kalkTeam.findMany({ where: { logoUrl: { not: null } }, select, orderBy: { updatedAt: 'desc' }, take: 1000 }),
    db.leagueTeam.findMany({ where: { logoUrl: { not: null } }, select, orderBy: { updatedAt: 'desc' }, take: 1000 }),
  ]);
  const found = [...teams, ...table].filter(t => teamKey(t.name) === key && kalkMediaUrl(t.logoUrl)).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return found?.logoUrl || null;
}

const LIMIT = 5 * 1024 * 1024;
export async function fetchKalkLogo(value, fetcher = fetch) {
  const url = kalkMediaUrl(value);
  if (!url) fail(422, 'Logo musi pochodzić z magazynu mediów KALK (https://www.kalk-koszalin.com/storage/…)');
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(20_000) }).catch(() => fail(502, 'Nie można pobrać logo z KALK'));
  if (!response.ok) fail(502, 'KALK nie udostępnił logo');
  if (Number(response.headers.get('content-length') || 0) > LIMIT) fail(413, 'Logo z KALK przekracza 5 MB');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > LIMIT) fail(413, 'Logo z KALK przekracza 5 MB');
  return { image: await saveImage(buffer), origin: `KALK · ${url.href}` };
}
