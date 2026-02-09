/**
 * Engine for automated basketball insights.
 */

export function generateGameInsights(game, bekapakaStats, opponentStats) {
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

    // 2. Fast Break / Transition
    const fbPoints = game.teamStats?.['Punkty po szybkim ataku']?.home || 0;
    if (fbPoints > 15) {
        insights.push({
            type: 'success',
            category: 'transition',
            text: `Świetna gra w szybkim ataku (${fbPoints} pkt) pozwoliła narzucić tempo meczu.`,
            impact: 'medium'
        });
    }

    // 3. Bench Contribution
    const benchPoints = game.teamStats?.['Punkty zmienników']?.home || 0;
    if (benchPoints > 20) {
        insights.push({
            type: 'success',
            category: 'depth',
            text: `Silne wsparcie z ławki (${benchPoints} pkt) było istotnym atutem zespołu.`,
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
