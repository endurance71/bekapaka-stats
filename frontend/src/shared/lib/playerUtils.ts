import { normalizePlayerIdentity, resolvePlayerJerseyNumber } from './playerIdentity';
import { resolvePlayerPortrait } from './playerPortraits';

/**
 * Shared player utilities — extracted from Shell, SidebarProfile, PlayerCard
 * to eliminate code duplication.
 */

/** Normalize Polish characters for URL-safe file paths */
export function normalizePolishChars(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, '-');
}

/** Build a local photo URL from player's first/last name */
export function getPhotoUrl(firstName?: string, lastName?: string): string {
  if (!firstName || !lastName) return '/photos/default.png';
  return `/photos/${normalizePolishChars(firstName)}-${normalizePolishChars(lastName)}.webp`;
}

/** Map position abbreviation to Polish label */
const POSITION_MAP: Record<string, string> = {
  G: 'Obrońca',
  F: 'Skrzydłowy',
  C: 'Środkowy',
  PG: 'Rozgrywający',
  SG: 'Rzucający Obrońca',
  SF: 'Niski Skrzydłowy',
  PF: 'Silny Skrzydłowy',
};

export function getPositionLabel(position?: string): string {
  if (!position) return 'Zawodnik';
  return POSITION_MAP[position] || position;
}

/** Lokalne zdjęcia w `public/photos` (jak `LOCAL_PHOTOS` w site/lib/data/utils.ts). */
const LOCAL_PHOTOS = new Set([
  'damian-motylinski',
  'emil-klos',
  'filip-karpinski',
  'filip-kawecki',
  'miroslaw-malina',
  'pablo-iriarte',
  'patryk-szczesniak',
  'pawel-samusionek',
  'przemyslaw-klimek',
  'robert-kulik',
  'tomasz-kaszubowski',
]);

export type PhotoSource = {
  firstName?: string | null;
  lastName?: string | null;
  number?: number | string | null;
  photo?: string | null;
  photoUrl?: string | null;
  photo_url?: string | null;
  data?: any;
  kalkPlayer?: {
    raw?: {
      photo_url?: string | null;
    } | null;
  } | null;
} | null | undefined;

const isRealPhoto = (url?: string | null): url is string =>
  Boolean(url) && !url!.toLowerCase().includes('empty.jpg') && !url!.includes('/photos/default.png');

/**
 * Zdjęcie zawodnika jak na bekapaka.pl: portret marki → własne zdjęcie → zdjęcie KALK → `public/photos`
 * (obie kolejności imienia i nazwiska). Brak zdjęcia → `null` (komponent pokazuje monogram BKPK).
 */
export function resolvePlayerImage(player: PhotoSource): string | null {
  if (!player) return null;
  const { firstName, lastName } = normalizePlayerIdentity(player);
  const portrait = resolvePlayerPortrait(firstName ?? undefined, lastName ?? undefined, resolvePlayerJerseyNumber(player));
  if (portrait) return portrait;

  const custom = player.photo || player.data?.photo;
  if (isRealPhoto(custom)) return custom;

  const remote = player.photoUrl || player.photo_url || player.kalkPlayer?.raw?.photo_url;
  if (isRealPhoto(remote)) return remote;

  if (!firstName || !lastName) return null;
  const forward = `${normalizePolishChars(firstName)}-${normalizePolishChars(lastName)}`;
  const reversed = `${normalizePolishChars(lastName)}-${normalizePolishChars(firstName)}`;
  if (LOCAL_PHOTOS.has(forward)) return `/photos/${forward}.webp`;
  if (LOCAL_PHOTOS.has(reversed)) return `/photos/${reversed}.webp`;
  return null;
}

/** @deprecated Użyj `resolvePlayerImage` / `PlayerAvatar` — zwraca `/photos/default.png`, gdy brak zdjęcia. */
export function resolvePlayerPhoto(player: PhotoSource): string {
  return resolvePlayerImage(player) ?? '/photos/default.png';
}
