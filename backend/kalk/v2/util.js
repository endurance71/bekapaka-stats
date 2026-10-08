/**
 * Wspólne helpery importu KALK v2 (hash, porównania, liczby).
 */
import { createHash } from 'crypto';

export const KALK_V2_BASE_URL = 'https://www.kalk-koszalin.com';
/** Podnieś przy zmianie mapowania (wymusza ponowny zapis meczów mimo tych samych hashy sekcji). */
export const INGEST_VERSION = 'v2-ingest-1';

/** URL meczu na nowej stronie KALK. */
export function kalkMatchUrl(kalkMatchId) {
  return `${KALK_V2_BASE_URL}/mecz/${kalkMatchId}`;
}

function normalizeForJson(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeForJson);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      const v = value[key];
      if (v === undefined) continue;
      out[key] = normalizeForJson(v);
    }
    return out;
  }
  return value;
}

/** JSON z posortowanymi kluczami (stabilny do hashowania). */
export function stableStringify(value) {
  return JSON.stringify(normalizeForJson(value));
}

export function sha256(value) {
  const text = typeof value === 'string' ? value : stableStringify(value);
  return createHash('sha256').update(text).digest('hex');
}

/** Porównanie wartości pól Prisma (Date, Json, tablice, null ≡ undefined). */
export function sameValue(a, b) {
  const na = a === undefined ? null : a;
  const nb = b === undefined ? null : b;
  if (na === null || nb === null) return na === nb;
  if (na instanceof Date || nb instanceof Date) {
    const ta = new Date(na).getTime();
    const tb = new Date(nb).getTime();
    return ta === tb;
  }
  if (typeof na === 'object' || typeof nb === 'object') {
    return stableStringify(na) === stableStringify(nb);
  }
  return na === nb;
}

/** Pola rekordu `next`, które różnią się od `existing` (tylko klucze z `next`). */
export function changedFields(existing, next) {
  if (!existing) return { ...next };
  const diff = {};
  for (const [key, value] of Object.entries(next)) {
    if (!sameValue(existing[key], value)) diff[key] = value;
  }
  return diff;
}

export function toInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function toNum(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function round1(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

export function pct(made, att) {
  if (!att) return null;
  return round1((made / att) * 100);
}

export function parseIsoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Sezon 2026/2027" z "2026-2027". */
export function seasonLabelFromSlug(slug) {
  return `Sezon ${String(slug).replace('-', '/')}`;
}

/** Zakres sezonu: 1 września – 31 sierpnia. */
export function seasonRangeFromSlug(slug) {
  const m = String(slug).match(/^(\d{4})-(\d{4})$/);
  if (!m) return { startsAt: null, endsAt: null };
  return {
    startsAt: new Date(`${m[1]}-09-01T00:00:00Z`),
    endsAt: new Date(`${m[2]}-08-31T23:59:59Z`)
  };
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "M:SS" (format kolumny Min na stronie KALK). */
export function formatMinutes(secondsPlayed) {
  const s = toInt(secondsPlayed);
  if (s === null || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
