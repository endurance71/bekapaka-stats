// Feed variety: the owner found the profile monotonous when every post used the same dark score board
// (GMVT series, 18.10.2026). Before approving a feed post Studio compares its graphic with the recent
// and scheduled posts of the same channel and warns about repetition. Isomorphic, pure rules.
import { compositionLabel, postType } from '../post-types.js';

/** Channels shown as a grid / timeline where repetition is visible. */
export const GRID_CHANNELS = ['instagram_feed', 'facebook'];
/** How many posts the grid preview shows (Instagram profile: 3 × 3). */
export const GRID_SIZE = 9;

/** What makes two graphics look alike: composition (post type + style), uniform kit and material. */
export function signatureOf(payload) {
  if (!payload) return null;
  return {
    family: payload.family || null,
    postType: payload.postType || null,
    visualStyle: payload.visualStyle || null,
    kit: payload.content?.kit || 'A',
    material: payload.content?.backgroundAssetId || 'brand',
  };
}

export const compositionKey = (s) => (s?.postType && s.visualStyle ? `${s.postType}:${s.visualStyle}` : null);

export function compositionName(s) {
  if (!s) return '';
  if (s.composition === 'external') return 'grafika spoza Studio';
  const type = postType(s.postType);
  return [type?.label, type ? compositionLabel(type, s.visualStyle) : s.visualStyle].filter(Boolean).join(' · ');
}

const when = (entry) => entry.publishedAt || entry.plannedAt || null;

/**
 * Warnings for a candidate post against the channel's other posts.
 * @param {{signature: object|null, plannedAt?: string|null}} candidate
 * @param {{signature: object|null, publishedAt?: string|null, plannedAt?: string|null}[]} history any order
 */
export function varietyWarnings(candidate, history) {
  const key = compositionKey(candidate.signature);
  if (!key) return [];
  const at = candidate.plannedAt ? Date.parse(candidate.plannedAt) : Infinity;
  // Posts that come before the candidate in the grid, newest first.
  const before = history
    .filter((h) => when(h) && Date.parse(when(h)) <= at)
    .sort((a, b) => Date.parse(when(b)) - Date.parse(when(a)));
  const warnings = [];
  const previous = before[0];
  const name = compositionName(candidate.signature);
  if (previous && compositionKey(previous.signature) === key)
    warnings.push({ rule: 'previous', message: `Ta sama kompozycja co poprzedni post (${name}).` });
  const same = before.slice(0, 5).filter((h) => compositionKey(h.signature) === key).length;
  if (same + 1 >= 3) warnings.push({ rule: 'frequent', message: `Ta sama kompozycja w ${same + 1} z ostatnich ${Math.min(before.length, 5) + 1} postów (${name}).` });
  const material = candidate.signature.material;
  if (previous && material && material !== 'brand' && previous.signature?.material === material)
    warnings.push({ rule: 'material', message: 'To samo tło co w poprzednim poście.' });
  return warnings;
}
