import { z } from 'zod';

export const BRAND_VERSION = '2.0.2026-10-03';
export const RENDERER_VERSION = '1.0.5';
export const formats = {
  feed: { label: 'Post 4:5', width: 1080, height: 1350 },
  story: { label: 'Relacja 9:16', width: 1080, height: 1920 },
  square: { label: 'Kwadrat 1:1', width: 1080, height: 1080 },
  landscape: { label: 'Poziomo 16:9', width: 1920, height: 1080 },
};
const portrait = ['feed', 'story'];
const all = Object.keys(formats);
export const templates = [
  { id: 'announcement', label: 'Zapowiedź meczu', description: 'Termin, rywal i miejsce. Wszystko, czego potrzebuje kibic.', formats: all, variants: ['standard', 'matchday', 'postponed', 'cancelled'], layouts: ['marks', 'type'] },
  { id: 'result', label: 'Wynik meczu', description: 'Wygrana, porażka, przerwa i wynik na żywo.', formats: all, variants: ['final', 'halftime', 'live'], layouts: ['board', 'photo'] },
  { id: 'lineup', label: 'Skład', description: 'Pierwsza piątka i pełny skład w klubowych koszulkach.', formats: portrait, variants: ['five', 'full'], layouts: ['jerseys'] },
  { id: 'player', label: 'Zawodnik / MVP', description: 'Nasi zawodnicy, nowe twarze i wyróżnienia.', formats: portrait, variants: ['profile', 'new', 'mvp'], layouts: ['photo', 'type'] },
  { id: 'tournament', label: 'Turniej', description: 'Zapowiedź, program i podsumowanie wydarzenia.', formats: all, variants: ['announcement', 'program', 'summary'], layouts: ['poster'] },
  { id: 'report', label: 'Relacja / karuzela', description: 'Prawdziwe zdjęcia i historia meczu w czterech slajdach.', formats: portrait, variants: ['cover', 'photo', 'carousel'], layouts: ['editorial'] },
  { id: 'partners', label: 'Partnerzy', description: 'Firmy i instytucje, które grają z nami.', formats: portrait, variants: ['wall', 'spotlight', 'thanks'], layouts: ['tiles'] },
  { id: 'schedule', label: 'Ogłoszenie / terminarz', description: 'Daty, aktualności i klubowe ogłoszenia na papierze.', formats: all, variants: ['schedule', 'notice', 'news'], layouts: ['paper'] },
].map(t => ({ ...t, version: '1.0.0', status: 'draft' }));
const text = (max) => z.string().trim().max(max).default('');
const id = z.string().min(1).max(128);
const person = z.object({ id: text(128), firstName: text(60), lastName: text(80), number: z.string().regex(/^\d{1,3}$/).or(z.literal('')).default(''), position: text(40) }).strict();
const sourceSchema = z.object({ kind: z.enum(['manual', 'match', 'player', 'event', 'news']).default('manual'), id: text(128), seasonId: text(128), hash: text(128), fetchedAt: text(40) }).strict();
export const projectContentSchema = z.object({
  opponent: text(100), opponentShort: text(8), date: text(40), originalDate: text(40), venue: text(100), title: text(180), body: text(1500),
  scoreUs: z.number().int().min(0).max(999).nullable().default(null), scoreThem: z.number().int().min(0).max(999).nullable().default(null),
  entryInfo: text(80), phase: text(50), nextMatch: text(160), firstName: text(60), lastName: text(80), number: z.string().regex(/^\d{1,3}$/).or(z.literal('')).default(''), position: text(40),
  edition: z.number().int().min(1).max(99).nullable().default(null), teams: z.number().int().min(1).max(128).nullable().default(null), days: z.number().int().min(1).max(30).nullable().default(null),
  statistics: z.array(z.object({ label: z.enum(['PTS', 'REB', 'AST', 'PPG', 'RPG', 'APG']), value: z.number().min(0).max(999) }).strict()).max(3).default([]),
  lineup: z.array(person).max(60).default([]),
  schedule: z.array(z.object({ date: text(40), opponent: text(100), round: text(30) }).strict()).max(60).default([]),
  slides: z.array(z.object({ title: text(180), body: text(600), altText: text(1500), assetId: id.nullable().default(null) }).strict()).max(4).default([]),
  partnerIds: z.array(id).max(60).default([]), photoAssetId: id.nullable().default(null), backgroundAssetId: id.nullable().default(null),
  crop: z.object({ x: z.number().min(0).max(1).default(.5), y: z.number().min(0).max(1).default(.5), zoom: z.number().min(1).max(3).default(1) }).default({ x: .5, y: .5, zoom: 1 }),
  caption: text(4000), altText: text(1500), link: z.string().max(500).url().or(z.literal('')).default(''), kit: z.enum(['A', 'B']).default('A'),
  kitBConfirmed: z.boolean().default(false), lineupConfirmed: z.boolean().default(false), mvpConfirmed: z.boolean().default(false),
  references: z.array(sourceSchema).max(5).default([]),
  source: sourceSchema.default({ kind: 'manual', id: '', seasonId: '', hash: '', fetchedAt: '' }),
}).strict();
export const projectSchema = z.object({
  name: z.string().trim().min(1).max(180), family: z.enum(templates.map(t => t.id)), variant: z.string().min(1).max(30), layout: z.string().min(1).max(30),
  formats: z.array(z.enum(Object.keys(formats))).min(1).max(4).refine(a => new Set(a).size === a.length, 'Formaty nie mogą się powtarzać'),
  content: projectContentSchema,
}).strict().superRefine((v, ctx) => {
  const t = templates.find(t => t.id === v.family);
  for (const [path, ok] of [['variant', t.variants.includes(v.variant)], ['layout', t.layouts.includes(v.layout)], ['formats', v.formats.every(f => t.formats.includes(f))]]) {
    if (!ok) ctx.addIssue({ code: 'custom', path: [path], message: 'Wariant lub format nie należy do tej rodziny' });
  }
});
export const assetMetadataSchema = z.object({
  name: z.string().trim().min(1).max(180), kind: z.enum(['photo', 'portrait', 'cutout', 'background', 'logo']),
  origin: z.string().trim().min(1).max(500), people: text(500), jerseyNumber: text(3), consent: z.enum(['unknown', 'granted', 'not_required', 'withdrawn']).default('unknown'),
  status: z.enum(['draft', 'approved', 'retired']).default('draft'),
}).strict();
export const partnerSchema = z.object({ name: z.string().trim().min(1).max(180), assetId: id.nullable().default(null), status: z.enum(['draft', 'approved', 'retired']).default('draft'), contractNote: text(1000) }).strict();
export function newProject(family = 'announcement') {
  const t = templates.find(t => t.id === family) || templates[0];
  return projectSchema.parse({ name: t.label, family: t.id, variant: t.variants[0], layout: t.layouts[0], formats: ['feed', 'story'], content: { venue: t.id === 'tournament' ? 'CESiR Bobolice' : 'KOSiR Koszalin' } });
}
export function assetIds(content) {
  return [...new Set([content.photoAssetId, content.backgroundAssetId, ...content.slides.map(s => s.assetId)].filter(Boolean))];
}
