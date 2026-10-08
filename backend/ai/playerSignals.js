/**
 * @param {unknown} v
 * @returns {v is number}
 */
function positive(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

/**
 * Rule-based signals fed into player development prompts (no LLM).
 * teamAverages.ppg — średnie PPG zawodnika BeKaPaKa (zawodnicy z ≥3 meczami),
 * teamAverages.turnoversPerGame — średnie straty zawodnika na mecz (nie suma drużyny!).
 * Gdy wartości referencyjnej brak — sygnał porównawczy nie jest emitowany.
 * @param {{ averages: object, gameLog: object[], teamAverages?: { ppg?: number | null, turnoversPerGame?: number | null } }} input
 * @returns {Array<{ code: string, severity: string, message: string }>}
 */
export const MIN_SIGNAL_GAMES = 3;

export function computePlayerSignals({ averages, gameLog, teamAverages = {} }) {
  const signals = [];
  // Z 1–2 meczów nie wyciągamy wniosków (sygnały trafiają do planu rozwoju AI)
  if (!averages || !gameLog?.length || gameLog.length < MIN_SIGNAL_GAMES) return signals;

  const last3 = gameLog.slice(0, 3);
  const prev3 = gameLog.slice(3, 6);

  const avgTov = last3.reduce((s, g) => s + (g.tov || 0), 0) / last3.length;
  const teamTov = teamAverages?.turnoversPerGame;
  if (positive(teamTov) && avgTov > teamTov * 1.2 && avgTov >= 2) {
    signals.push({
      code: 'high_turnovers',
      severity: 'high',
      message: `Średnio ${avgTov.toFixed(1)} strat w ostatnich ${last3.length} meczach (średnia zawodnika drużyny ~${teamTov.toFixed(1)})`
    });
  }

  const ftPct = averages.ftm && averages.fta
    ? (averages.ftm / averages.fta) * 100
    : null;
  if (ftPct !== null && averages.fta > 0.5 && ftPct < 60) {
    signals.push({
      code: 'weak_ft',
      severity: 'medium',
      message: `Słabe rzuty wolne w sezonie (${ftPct.toFixed(0)}%)`
    });
  }

  if (last3.length >= 2 && prev3.length >= 2) {
    const efgRecent = avgEfg(last3);
    const efgPrev = avgEfg(prev3);
    if (efgPrev > 0 && efgRecent < efgPrev - 0.08) {
      signals.push({
        code: 'efg_decline',
        severity: 'medium',
        message: `Spadek eFG z ${(efgPrev * 100).toFixed(1)}% do ${(efgRecent * 100).toFixed(1)}% (ostatnie ${last3.length} vs poprzednie ${prev3.length} mecze)`
      });
    }
  }

  if (typeof averages.plusMinusAvg === 'number' && averages.plusMinusAvg < -3) {
    signals.push({
      code: 'negative_pm',
      severity: 'medium',
      message: `Ujemny średni plus/minus (${averages.plusMinusAvg.toFixed(1)})`
    });
  }

  const teamPpg = teamAverages?.ppg;
  if (positive(teamPpg) && positive(averages.ppg) && averages.ppg >= teamPpg * 1.15 && averages.gamesPlayed >= 3) {
    signals.push({
      code: 'scoring_leader',
      severity: 'info',
      message: `Jeden z głównych strzelców drużyny (${averages.ppg.toFixed(1)} PPG vs średnia zawodnika ${teamPpg.toFixed(1)})`
    });
  }

  return signals;
}

function avgEfg(games) {
  let fgm = 0;
  let fga = 0;
  let tpm = 0;
  for (const g of games) {
    fgm += g.fgm || 0;
    fga += g.fga || 0;
    tpm += g.three_pm || 0;
  }
  return fga > 0 ? (fgm + 0.5 * tpm) / fga : 0;
}
