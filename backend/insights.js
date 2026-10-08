/**
 * Engine for automated basketball insights.
 */

/**
 * Liczba z danych lub null (nigdy 0 udające wartość, gdy pola brak).
 * @param {unknown} value
 * @returns {number | null}
 */
function dataNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Punkty ławki z box score — tylko gdy box ma oznaczenie pierwszej piątki (starter === true).
 * @param {object | undefined} team
 * @returns {number | null}
 */
function benchPointsFromBox(team) {
    const players = Array.isArray(team?.players) ? team.players : [];
    const starters = players.filter((p) => p?.starter === true);
    if (players.length === 0 || starters.length !== 5) return null;
    return players
        .filter((p) => p?.starter !== true)
        .reduce((sum, p) => sum + (Number(p?.pts) || 0), 0);
}

/**
 * Reguły wniosków meczowych (bez LLM).
 * Punkty po szybkim ataku / ławki / drugiej szansy / po stratach — WYŁĄCZNIE z typowanych danych
 * (`extras.pointsSources`, `extras.benchPts` z KalkTeamGameStat). Gdy pola brak, reguła jest pomijana.
 * @param {object} game
 * @param {object} bekapakaStats — four factors BeKaPaKa (efg, tovPct jako ułamki)
 * @param {object} opponentStats
 * @param {{ pointsSources?: { fastBreakPts?: number | null, secondChancePts?: number | null, ptsOffTurnovers?: number | null } | null, benchPts?: number | null }} [extras]
 */
export function generateGameInsights(game, bekapakaStats, opponentStats, extras = {}) {
    const insights = [];

    if (!bekapakaStats || !opponentStats) return insights;

    // 1. Efficiency / Four Factors
    if (bekapakaStats.tovPct > 0.20) {
        insights.push({
            type: 'warning',
            category: 'efficiency',
            text: `Wysoki wskaźnik strat (TO% = ${(bekapakaStats.tovPct * 100).toFixed(1)}%) był kluczowym problemem w tym meczu.`,
            impact: 'high'
        });
    }

    if (bekapakaStats.efg < 0.45) {
        insights.push({
            type: 'warning',
            category: 'shooting',
            text: `Niska efektywność rzutów (eFG% = ${(bekapakaStats.efg * 100).toFixed(1)}%) utrudniła budowanie przewagi.`,
            impact: 'medium'
        });
    }

    const sources = extras?.pointsSources || null;

    // 2. Fast Break / Transition — tylko gdy KALK podał punkty z kontry
    const fbPoints = dataNumber(sources?.fastBreakPts);
    if (fbPoints !== null && fbPoints > 15) {
        insights.push({
            type: 'success',
            category: 'transition',
            text: `Świetna gra w szybkim ataku (${fbPoints} pkt) pozwoliła narzucić tempo meczu.`,
            impact: 'medium'
        });
    }

    // 3. Bench Contribution — KalkTeamGameStat.benchPts lub box score z oznaczoną piątką
    const benchPoints = dataNumber(extras?.benchPts) ?? benchPointsFromBox(extras?.team);
    if (benchPoints !== null && benchPoints > 20) {
        insights.push({
            type: 'success',
            category: 'depth',
            text: `Silne wsparcie z ławki (${benchPoints} pkt) było istotnym atutem zespołu.`,
            impact: 'medium'
        });
    }

    // 3b. Druga szansa / punkty po stratach rywala
    const secondChance = dataNumber(sources?.secondChancePts);
    if (secondChance !== null && secondChance >= 12) {
        insights.push({
            type: 'success',
            category: 'rebounding',
            text: `Zbiórka ofensywna przełożyła się na ${secondChance} pkt drugiej szansy.`,
            impact: 'medium'
        });
    }

    const offTurnovers = dataNumber(sources?.ptsOffTurnovers);
    if (offTurnovers !== null && offTurnovers >= 15) {
        insights.push({
            type: 'success',
            category: 'defense',
            text: `Presja w obronie dała ${offTurnovers} pkt po stratach rywala.`,
            impact: 'medium'
        });
    }

    // 4. Quarter analysis
    if (game.quarters && game.quarters.length >= 3) {
        const q1 = game.quarters[0].home || 0;
        const q3 = game.quarters[2].home || 0;
        if (q3 < q1 * 0.7 && q3 < 15) {
            insights.push({
                type: 'info',
                category: 'momentum',
                text: `Zauważalny spadek skuteczności w 3. kwarcie (${q3} pkt) w porównaniu do otwarcia meczu.`,
                impact: 'medium'
            });
        }
    }

    return insights;
}

export function generateTrendInsights(trends) {
    const insights = [];
    if (!trends || trends.length < 3) return insights;

    const last3 = trends.slice(-3);
    const avgEfg = last3.reduce((sum, g) => sum + (g.efg || 0), 0) / 3;

    if (avgEfg > 0.55) {
        insights.push({
            type: 'success',
            text: 'Zespół utrzymuje wysoką formę rzutową w ostatnich 3 meczach.',
            category: 'trend'
        });
    }

    return insights;
}
