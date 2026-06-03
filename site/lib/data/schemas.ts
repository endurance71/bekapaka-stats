import { z } from 'zod'

const strapiEntrySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  attributes: z.record(z.string(), z.unknown()).optional()
}).catchall(z.unknown())

export const strapiCollectionSchema = z.object({
  data: z.union([z.array(strapiEntrySchema), strapiEntrySchema]).optional()
})

export const newsAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  mime: z.string().optional()
})

export const newsPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  publishedAt: z.string(),
  coverImageUrl: z.string().optional(),
  attachments: z.array(newsAttachmentSchema).default([])
})

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  type: z.string(),
  description: z.string(),
  location: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  registrationUrl: z.string()
})

export const sponsorSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  websiteUrl: z.string(),
  order: z.number(),
  logoUrl: z.string().optional()
})

export const documentSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  effectiveDate: z.string(),
  fileUrl: z.string()
})

export const homepageSectionSchema = z.object({
  id: z.string(),
  key: z.string(),
  title: z.string(),
  subtitle: z.string(),
  body: z.string(),
  order: z.number(),
  isEnabled: z.boolean()
})

export const teamStandingSchema = z.object({
  name: z.string(),
  position: z.number(),
  wins: z.number(),
  losses: z.number()
})

export const playerGameLogSchema = z.object({
  date: z.string(),
  opponent: z.string(),
  min: z.union([z.string(), z.number()]).optional(),
  pts: z.number(),
  reb: z.number(),
  ast: z.number(),
  stl: z.number().optional(),
  blk: z.number().optional(),
  tov: z.number().optional(),
  pf: z.number().optional(),
  fgm: z.number().optional(),
  fga: z.number().optional(),
  threePm: z.number().optional(),
  threePa: z.number().optional(),
  ftm: z.number().optional(),
  fta: z.number().optional(),
  eval: z.number().optional(),
  eFgPercentage: z.number().optional(),
  tsPercentage: z.number().optional(),
  plusMinus: z.number().optional()
})

export const rosterPlayerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  position: z.string(),
  number: z.string(),
  photo: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  ppg: z.number().optional(),
  rpg: z.number().optional(),
  apg: z.number().optional(),
  eval: z.number().nullable().optional(),
  fgPercentage: z.number().optional(),
  threePercentage: z.number().optional(),
  ftPercentage: z.number().optional(),
  tsPercentage: z.number().optional(),
  eFgPercentage: z.number().optional(),
  plusMinus: z.number().optional(),
  gamesPlayed: z.number().optional(),
  birthDate: z.string().nullable().optional(),
  heightCm: z.number().nullable().optional(),
  aiDevelopmentSummary: z.string().nullable().optional(),
  games: z.array(playerGameLogSchema).optional()
})

export const gameSummarySchema = z.object({
  id: z.string(),
  date: z.string(),
  opponent: z.string(),
  result: z.string().nullable().optional(),
  scoreUs: z.number().nullable().optional(),
  scoreThem: z.number().nullable().optional(),
  homeAway: z.string().optional(),
  coachNotes: z.string().nullable().optional(),
  aiSummary: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  teams: z.array(z.any()).optional(),
  playerStats: z.array(z.any()).optional(),
  data: z.any().optional()
})

export type NewsPost = z.infer<typeof newsPostSchema>
export type NewsAttachment = z.infer<typeof newsAttachmentSchema>
export type EventItem = z.infer<typeof eventSchema>
export type SponsorItem = z.infer<typeof sponsorSchema>
export type DocumentItem = z.infer<typeof documentSchema>
export type HomepageSection = z.infer<typeof homepageSectionSchema>
export type TeamStanding = z.infer<typeof teamStandingSchema>
export type RosterPlayer = z.infer<typeof rosterPlayerSchema>
export type GameSummary = z.infer<typeof gameSummarySchema>

export type DataStateStatus = 'ok' | 'empty' | 'error'
export type DataStateSource = 'live' | 'fallback'

export type DataState<T> = {
  status: DataStateStatus
  data: T
  source: DataStateSource
  message?: string
}
