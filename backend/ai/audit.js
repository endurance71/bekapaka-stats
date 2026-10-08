/**
 * Audyt wszystkich analiz AI: kompletność, aktualność (hash danych + wersja promptu),
 * szablon vs Gemini, kontrola faktów (liczby / nazwiska spoza payloadu), poprawność zagrywek AI.
 * Używany przez `scripts/audit-ai-analyses.js` i `GET /api/ai/audit`. Regeneracja zawsze ręczna.
 */
import { prisma } from '../lib/prisma.js';
import { getDetailedScouting, getRoster } from '../dataStore.js';
import { buildBriefingContext } from './buildBriefingContext.js';
import { buildMatchContext } from './buildMatchContext.js';
import { buildPlayerContext } from './buildPlayerContext.js';
import { buildScoutingContext } from './buildScoutingContext.js';
import { auditMatchAnalysisMarkdown } from './matchAnalysisMarkdown.js';
import { hasCompleteBriefingMarkdown } from './briefingMarkdown.js';
import { hasDetailedPlayerPlanMarkdown } from './playerDevelopmentMarkdown.js';
import { buildPersonnelMdFromAnalysis } from './scoutingPersonnel.js';
import { TEMPLATE_MODEL_NAME } from './geminiClient.js';
import { FACT_CHECK_SKIP_SECTIONS, factCheckText, matchDerivedNumbers } from './factCheck.js';
import { legacyReportMatchesSeason, parseScoutingReportKey } from './scoutingData.js';
import { validatePlayDiagram } from './responseSchemas.js';
import { mapLimit } from './catalog.js';

/** Sezon, którego dotyczył stary briefing `default` (sprzed briefingów per sezon). */
const LEGACY_BRIEFING_SEASON_ID = 'season_2025-2026';

/**
 * @typedef {{
 *   type: 'match' | 'player' | 'scouting' | 'briefing' | 'pregame' | 'play',
 *   id: string,
 *   label: string,
 *   seasonId: string | null,
 *   generatedAt: string | null,
 *   model: string | null,
 *   isTemplate: boolean,
 *   complete: boolean,
 *   stale: boolean | null,
 *   staleReason: string | null,
 *   issues: string[],
 *   factCheck: ReturnType<typeof factCheckText> | null,
 *   needsRegeneration: boolean,
 *   generateKind: string | null,
 *   generateTarget: string | null,
 *   viewPath: string | null
 * }} AiAuditRow
 */

/**
 * @param {Partial<AiAuditRow>} row
 * @returns {AiAuditRow}
 */
function finalizeRow(row) {
  const issues = row.issues || [];
  const factCheck = row.factCheck || null;
  const complete = row.complete !== false;
  const isTemplate = Boolean(row.isTemplate);
  const stale = row.stale ?? null;
  return {
    type: /** @type {AiAuditRow['type']} */ (row.type),
    id: String(row.id),
    label: row.label || String(row.id),
    seasonId: row.seasonId ?? null,
    generatedAt: row.generatedAt ?? null,
    model: row.model ?? null,
    isTemplate,
    complete,
    stale,
    staleReason: row.staleReason ?? null,
    issues,
    factCheck,
    needsRegeneration: !complete || stale === true || isTemplate || Boolean(factCheck?.suspicious) || issues.length > 0,
    generateKind: row.generateKind ?? null,
    generateTarget: row.generateTarget ?? null,
    viewPath: row.viewPath ?? null
  };
}

/**
 * @param {Date | null | undefined} d
 */
function iso(d) {
  return d instanceof Date ? d.toISOString() : d ? String(d) : null;
}

/**
 * @param {{ seasonId?: string, factCheck?: boolean, types?: string[] }} [options]
 * @returns {Promise<{ generatedAt: string, seasonId: string | null, rows: AiAuditRow[] }>}
 */
export async function runAiAudit(options = {}) {
  const seasonFilter = options.seasonId || null;
  const doFactCheck = options.factCheck !== false;
  const types = new Set(options.types?.length ? options.types : ['match', 'player', 'scouting', 'briefing', 'pregame', 'play']);
  const seasons = await prisma.kalkSeason.findMany();
  const activeSeason = seasons.find((s) => s.isActive) || null;
  /** @type {AiAuditRow[]} */
  const rows = [];

  if (types.has('match')) {
    const kalkMatches = await prisma.kalkMatch.findMany({
      where: { aiSummary: { not: null }, ...(seasonFilter ? { seasonId: seasonFilter } : {}) },
      select: {
        id: true,
        seasonId: true,
        homeTeamName: true,
        guestTeamName: true,
        aiSummary: true,
        aiSummaryAt: true,
        aiSummaryModel: true,
        aiSummaryHash: true
      }
    });
    const legacyGames = seasonFilter
      ? []
      : await prisma.game.findMany({
          where: { aiSummary: { not: null } },
          select: { id: true, opponent: true, aiSummary: true, aiSummaryAt: true, aiSummaryModel: true, aiSummaryHash: true }
        });

    const matchRows = await mapLimit(
      [
        ...kalkMatches.map((m) => ({ source: 'kalk', m })),
        ...legacyGames.map((m) => ({ source: 'legacy', m }))
      ],
      4,
      async ({ source, m }) => {
        const audit = auditMatchAnalysisMarkdown(m.aiSummary);
        const seasonId = source === 'kalk' ? m.seasonId : null;
        const label = source === 'kalk' ? `${m.homeTeamName} vs ${m.guestTeamName}` : `${m.opponent} (legacy)`;
        /** @type {Partial<AiAuditRow>} */
        const row = {
          type: 'match',
          id: m.id,
          label,
          seasonId,
          generatedAt: iso(m.aiSummaryAt),
          model: m.aiSummaryModel,
          complete: audit.complete,
          issues: audit.complete ? [] : [`niekompletna (${audit.sectionCount} sekcji, ${audit.length} znaków)`],
          generateKind: 'match',
          generateTarget: m.id,
          viewPath: `/games/${m.id}`
        };
        try {
          const ctx = await buildMatchContext(m.id, { seasonId, includeLeagueContext: true });
          row.stale = !m.aiSummaryHash || ctx.hash !== m.aiSummaryHash;
          row.staleReason = !m.aiSummaryHash ? 'no-hash' : row.stale ? 'hash-changed' : null;
          if (doFactCheck) {
            row.factCheck = factCheckText(m.aiSummary, ctx.payload, {
              skipSections: FACT_CHECK_SKIP_SECTIONS.match,
              extraNumbers: matchDerivedNumbers(ctx.payload)
            });
          }
        } catch (err) {
          row.stale = null;
          row.staleReason = 'context-unavailable';
          row.issues = [...(row.issues || []), `brak kontekstu: ${err?.message || err}`];
        }
        return finalizeRow(row);
      }
    );
    rows.push(...matchRows);
  }

  if (types.has('player')) {
    const players = await prisma.rosterPlayer.findMany({
      where: { aiDevelopmentSummary: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        aiDevelopmentSummary: true,
        aiDevelopmentAt: true,
        aiDevelopmentModel: true,
        aiDevelopmentHash: true
      }
    });
    const playerRows = await mapLimit(players, 4, async (p) => {
      const text = p.aiDevelopmentSummary || '';
      const complete = hasDetailedPlayerPlanMarkdown(text);
      /** @type {Partial<AiAuditRow>} */
      const row = {
        type: 'player',
        id: p.id,
        label: `${p.firstName} ${p.lastName}`.trim(),
        seasonId: seasonFilter || activeSeason?.id || null,
        generatedAt: iso(p.aiDevelopmentAt),
        model: p.aiDevelopmentModel,
        isTemplate: p.aiDevelopmentModel === TEMPLATE_MODEL_NAME,
        complete,
        issues: complete ? [] : [`niekompletny plan (${text.length} znaków)`],
        generateKind: 'player',
        generateTarget: p.id,
        viewPath: `/players/${p.id}`
      };
      try {
        const ctx = await buildPlayerContext(p.id, { seasonId: seasonFilter || undefined });
        row.seasonId = ctx.seasonId;
        row.stale = !p.aiDevelopmentHash || ctx.hash !== p.aiDevelopmentHash;
        row.staleReason = !p.aiDevelopmentHash ? 'no-hash' : row.stale ? 'hash-changed' : null;
        if (doFactCheck && !row.isTemplate) {
          row.factCheck = factCheckText(text, ctx.payload, { skipSections: FACT_CHECK_SKIP_SECTIONS.player });
        }
      } catch (err) {
        row.stale = null;
        row.staleReason = 'context-unavailable';
        row.issues = [...(row.issues || []), `brak kontekstu: ${err?.message || err}`];
      }
      return finalizeRow(row);
    });
    rows.push(...playerRows);
  }

  if (types.has('scouting')) {
    const reports = await prisma.scoutingAiReport.findMany();
    const scoped = reports
      .map((r) => {
        const parsed = parseScoutingReportKey(r.opponentKey);
        let seasonId = parsed.seasonId;
        let legacy = false;
        if (!seasonId) {
          legacy = true;
          const owner = seasons.find((s) => (s.startsAt || s.endsAt) && legacyReportMatchesSeason(r, s));
          seasonId = owner?.id || null;
        }
        return { r, seasonId, legacy };
      })
      .filter(({ seasonId }) => !seasonFilter || seasonId === seasonFilter);

    const scoutingRows = await mapLimit(scoped, 3, async ({ r, seasonId, legacy }) => {
      const text = [r.summaryMd || '', buildPersonnelMdFromAnalysis(r.analysisJson) || ''].join('\n\n');
      const endsCleanly = /[.!?)\]]\s*$/.test((r.summaryMd || '').trim());
      const complete = (r.summaryMd || '').length >= 400 && endsCleanly;
      /** @type {Partial<AiAuditRow>} */
      const row = {
        type: 'scouting',
        id: r.opponentKey,
        label: `${r.opponentName}${legacy ? ' (stary klucz bez sezonu)' : ''}`,
        seasonId,
        generatedAt: iso(r.generatedAt),
        model: r.model,
        complete,
        issues: [
          ...(complete ? [] : ['niekompletny raport']),
          ...(legacy ? ['klucz bez sezonu — wygeneruj ponownie, aby zapisać raport per sezon'] : [])
        ],
        generateKind: 'scouting',
        generateTarget: r.opponentName,
        viewPath: `/scouting?opponent=${encodeURIComponent(r.opponentName)}`
      };
      try {
        const ctx = await buildScoutingContext(r.opponentName, seasonId || activeSeason?.id);
        row.stale = !r.sourceHash || ctx.hash !== r.sourceHash;
        row.staleReason = !r.sourceHash ? 'no-hash' : row.stale ? 'hash-changed' : null;
        if (doFactCheck) {
          row.factCheck = factCheckText(text, ctx.payload, { skipSections: FACT_CHECK_SKIP_SECTIONS.scouting });
        }
      } catch (err) {
        row.stale = null;
        row.staleReason = 'context-unavailable';
        row.issues = [...(row.issues || []), `brak kontekstu: ${err?.message || err}`];
      }
      return finalizeRow(row);
    });
    rows.push(...scoutingRows);
  }

  if (types.has('briefing')) {
    const briefings = await prisma.teamBriefing.findMany();
    const ids = new Set(briefings.map((b) => b.id));
    const scopedBriefings = briefings
      .map((b) => ({ b, seasonId: b.id === 'default' ? LEGACY_BRIEFING_SEASON_ID : b.id }))
      .filter(({ b, seasonId }) => {
        if (!seasonFilter) return true;
        if (seasonId !== seasonFilter) return false;
        // `default` liczy się tylko, gdy nie ma briefingu z kluczem sezonu
        return b.id !== 'default' || !ids.has(seasonFilter);
      });
    for (const { b, seasonId } of scopedBriefings) {
      /** @type {Partial<AiAuditRow>} */
      const row = {
        type: 'briefing',
        id: b.id,
        label: b.id === 'default' ? `Briefing (default → ${seasonId})` : `Briefing ${seasonId}`,
        seasonId,
        generatedAt: iso(b.generatedAt),
        model: b.model,
        complete: hasCompleteBriefingMarkdown(b.contentMd),
        issues: [],
        generateKind: 'briefing',
        generateTarget: null,
        viewPath: '/dashboard'
      };
      try {
        const ctx = await buildBriefingContext(seasonId);
        row.complete = hasCompleteBriefingMarkdown(b.contentMd, {
          requireUpcomingOpponent: Boolean(ctx.payload.hasUpcomingMatch)
        });
        row.stale = !b.sourceHash || ctx.hash !== b.sourceHash;
        row.staleReason = !b.sourceHash ? 'no-hash' : row.stale ? 'hash-changed' : null;
        if (doFactCheck) row.factCheck = factCheckText(b.contentMd, ctx.payload);
      } catch (err) {
        row.stale = null;
        row.staleReason = 'context-unavailable';
        row.issues.push(`brak kontekstu: ${err?.message || err}`);
      }
      if (!row.complete) row.issues.push('niekompletny briefing');
      rows.push(finalizeRow(row));
    }
  }

  if (types.has('pregame')) {
    const cards = await prisma.preGameBriefing.findMany({
      where: seasonFilter ? { seasonId: seasonFilter } : {}
    });
    for (const c of cards) {
      const keys = Array.isArray(c.tacticalKeys) ? c.tacticalKeys : [];
      const five = Array.isArray(c.startingFive) ? c.startingFive : [];
      const text = [
        ...keys.map((k) => `${k?.title || ''}: ${k?.description || ''}`),
        ...five.map((p) => `${p?.name || ''} (#${p?.number ?? '?'}): ${p?.assignment || ''}`),
        c.benchKeys || ''
      ].join('\n');
      /** @type {Partial<AiAuditRow>} */
      const row = {
        type: 'pregame',
        id: c.id,
        label: `Odprawa — ${c.opponentName}`,
        seasonId: c.seasonId,
        generatedAt: iso(c.updatedAt || c.createdAt),
        model: c.model,
        complete: keys.length >= 3 && five.length === 5,
        // PreGameBriefing nie ma kolumny sourceHash — aktualności nie da się policzyć (patrz raport P6).
        stale: null,
        staleReason: 'no-hash-column',
        issues: [],
        generateKind: 'pregame',
        generateTarget: c.opponentName,
        viewPath: '/tactics'
      };
      if (!row.complete) row.issues.push(`niekompletna karta (${keys.length} założeń, ${five.length} w piątce)`);
      if (c.venue === 'Hala Sportowa, Bobolice') row.issues.push('stara hala „Hala Sportowa, Bobolice” zamiast KOSiR Koszalin');
      try {
        const [roster, scouting] = await Promise.all([
          getRoster(c.seasonId),
          getDetailedScouting(c.opponentName, c.seasonId, { includeAiPayload: true })
        ]);
        const rosterIds = new Set((roster || []).map((p) => String(p.id)));
        const outside = five.filter((p) => !rosterIds.has(String(p?.playerId)));
        if (outside.length) row.issues.push(`zawodnicy spoza kadry w piątce: ${outside.map((p) => p?.name).join(', ')}`);
        if (doFactCheck) {
          row.factCheck = factCheckText(text, {
            opponent: scouting?.aiPayload || null,
            roster: (roster || []).map((p) => ({ name: `${p.firstName} ${p.lastName}`, number: p.number }))
          });
        }
      } catch (err) {
        row.issues.push(`brak kontekstu: ${err?.message || err}`);
      }
      rows.push(finalizeRow(row));
    }
  }

  if (types.has('play')) {
    const plays = await prisma.play.findMany({ where: { isAiGenerated: true } });
    for (const p of plays) {
      const issues = validatePlayDiagram(p.diagramData);
      rows.push(
        finalizeRow({
          type: 'play',
          id: p.id,
          label: `Zagrywka AI — ${p.name}`,
          seasonId: null,
          generatedAt: iso(p.createdAt),
          model: null,
          complete: issues.length === 0,
          stale: null,
          staleReason: null,
          issues,
          generateKind: null,
          generateTarget: null,
          viewPath: '/tactics'
        })
      );
    }
  }

  return { generatedAt: new Date().toISOString(), seasonId: seasonFilter, rows };
}

/**
 * Kompaktowe podsumowanie do panelu („Do regeneracji”).
 * @param {Awaited<ReturnType<typeof runAiAudit>>} report
 */
export function summarizeAiAudit(report) {
  const rows = report.rows || [];
  /** @type {Record<string, { total: number, needsRegeneration: number }>} */
  const byType = {};
  for (const r of rows) {
    byType[r.type] = byType[r.type] || { total: 0, needsRegeneration: 0 };
    byType[r.type].total += 1;
    if (r.needsRegeneration) byType[r.type].needsRegeneration += 1;
  }
  const reasonsOf = (r) => {
    const reasons = [];
    if (!r.complete) reasons.push('niekompletna');
    if (r.stale === true) reasons.push('nieaktualna');
    if (r.isTemplate) reasons.push('szablon');
    if (r.factCheck?.suspicious) {
      const n = r.factCheck.suspiciousNumbers.length;
      const m = r.factCheck.suspiciousNames.length;
      reasons.push(`kontrola faktów: ${n} liczb, ${m} nazwisk`);
    }
    for (const issue of r.issues) if (!reasons.includes(issue)) reasons.push(issue);
    return reasons;
  };
  return {
    generatedAt: report.generatedAt,
    seasonId: report.seasonId,
    counts: {
      total: rows.length,
      needsRegeneration: rows.filter((r) => r.needsRegeneration).length,
      stale: rows.filter((r) => r.stale === true).length,
      incomplete: rows.filter((r) => !r.complete).length,
      templates: rows.filter((r) => r.isTemplate).length,
      suspicious: rows.filter((r) => r.factCheck?.suspicious).length,
      byType
    },
    toRegenerate: rows
      .filter((r) => r.needsRegeneration)
      .map((r) => ({
        type: r.type,
        id: r.id,
        label: r.label,
        seasonId: r.seasonId,
        generatedAt: r.generatedAt,
        model: r.model,
        reasons: reasonsOf(r),
        suspiciousNumbers: (r.factCheck?.suspiciousNumbers || []).slice(0, 5),
        suspiciousNames: (r.factCheck?.suspiciousNames || []).slice(0, 5),
        generateKind: r.generateKind,
        generateTarget: r.generateTarget,
        viewPath: r.viewPath
      }))
  };
}

/**
 * Czy audyt powinien zakończyć się kodem 1 (niekompletne lub podejrzane analizy).
 * @param {Awaited<ReturnType<typeof runAiAudit>>} report
 */
export function auditHasFailures(report) {
  return (report.rows || []).some((r) => !r.complete || r.factCheck?.suspicious);
}
