import { hash } from './storage.js';
import { fail } from './config.js';
export const isClub = name => /bekapaka|bobolice/i.test(name || '');
export function matchSnapshot(m) {
  const home = isClub(m.homeTeamName ?? m.homeTeam);
  if (!home && !isClub(m.guestTeamName ?? m.guestTeam)) fail(404, 'To nie jest mecz BeKaPaKa');
  return { id: m.id, seasonId: m.seasonId, date: m.date?.toISOString?.() || m.date || '', opponent: home ? (m.guestTeamName ?? m.guestTeam) : (m.homeTeamName ?? m.homeTeam), scoreUs: home ? (m.scoreHome ?? null) : (m.scoreAway ?? null), scoreThem: home ? (m.scoreAway ?? null) : (m.scoreHome ?? null), venue: 'KOSiR Koszalin', round: String(m.roundCode ?? m.phaseLabel ?? ''), source: m.homeTeamName ? 'kalk' : 'league' };
}
export function sourceEnvelope(kind, data) { return { data, source: { kind, id: data.id, seasonId: data.seasonId || '', hash: hash(data), fetchedAt: new Date().toISOString() } }; }
export async function matches(db, seasonId) {
  if (!seasonId) fail(400, 'Wybierz sezon');
  const [kalk, league] = await Promise.all([
    db.kalkMatch.findMany({ where: { seasonId }, orderBy: { date: 'desc' }, take: 300 }),
    db.leagueMatch.findMany({ where: { seasonId }, orderBy: { date: 'desc' }, take: 300 }),
  ]);
  const linked = new Set(kalk.map(m => m.id));
  return [...kalk, ...league.filter(m => !m.kalkMatchId || !linked.has(m.kalkMatchId))].filter(m => isClub(m.homeTeamName ?? m.homeTeam) || isClub(m.guestTeamName ?? m.guestTeam)).map(matchSnapshot);
}
export async function cms(kind, id) {
  const url = process.env.STUDIO_CMS_URL; const token = process.env.STUDIO_CMS_TOKEN;
  if (!url || !token) fail(503, 'Import CMS nie jest skonfigurowany');
  const collection = kind === 'event' ? 'events' : 'news-posts';
  const endpoint = new URL(`/api/${collection}`, url);
  endpoint.searchParams.set('status', 'published'); endpoint.searchParams.set('pagination[pageSize]', '100'); endpoint.searchParams.set('populate', '*');
  if (id) endpoint.searchParams.set('filters[documentId][$eq]', id);
  const result = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
  if (!result.ok) fail(502, 'CMS nie udostępnił treści');
  const json = await result.json();
  return (json.data || []).filter(v => v.publishedAt).map(v => ({ id: v.documentId, title: v.title || '', body: typeof v.excerpt === 'string' ? v.excerpt : '', date: v.startAt || v.publishedAtCustom || v.publishedAt, venue: v.location || 'CESiR Bobolice', media: [v.coverImage, ...(v.attachments || [])].flat().filter(Boolean).map(m => ({ id: m.documentId || String(m.id), name: m.name, url: m.url, alternativeText: m.alternativeText || '' })) }));
}

export async function cmsMedia(kind, documentId, mediaId) {
  const posts = await cms(kind, documentId); const post = posts[0];
  const media = post?.media.find(m => m.id === mediaId);
  if (!media) fail(404, 'Media nie należą do opublikowanej treści');
  const root = new URL(process.env.STUDIO_CMS_URL);
  const url = new URL(media.url, root);
  if (url.origin !== root.origin || !url.pathname.startsWith('/uploads/')) fail(422, 'Ten plik nie pochodzi z zatwierdzonego magazynu CMS');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) fail(502, 'Nie można pobrać zdjęcia z CMS');
  if (Number(response.headers.get('content-length') || 0) > 20 * 1024 * 1024) fail(413, 'Plik CMS przekracza 20 MB');
  const reader = response.body.getReader(); const chunks = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 20 * 1024 * 1024) { await reader.cancel(); fail(413, 'Plik CMS przekracza 20 MB'); } chunks.push(Buffer.from(value)); }
  return { buffer: Buffer.concat(chunks), name: media.name, origin: `CMS · ${post.title} · ${documentId}/${mediaId}` };
}
