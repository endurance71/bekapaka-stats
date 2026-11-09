import type { PostType } from './types';

export type Layout = {
  n: number;
  style: string;
  name: string;
  description: string;
  legacy?: boolean;
  types?: string[];
};

/** Catalogue thumbnail of one layout: legacy layouts keep their per-style file, new ones are numbered. */
export const layoutThumb = (type: Pick<PostType, 'id'>, layout: Layout) =>
  layout.legacy ? `/designs/${type.id}-${layout.style}.webp` : `/designs/${type.id}-v${layout.n}.webp`;
