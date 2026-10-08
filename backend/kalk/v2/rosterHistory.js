/**
 * Zawodnik ze składu bez powiązania KALK (np. nie zagrał jeszcze w bieżącym sezonie) — dowiązanie po imieniu
 * i nazwisku z danych KALK v2: profil zawodnika + jego sezony w BeKaPaKa (KalkPlayerSeasonStat).
 * Stare wiersze KalkPlayer z dawnego importu (slug sklejony z adresu „zawodnik,…,123,0.html”) są pomijane.
 * Czysta funkcja: sync podaje dane, zapis robi wywołujący.
 */
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const isOurs = (team) => /bekapaka|bobolice/i.test(String(team || ''));
const profileNames = (p) => [p.fullName, `${p.firstName ?? ''} ${p.lastName ?? ''}`, `${p.lastName ?? ''} ${p.firstName ?? ''}`].map(norm).filter(Boolean);

/**
 * @param {Array<{ id: string, firstName: string, lastName: string, kalkSlug?: string|null }>} roster
 * @param {{ profiles: Array<{ slug: string, fullName?: string|null, firstName?: string|null, lastName?: string|null }>,
 *           seasonStats: Array<{ playerSlug: string, teamName?: string|null, seasonId: string }>,
 *           kalkPlayers: Array<{ id: string, seasonId: string }> }} source
 * @returns {Array<{ rosterId: string, kalkSlug: string, kalkPlayerId: string|null }>}
 */
export function linkRosterFromHistory(roster, { profiles, seasonStats, kalkPlayers }) {
    const used = new Set(roster.map((r) => r.kalkSlug).filter(Boolean));
    const ourSeasons = new Map();
    for (const s of seasonStats) {
        if (!isOurs(s.teamName)) continue;
        if (!ourSeasons.has(s.playerSlug)) ourSeasons.set(s.playerSlug, []);
        ourSeasons.get(s.playerSlug).push(s.seasonId);
    }
    const candidates = profiles.filter((p) => ourSeasons.has(p.slug));
    const updates = [];
    for (const r of roster) {
        if (r.kalkSlug) continue;
        const names = new Set([norm(`${r.firstName} ${r.lastName}`), norm(`${r.lastName} ${r.firstName}`)]);
        const slugs = [...new Set(candidates.filter((p) => profileNames(p).some((n) => names.has(n))).map((p) => p.slug))];
        // Dwóch różnych zawodników o tym imieniu i nazwisku albo slug już przypisany → nie zgadujemy
        if (slugs.length !== 1 || used.has(slugs[0])) continue;
        const slug = slugs[0];
        // kalkPlayerId to klucz obcy — tylko istniejący wiersz z ostatniego sezonu w BeKaPaKa
        const seasons = ourSeasons.get(slug).sort().reverse();
        const ids = new Set(kalkPlayers.map((k) => k.id));
        const kalkPlayerId = seasons.map((sid) => kalkPlayers.find((k) => k.seasonId === sid && k.id.endsWith(`__${slug}`))?.id).find((id) => id && ids.has(id)) ?? null;
        updates.push({ rosterId: r.id, kalkSlug: slug, kalkPlayerId });
        used.add(slug);
    }
    return updates;
}
