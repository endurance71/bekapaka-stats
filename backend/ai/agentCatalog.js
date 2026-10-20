// Katalog analiz panelu dla agenta MCP (Claude Desktop / Claude Code właściciela): co brakuje albo jest nieaktualne
// — z gotowymi argumentami prepare_ai_task — oraz odczyt zapisanych analiz. Stan liczony tak samo jak w panelu.
import { prisma } from '../lib/prisma.js';
import { resolveSeasonId } from '../seasonService.js';
import { getAiAnalysesCatalog } from './catalog.js';
import { findMatchAiTarget, getTeamBriefingCached, prepareGameAnalysis, preparePlayerDevelopment, prepareScoutingReport, prepareTeamBriefing } from './generate.js';
import { TEMPLATE_MODEL_NAME } from './geminiClient.js';
import { findScoutingReport } from './scoutingData.js';
import { buildPersonnelMdFromAnalysis } from './scoutingPersonnel.js';
import { cachedPregame, preparePregame } from './tacticsOps.js';

export const ANALYSIS_KINDS = ['match', 'player', 'scouting', 'briefing', 'pregame'];
export const ANALYSIS_STATUSES = ['missing', 'stale', 'fresh'];

/** Argument zadania wskazujący cel analizy (dla briefingu brak celu). */
const TARGET_ARG = { match: 'gameId', player: 'playerId', scouting: 'opponent', pregame: 'opponent' };

/** @param {string} kind @param {string | null | undefined} target @param {string | null | undefined} seasonId */
export function taskFor(kind, target, seasonId) {
  const args = {};
  if (TARGET_ARG[kind] && target) args[TARGET_ARG[kind]] = String(target);
  if (seasonId) args.seasonId = seasonId;
  return { operation: `panel.${kind}`, args };
}

/** @param {{ hasContent: boolean, stale?: boolean, isTemplate?: boolean }} item */
export function statusOf(item) {
  if (!item.hasContent) return 'missing';
  return item.stale || item.isTemplate ? 'stale' : 'fresh';
}

export async function listSeasonsForAgent() {
  const [rows, defaultSeasonId] = await Promise.all([
    prisma.kalkSeason.findMany({ orderBy: [{ startsAt: 'desc' }, { id: 'desc' }], select: { id: true, label: true, isActive: true, startsAt: true, endsAt: true } }),
    resolveSeasonId(undefined)
  ]);
  return { defaultSeasonId: defaultSeasonId ?? null, seasons: rows };
}

/**
 * Pozycje katalogu panelu w postaci dla agenta. Pozycje bez danych (np. mecz bez box score, zawodnik z < 3 meczami)
 * nie trafiają na listę, są tylko liczone.
 * @param {Array<Record<string, any>>} items pozycje z getAiAnalysesCatalog
 */
export function agentItems(items) {
  const out = [];
  let notReady = 0;
  for (const item of items) {
    if (item.dataReady === false) {
      notReady += 1;
      continue;
    }
    out.push({
      kind: item.generateKind,
      title: item.title,
      subtitle: item.subtitle ?? null,
      status: statusOf(item),
      staleReason: item.isTemplate ? 'template' : item.staleReason ?? null,
      generatedAt: item.generatedAt ?? null,
      model: item.model ?? null,
      task: taskFor(item.generateKind, item.generateTarget, item.seasonId)
    });
  }
  return { items: out, notReady };
}

/** Karta przedmeczowa najbliższego rywala — nie ma jej w katalogu panelu, a nie śledzi zmian danych (brak hasha). */
async function pregameItem(seasonId) {
  let prep;
  try {
    prep = await preparePregame({ seasonId });
  } catch {
    return null;
  }
  const saved = await cachedPregame(prep);
  return {
    kind: 'pregame',
    title: `Karta przedmeczowa — ${prep.opponent}`,
    subtitle: prep.nextMatch?.date ? new Date(prep.nextMatch.date).toLocaleDateString('pl-PL') : null,
    status: saved ? 'fresh' : 'missing',
    staleReason: null,
    generatedAt: saved?.briefing.updatedAt?.toISOString() ?? null,
    model: saved?.briefing.model ?? null,
    note: 'Karta nie śledzi zmian danych — przed meczem odśwież ją, jeśli zmieniła się kadra albo scouting.',
    task: taskFor('pregame', prep.opponent, prep.seasonId)
  };
}

/**
 * @param {{ seasonId?: string, kind?: string, status?: string[] }} [filter] — domyślnie brakujące i nieaktualne
 */
export async function panelCatalogForAgent({ seasonId, kind, status = ['missing', 'stale'] } = {}) {
  const catalog = await getAiAnalysesCatalog(seasonId);
  const { items, notReady } = agentItems(catalog.items);
  if (!kind || kind === 'pregame') {
    const pregame = await pregameItem(catalog.seasonId);
    if (pregame) items.push(pregame);
  }
  const counts = Object.fromEntries(ANALYSIS_STATUSES.map((s) => [s, items.filter((i) => i.status === s).length]));
  const selected = items.filter((i) => (!kind || i.kind === kind) && status.includes(i.status));
  return { seasonId: catalog.seasonId, counts, notReady, items: selected };
}

const iso = (d) => (d ? new Date(d).toISOString() : null);

/** Hash bieżących danych (jak w prepare_ai_task) albo powód, dla którego nie da się go policzyć. */
async function currentHash(prepare) {
  try {
    return { prep: await prepare() };
  } catch (err) {
    return { error: err.message || 'Brak danych do oceny aktualności' };
  }
}

/**
 * Zapisana analiza panelu z oceną aktualności względem bieżących danych (ten sam hash co prepare_ai_task).
 * Treść zwracana jest zawsze, także gdy bieżących danych nie da się złożyć — wtedy status `unknown` i powód w `note`.
 * @param {{ kind: string, target?: string, seasonId?: string }} input
 */
export async function readPanelAnalysis({ kind, target, seasonId }) {
  if (TARGET_ARG[kind] && !target && kind !== 'pregame') {
    throw Object.assign(new Error(`Podaj target (${TARGET_ARG[kind]})`), { status: 400 });
  }
  if (kind === 'match') {
    const [saved, now] = await Promise.all([findMatchAiTarget(target, seasonId), currentHash(() => prepareGameAnalysis(target, { seasonId }))]);
    const e = now.prep?.target?.existing ?? saved?.existing;
    if (!saved && !now.prep) throw Object.assign(new Error(`Nie znaleziono meczu ${target}`), { status: 404 });
    return view(kind, target, 'markdown', e?.aiSummary, { savedHash: e?.aiSummaryHash, now, generatedAt: e?.aiSummaryAt, model: e?.aiSummaryModel });
  }
  if (kind === 'player') {
    const [e, now] = await Promise.all([
      prisma.rosterPlayer.findUnique({ where: { id: target }, select: { aiDevelopmentSummary: true, aiDevelopmentHash: true, aiDevelopmentAt: true, aiDevelopmentModel: true, aiDevelopmentSeasonId: true } }),
      currentHash(() => preparePlayerDevelopment(target, { seasonId }))
    ]);
    if (!e) throw Object.assign(new Error(`Nie znaleziono zawodnika ${target}`), { status: 404 });
    // Plan może pochodzić z innego sezonu niż żądany (za mało meczów w bieżącym) — sezon planu podany jawnie.
    return {
      ...view(kind, target, 'markdown', e.aiDevelopmentSummary, {
        savedHash: e.aiDevelopmentHash,
        now,
        generatedAt: e.aiDevelopmentAt,
        model: e.aiDevelopmentModel,
        isTemplate: e.aiDevelopmentModel === TEMPLATE_MODEL_NAME
      }),
      seasonId: e.aiDevelopmentSeasonId ?? null
    };
  }
  if (kind === 'scouting') {
    const now = await currentHash(() => prepareScoutingReport(target, { seasonId }));
    const name = now.prep?.ctx.opponentName ?? target;
    const { report } = await findScoutingReport(name, now.prep?.ctx.seasonId ?? (await resolveSeasonId(seasonId)));
    const personnel = report?.analysisJson ? buildPersonnelMdFromAnalysis(report.analysisJson) : null;
    const content = report?.summaryMd ? [report.summaryMd, personnel].filter(Boolean).join('\n\n') : null;
    return view(kind, name, 'markdown', content, { savedHash: report?.sourceHash, now, generatedAt: report?.generatedAt, model: report?.model });
  }
  if (kind === 'briefing') {
    const [b, now] = await Promise.all([getTeamBriefingCached(seasonId), currentHash(() => prepareTeamBriefing({ seasonId }))]);
    return view(kind, null, 'markdown', b?.contentMd, { savedHash: b?.sourceHash, now, generatedAt: b?.generatedAt, model: b?.model });
  }
  if (kind === 'pregame') {
    const prep = await preparePregame({ seasonId, opponent: target });
    const saved = await cachedPregame(prep);
    const b = saved?.briefing;
    const content = b && {
      matchDate: iso(b.matchDate),
      venue: b.venue,
      gatheringTime: b.gatheringTime,
      tipoffTime: b.tipoffTime,
      jerseyColor: b.jerseyColor,
      tacticalKeys: b.tacticalKeys,
      startingFive: b.startingFive,
      benchKeys: b.benchKeys
    };
    // Karta nie zapisuje hasha danych — aktualności nie da się ocenić.
    return { ...view(kind, prep.opponent, 'json', content, { generatedAt: b?.updatedAt, model: b?.model }), status: b ? 'fresh' : 'missing', staleTracking: false };
  }
  throw Object.assign(new Error(`Nieznany rodzaj analizy: ${kind}`), { status: 400 });
}

function view(kind, target, format, content, { savedHash, now, generatedAt, model, isTemplate = false }) {
  const hasContent = typeof content === 'string' ? Boolean(content.trim()) : Boolean(content);
  const inputHash = now?.prep?.inputHash;
  const status = hasContent && now?.error ? 'unknown' : statusOf({ hasContent, stale: hasContent && Boolean(inputHash) && savedHash !== inputHash, isTemplate });
  return {
    kind,
    target: target ?? null,
    status,
    ...(now?.error ? { note: `Bieżących danych nie da się teraz złożyć: ${now.error}` } : {}),
    format,
    generatedAt: iso(generatedAt),
    model: model ?? null,
    content: hasContent ? content : null
  };
}
