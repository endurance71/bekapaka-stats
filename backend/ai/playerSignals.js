/**
 * Rule-based signals fed into player development prompts (no LLM).
 * @param {{ averages: object, gameLog: object[], teamAverages?: object }} input
 * @returns {Array<{ code: string, severity: string, message: string }>}
 */
export function computePlayerSignals({ averages, gameLog, teamAverages = {} }) {
  const signals = [];
  if (!averages || !gameLog?.length) return signals;

  const last3 = gameLog.slice(0, 3);
  const prev3 = gameLog.slice(3, 6);

  const avgTov = last3.reduce((s, g) => s + (g.tov || 0), 0) / last3.length;
  const teamTov = teamAverages.turnoversPerGame;
  if (teamTov && avgTov > teamTov * 1.2) {
    signals.push({
      code: 'high_turnovers',
      severity: 'high',
      message: `Średnio ${avgTov.toFixed(1)} strat w ostatnich meczach (drużyna ~${teamTov.toFixed(1)})`
    });
  }

  const ftPct = averages.ftm && averages.fta
    ? (averages.ftm / averages.fta) * 100
    : null;
  if (ftPct !== null && averages.fta > 0.5 && ftPct < 60) {
    signals.push({
      code: 'weak_ft',
      severity: 'medium',
      message: `Słabe rzuty wolne w sezonie (szac. ${ftPct.toFixed(0)}%)`
    });
  }

  if (last3.length >= 2 && prev3.length >= 2) {
    const efgRecent = avgEfg(last3);
    const efgPrev = avgEfg(prev3);
    if (efgPrev > 0 && efgRecent < efgPrev - 0.08) {
      signals.push({
        code: 'efg_decline',
        severity: 'medium',
        message: `Spadek skuteczności rzutów (eFG) w ostatnich ${last3.length} meczach`
      });
    }
  }

  if ((averages.plusMinusAvg || 0) < -3) {
    signals.push({
      code: 'negative_pm',
      severity: 'medium',
      message: `Ujemny średni plus/minus (${averages.plusMinusAvg.toFixed(1)})`
    });
  }

  if (averages.ppg >= (teamAverages.ppg || 0) * 1.15 && averages.gamesPlayed >= 3) {
    signals.push({
      code: 'scoring_leader',
      severity: 'info',
      message: 'Jeden z głównych strzelców drużyny'
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
