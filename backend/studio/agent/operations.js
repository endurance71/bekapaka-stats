// Studio text operations an external agent (the owner's Claude Code on their own subscription) can run through MCP:
// prepare returns the exact prompt and schema Studio would send to a model; save validates the answer with the same
// contracts as Studio's own AI jobs and writes it as an agent draft. The owner still approves and publishes.
import { z } from 'zod';
import { fail } from '../config.js';
import { hash } from '../storage.js';
import { playbook } from '../publications/playbooks.js';
import { buildCopyPrompt } from '../publications/prompts.js';
import { buildReportPrompt, reportPartsSchema, reportReady } from '../publications/report-prompt.js';
import { assembleReport } from '../publications/templates.js';
import { channelIds, copySchemas } from '../publications/channels.js';
import { factsConfirmed, getSettings, publicationView, updateItem } from '../publications/service.js';
import { currentSponsorFooter } from '../publications/sponsors.js';

const REPORT_PLAYBOOKS = ['match-result', 'match-report'];
const promptHash = (p) => hash({ version: p.version, system: p.system, user: p.user, schema: p.schema });
const parseOutput = (output) => {
  if (typeof output !== 'string') return output;
  try {
    return JSON.parse(output);
  } catch {
    fail(422, 'Wynik musi być obiektem JSON zgodnym ze schematem zadania');
  }
};
const issues = (error) => error.issues.slice(0, 5).map((i) => `${i.path.join('.') || '(całość)'}: ${i.message}`).join('; ');
const withReport = (view) => REPORT_PLAYBOOKS.includes(view.playbook) && reportReady(view.facts);

async function loadPublication(db, owner, publicationId) {
  const view = await publicationView(db, owner, publicationId);
  if (!factsConfirmed(view)) fail(422, 'Potwierdź fakty publikacji w Studio przed wysłaniem ich do AI');
  if (!playbook(view.playbook)) fail(422, 'Nieznany schemat publikacji');
  return view;
}

async function saveDraft(db, owner, view, channel, copy, version) {
  const item = view.items.find((i) => i.channel === channel);
  if (!item) return { channel, saved: false, reason: 'Publikacja nie ma tego kanału' };
  if (item.status !== 'draft') return { channel, saved: false, reason: `Kanał ma status „${item.status}” — agent zmienia tylko robocze teksty` };
  const next = await updateItem(db, owner, view.id, item.id, { expectedRevision: item.revision, copy, copyOrigin: 'agent', promptVersion: `agent:${version}` }, 'agent');
  const saved = next.items.find((i) => i.id === item.id);
  return { channel, saved: true, lint: saved.issues, blockers: saved.ready };
}

export const studioAgentOperations = {
  'studio.copy': {
    label: 'Teksty publikacji (IG, FB, WWW) — jedna odpowiedź JSON dla wybranych kanałów',
    output: 'json',
    args: {
      type: 'object',
      properties: {
        publicationId: { type: 'string' },
        channels: { type: 'array', items: { type: 'string', enum: channelIds } },
        brief: { type: 'string', description: 'Wskazówka właściciela (opcjonalnie, do 500 znaków)' },
      },
      required: ['publicationId', 'channels'],
    },
    async prepare(db, owner, rawArgs) {
      const args = z.object({ publicationId: z.string().uuid(), channels: z.array(z.enum(channelIds)).min(1), brief: z.string().trim().max(500).default('') }).strict().parse(rawArgs);
      const view = await loadPublication(db, owner, args.publicationId);
      // Like Studio: the website article of a match with KALK statistics is the reporter task (studio.report).
      const channels = args.channels.filter((c) => view.items.some((i) => i.channel === c) && !(c === 'website' && withReport(view)));
      if (!channels.length) fail(422, 'Brak kanałów do napisania (tekst strony meczu z danymi KALK pisze zadanie studio.report)');
      const prompt = buildCopyPrompt({
        playbookDef: playbook(view.playbook),
        facts: view.facts,
        channelList: channels,
        hashtags: (await getSettings(db, owner)).hashtags,
        brief: args.brief,
        aiArtwork: view.items.some((i) => i.graphic?.aiAssets),
      });
      return { inputHash: promptHash(prompt), version: prompt.version, prompt: { system: prompt.system, user: prompt.user, schema: prompt.schema }, view, channels };
    },
    async save(db, owner, prep, output) {
      const json = parseOutput(output);
      // Every channel must pass before anything is written, as with Studio's own AI copy.
      const copies = {};
      for (const channel of prep.channels) {
        const parsed = copySchemas[channel].safeParse(json?.[channel]);
        if (!parsed.success) fail(422, `Tekst kanału ${channel} nie spełnia kontraktu: ${issues(parsed.error)}`);
        copies[channel] = parsed.data;
      }
      // Like Studio's own AI copy: the Facebook sponsor footer comes from bekapaka.pl/sponsorzy, not from the model.
      if (copies.facebook) copies.facebook = { ...copies.facebook, sponsors: await currentSponsorFooter() };
      const results = [];
      for (const channel of prep.channels) results.push(await saveDraft(db, owner, prep.view, channel, copies[channel], prep.version));
      return { publicationId: prep.view.id, channels: results };
    },
  },
  'studio.report': {
    label: 'Relacja meczowa na stronę (proza; Studio dokłada blok danych KALK)',
    output: 'json',
    args: {
      type: 'object',
      properties: { publicationId: { type: 'string' }, brief: { type: 'string', description: 'Wskazówka właściciela (opcjonalnie)' } },
      required: ['publicationId'],
    },
    async prepare(db, owner, rawArgs) {
      const args = z.object({ publicationId: z.string().uuid(), brief: z.string().trim().max(500).default('') }).strict().parse(rawArgs);
      const view = await loadPublication(db, owner, args.publicationId);
      if (!view.items.some((i) => i.channel === 'website')) fail(422, 'Publikacja nie ma kanału strony');
      if (!withReport(view)) fail(422, 'Relacja wymaga meczu z wynikiem i danymi KALK (schemat match-result / match-report)');
      const prompt = buildReportPrompt(view.facts, args.brief);
      return { inputHash: promptHash(prompt), version: prompt.version, prompt: { system: prompt.system, user: prompt.user, schema: prompt.schema }, view };
    },
    async save(db, owner, prep, output) {
      const parts = reportPartsSchema.safeParse(parseOutput(output));
      if (!parts.success) fail(422, `Relacja nie spełnia kontraktu: ${issues(parts.error)}`);
      let website;
      try {
        website = assembleReport(parts.data, prep.view.facts);
      } catch {
        fail(422, 'Relacja nie mieści się w kontrakcie strony');
      }
      return { publicationId: prep.view.id, channels: [await saveDraft(db, owner, prep.view, 'website', website, prep.version)] };
    },
  },
};
