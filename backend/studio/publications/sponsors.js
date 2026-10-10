// Sponsors as listed on bekapaka.pl/sponsorzy (site API). Server-only, cached briefly; the site is the source of truth.
import { fail } from '../config.js';
import { sponsorFooter } from './channels.js';

const TTL_MS = 10 * 60_000;
let cache = null;

const sponsorsUrl = () => process.env.STUDIO_SPONSORS_URL || `${(process.env.SITE_BASE_URL || 'https://bekapaka.pl').replace(/\/$/, '')}/api/sponsors`;

/** @returns {Promise<Array<{ name: string, order: number, websiteUrl: string, facebookUrl: string }>>} */
export async function fetchSponsors({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.sponsors;
  try {
    const res = await fetch(sponsorsUrl(), { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const sponsors = (Array.isArray(body?.sponsors) ? body.sponsors : [])
      .filter((s) => s && typeof s.name === 'string' && s.name.trim())
      .map((s) => ({ name: s.name.trim(), order: Number(s.order) || 999, websiteUrl: s.websiteUrl || '', facebookUrl: s.facebookUrl || '' }))
      .sort((a, b) => a.order - b.order);
    cache = { at: Date.now(), sponsors };
    return sponsors;
  } catch {
    // A short outage of the site keeps the last known list.
    if (cache) return cache.sponsors;
    fail(503, 'Nie udało się pobrać listy sponsorów ze strony bekapaka.pl. Spróbuj za chwilę.');
  }
}

/** Footer for Facebook copy; empty (and flagged by the brand lint) when the list is unavailable. */
export async function currentSponsorFooter() {
  try {
    return sponsorFooter(await fetchSponsors());
  } catch {
    return '';
  }
}

export const resetSponsorCache = () => {
  cache = null;
};
