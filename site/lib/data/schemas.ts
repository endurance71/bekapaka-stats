import { z } from 'zod'

const strapiEntrySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  attributes: z.record(z.string(), z.unknown()).optional()
}).catchall(z.unknown())

export const strapiCollectionSchema = z.object({
  data: z.union([z.array(strapiEntrySchema), strapiEntrySchema]).optional()
})

export const newsPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  publishedAt: z.string(),
  coverImageUrl: z.string().optional()
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
  tier: z.string(),
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

export const rosterPlayerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  position: z.string(),
  number: z.string(),
  photo: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional()
})

export const gameSummarySchema = z.object({
  id: z.string(),
  date: z.string(),
  opponent: z.string(),
  result: z.string(),
  scoreUs: z.number(),
  scoreThem: z.number()
})

export type NewsPost = z.infer<typeof newsPostSchema>
export type EventItem = z.infer<typeof eventSchema>
export type SponsorItem = z.infer<typeof sponsorSchema>
export type DocumentItem = z.infer<typeof documentSchema>
export type HomepageSection = z.infer<typeof homepageSectionSchema>
export type TeamStanding = z.infer<typeof teamStandingSchema>
export type RosterPlayer = z.infer<typeof rosterPlayerSchema>
export type GameSummary = z.infer<typeof gameSummarySchema>

export type DataStateStatus = 'ok' | 'empty' | 'error'

export type DataState<T> = {
  status: DataStateStatus
  data: T
  message?: string
}
