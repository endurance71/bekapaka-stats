// Browser side of Studio 2 publications. Contracts, schematic copy and the brand lint are the same
// modules the API uses (backend/studio/publications), so a draft that passes here passes on the server.
export {
  channels,
  channelIds,
  copySchemas,
  factsSchema,
  emptyFacts,
  itemStatuses,
} from '../../../backend/studio/publications/channels.js';
export { playbooks, playbook, playbookCategories } from '../../../backend/studio/publications/playbooks.js';
export { schematicCopy, when, shortDate } from '../../../backend/studio/publications/templates.js';
export { lintCopy, hasErrors } from '../../../backend/studio/publications/brand-lint.js';
export { channelTexts, mainText } from '../../../backend/studio/publications/texts.js';
export { brandVoice, channelInstructions, PROMPT_VERSION } from '../../../backend/studio/publications/prompts.js';

import { z } from 'zod';
import { channels, copySchemas, factsSchema } from '../../../backend/studio/publications/channels.js';
import { playbooks } from '../../../backend/studio/publications/playbooks.js';
import type { Output } from './types';

export type ChannelId = keyof typeof channels;
export type Facts = z.infer<typeof factsSchema>;
export type Copy = { [K in ChannelId]: z.infer<(typeof copySchemas)[K]> };
export type AnyCopy = Copy[ChannelId];
export type Playbook = (typeof playbooks)[number];
export type Issue = { level: 'error' | 'warning'; field: string; message: string };
export type Graphic = {
  projectId: string;
  name: string;
  postType: string;
  formats: string[];
  revision: number;
  status: string;
  valid: boolean;
  errors: { field: string; message: string }[];
  exportJobId: string | null;
  exportFiles: Output[];
  aiAssets: boolean;
  format: string;
  hasFormat: boolean;
};
export type PublishEvent = {
  id: string;
  action: string;
  actor: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
};
export type Item = {
  id: string;
  channel: ChannelId;
  projectId: string | null;
  format: string;
  copy: AnyCopy;
  copyOrigin: 'manual' | 'template' | 'ai' | 'agent';
  promptVersion: string | null;
  status: 'draft' | 'approved' | 'published' | 'skipped';
  plannedAt: string | null;
  publishedAt: string | null;
  externalUrl: string | null;
  externalId: string | null;
  revision: number;
  graphic: Graphic | null;
  issues: Issue[];
  ready: string[];
  stale: boolean;
  events?: PublishEvent[];
};
export type Publication = {
  id: string;
  title: string;
  playbook: string;
  status: 'draft' | 'archived';
  facts: Facts;
  factsHash: string;
  factsConfirmed: boolean;
  sourceRef: { kind: 'match'; id: string; seasonId: string } | null;
  plannedAt: string | null;
  revision: number;
  items: Item[];
  createdAt: string;
  updatedAt: string;
};
export type PublicationSummary = Omit<Publication, 'items'> & {
  items: Pick<Item, 'id' | 'channel' | 'status' | 'plannedAt' | 'publishedAt' | 'projectId' | 'revision'>[];
};
export type Suggestion = {
  playbook: string;
  reason: string;
  seasonId: string;
  match: {
    id: string;
    opponent: string;
    date: string;
    scoreUs: number | null;
    scoreThem: number | null;
    round: string;
  };
};
export type Settings = { hashtags: { instagram: string[]; facebook: string[] } };

export const originLabels: Record<Item['copyOrigin'], string> = {
  manual: 'ręcznie',
  template: 'ze schematu',
  ai: 'propozycja AI',
  agent: 'od agenta',
};

// Aggregate state of a publication for lists and the calendar.
export function publicationState(items: Pick<Item, 'status'>[]) {
  const active = items.filter((i) => i.status !== 'skipped');
  if (!active.length) return { key: 'skipped', label: 'Pominięta' };
  if (active.every((i) => i.status === 'published')) return { key: 'published', label: 'Opublikowana' };
  if (active.some((i) => i.status === 'published')) return { key: 'partial', label: 'Częściowo opublikowana' };
  if (active.every((i) => i.status === 'approved')) return { key: 'approved', label: 'Gotowa do publikacji' };
  return { key: 'draft', label: 'W przygotowaniu' };
}
