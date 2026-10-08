// Channel contracts of Studio 2 publications. Shared with the browser (studio/src/lib/publications.ts):
// keep this module isomorphic — zod only, no Node APIs.
import { z } from 'zod';

export const PUBLICATION_VERSION = '1.0.0';

const text = (max) => z.string().trim().max(max).default('');
const hashtag = z.string().trim().regex(/^#[\p{L}\p{N}_]{2,40}$/u, 'Hashtag: znak # i litery/cyfry bez spacji');

export const channels = {
  instagram_feed: {
    label: 'Instagram · post',
    short: 'Instagram',
    formats: ['feed', 'square'],
    limits: { caption: 2200, hook: 125, hashtags: 5 },
  },
  instagram_story: {
    label: 'Instagram · relacja',
    short: 'Story',
    formats: ['story'],
    limits: { sticker: 60 },
  },
  facebook: {
    label: 'Facebook',
    short: 'Facebook',
    formats: ['feed', 'landscape', 'square'],
    limits: { text: 1500, hashtags: 2 },
  },
  website: {
    label: 'Strona bekapaka.pl',
    short: 'WWW',
    formats: ['landscape', 'feed'],
    // docs/public-site-operations.md: excerpt 140–220 characters (events 90–180).
    limits: { title: 90, excerptMin: 140, excerptMax: 220, content: 20000 },
  },
};
export const channelIds = Object.keys(channels);

export const copySchemas = {
  instagram_feed: z
    .object({
      caption: text(2200),
      hashtags: z.array(hashtag).max(5).default([]),
      firstComment: text(500),
      altText: text(1500),
    })
    .strict(),
  instagram_story: z
    .object({
      stickerText: text(60),
      sticker: z.enum(['none', 'link', 'countdown', 'poll', 'question']).default('none'),
      link: z.string().trim().max(500).url().or(z.literal('')).default(''),
      altText: text(1500),
    })
    .strict(),
  facebook: z
    .object({
      text: text(1500),
      hashtags: z.array(hashtag).max(2).default([]),
      link: z.string().trim().max(500).url().or(z.literal('')).default(''),
      altText: text(1500),
    })
    .strict(),
  website: z
    .object({
      title: text(90),
      excerpt: text(300),
      content: text(20000),
      tags: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
      coverAlt: text(300),
    })
    .strict(),
};
export const emptyCopy = (channel) => copySchemas[channel].parse({});

// Public, confirmed facts of the event. Copy (manual, AI or agent) may only use these.
export const factsSchema = z
  .object({
    kind: z.enum(['match', 'tournament', 'player', 'partner', 'club', 'statistics', 'manual']).default('manual'),
    title: text(180),
    competition: text(80),
    seasonLabel: text(60),
    round: text(30),
    opponent: text(100),
    date: text(40),
    originalDate: text(40),
    venue: text(100),
    entryInfo: text(80),
    scoreUs: z.number().int().min(0).max(999).nullable().default(null),
    scoreThem: z.number().int().min(0).max(999).nullable().default(null),
    leaders: z
      .array(z.object({ name: text(100), value: text(20), stat: text(10) }).strict())
      .max(12)
      .default([]),
    person: text(120),
    partner: text(180),
    edition: text(10),
    notes: text(1500),
    link: z.string().trim().max(500).url().or(z.literal('')).default(''),
  })
  .strict();
export const emptyFacts = () => factsSchema.parse({});

export const itemStatuses = {
  draft: 'Robocza',
  approved: 'Zatwierdzona',
  published: 'Opublikowana',
  skipped: 'Pominięta',
};
