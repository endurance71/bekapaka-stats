import type { Game, ValidationResult } from './types';
import { normalizeFiveMinute } from './utils';

interface QuarterScoreEditorProps {
  draft: Game;
  mode: 'view' | 'edit';
  validation: ValidationResult;
  onUpdateQuarter: (index: number, side: 'home' | 'away', value: string) => void;
  onUpdateFiveMinute: (index: number, side: 'home' | 'away', value: string) => void;
  onUpdateTeamStat: (teamIndex: number, field: string, value: string) => void;
  onUpdateRunField: (key: string, value: string) => void;
}

export default function QuarterScoreEditor({
  draft,
  mode,
  validation,
  onUpdateQuarter,
  onUpdateFiveMinute,
  onUpdateTeamStat,
  onUpdateRunField,
}: QuarterScoreEditorProps) {
  const homeName = draft.teams.find((t) => t.isBekapaka)?.name || 'BeKaPaKa';
  const awayName = draft.teams.find((t) => !t.isBekapaka)?.name || 'Rywal';

  return (
    <>
      {/* Quarter Scores Table */}
      <div className="overflow-x-auto border border-bkpk-border-strong rounded-xl bg-bkpk-surface-tint-1 p-4 mb-8">
        <table className="w-full text-sm border-collapse min-w-[500px]">
          <thead>
            <tr>
              <th className="p-3 text-left text-bkpk-text-muted text-xs font-bold uppercase tracking-wider border-b border-bkpk-border-subtle">Drużyna</th>
              {draft.quarters.map((q) => (
                <th key={q.label} className="p-3 text-center text-bkpk-text-muted text-xs font-bold uppercase tracking-wider border-b border-bkpk-border-subtle">{q.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-bkpk-border-subtle/50">
              <td className="p-3 font-semibold text-bkpk-text-primary">{homeName}</td>
              {draft.quarters.map((q, idx) => (
                <td key={`home-${q.label}`} className="p-2 text-center">
                  <input
                    className={`w-16 h-9 bg-bkpk-bg border border-bkpk-border-strong rounded-lg text-center text-sm focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.quarterMismatchIndices?.[idx] ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                    type="text"
                    inputMode="numeric"
                    value={q.home}
                    onChange={(e) => onUpdateQuarter(idx, 'home', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3 font-semibold text-bkpk-text-primary">{awayName}</td>
              {draft.quarters.map((q, idx) => (
                <td key={`away-${q.label}`} className="p-2 text-center">
                  <input
                    className={`w-16 h-9 bg-bkpk-bg border border-bkpk-border-strong rounded-lg text-center text-sm focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.quarterMismatchIndices?.[idx] ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                    type="text"
                    inputMode="numeric"
                    value={q.away}
                    onChange={(e) => onUpdateQuarter(idx, 'away', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </td>
              ))}
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="p-3 font-bold text-bkpk-text-primary pt-4">Suma</td>
              {draft.quarters.map((q) => (
                <td key={`sum-${q.label}`} className="p-3 text-center font-bold text-bkpk-text-secondary pt-4">
                  {(Number(q.home) || 0) + (Number(q.away) || 0)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Team Stats Table */}
      <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary mt-12 mb-6">Statystyki zespołowe</h3>
      <div className="overflow-x-auto border border-bkpk-border-strong rounded-xl bg-bkpk-surface-tint-1 mb-8">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-bkpk-border-subtle/50 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
              <th className="p-3 text-left">Drużyna</th>
              <th className="p-3 text-center">P-w-p</th>
              <th className="p-3 text-center">Strata</th>
              <th className="p-3 text-center">2 szansa</th>
              <th className="p-3 text-center">Szybki atak</th>
              <th className="p-3 text-center">Ławka</th>
            </tr>
          </thead>
          <tbody>
            {draft.teams.map((team, tIdx) => (
              <tr key={team.id} className="border-b border-bkpk-border-subtle/30 last:border-0 hover:bg-bkpk-surface-tint-2 transition-colors">
                <td className="p-3 font-semibold text-bkpk-text-primary">{team.name}</td>
                <td className="p-2 text-center">
                  <input
                    className="w-14 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                    type="text"
                    inputMode="numeric"
                    value={team.points_in_paint || ''}
                    onChange={(e) => onUpdateTeamStat(tIdx, 'points_in_paint', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    className="w-14 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                    type="text"
                    inputMode="numeric"
                    value={team.points_from_turnover || ''}
                    onChange={(e) => onUpdateTeamStat(tIdx, 'points_from_turnover', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    className="w-14 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                    type="text"
                    inputMode="numeric"
                    value={team.points_second_chance || ''}
                    onChange={(e) => onUpdateTeamStat(tIdx, 'points_second_chance', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    className="w-14 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                    type="text"
                    inputMode="numeric"
                    value={team.points_fast_break || ''}
                    onChange={(e) => onUpdateTeamStat(tIdx, 'points_fast_break', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </td>
                <td className="p-2 text-center font-medium text-bkpk-text-secondary italic">
                  {/* Bench points are computed automatically */}
                  {(team.players || [])
                    .filter((p, i) => i >= 5)
                    .reduce((sum, p) => {
                      const pts = (Number(p.two_pm || 0) * 2) + (Number(p.three_pm || 0) * 3) + Number(p.ftm || 0);
                      return sum + pts;
                    }, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Five Minute Intervals */}
      <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary mb-6">Punkty w 5-minutowych przedziałach</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* First Half */}
        <div className="bg-bkpk-surface-tint-1 border border-bkpk-border-strong rounded-xl p-4">
          <h4 className="text-sm font-bold text-bkpk-text-muted uppercase tracking-wider mb-4 border-b border-bkpk-border-subtle pb-2">I Połowa</h4>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                <th className="p-2 text-left">Minuta</th>
                <th className="p-2 text-center">{homeName}</th>
                <th className="p-2 text-center">{awayName}</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((rowIdx) => (
                <tr key={rowIdx} className="border-b border-bkpk-border-subtle/30 last:border-0">
                  <td className="p-2 font-medium text-bkpk-text-secondary">
                    {rowIdx * 5 + 1}–{rowIdx * 5 + 5}
                  </td>
                  <td className="p-2 text-center">
                    <input
                      className={`w-12 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.fiveMinMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                      value={draft.fiveMinute?.[rowIdx]?.home ?? ''}
                      onChange={(e) => onUpdateFiveMinute(rowIdx, 'home', e.target.value)}
                      disabled={mode === 'view'}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      className={`w-12 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.fiveMinMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                      value={draft.fiveMinute?.[rowIdx]?.away ?? ''}
                      onChange={(e) => onUpdateFiveMinute(rowIdx, 'away', e.target.value)}
                      disabled={mode === 'view'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Second Half */}
        <div className="bg-bkpk-surface-tint-1 border border-bkpk-border-strong rounded-xl p-4">
          <h4 className="text-sm font-bold text-bkpk-text-muted uppercase tracking-wider mb-4 border-b border-bkpk-border-subtle pb-2">II Połowa</h4>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                <th className="p-2 text-left">Minuta</th>
                <th className="p-2 text-center">{homeName}</th>
                <th className="p-2 text-center">{awayName}</th>
              </tr>
            </thead>
            <tbody>
              {[4, 5, 6, 7].map((rowIdx) => (
                <tr key={rowIdx} className="border-b border-bkpk-border-subtle/30 last:border-0">
                  <td className="p-2 font-medium text-bkpk-text-secondary">
                    {rowIdx * 5 + 1}–{rowIdx * 5 + 5}
                  </td>
                  <td className="p-2 text-center">
                    <input
                      className={`w-12 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.fiveMinMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                      value={draft.fiveMinute?.[rowIdx]?.home ?? ''}
                      onChange={(e) => onUpdateFiveMinute(rowIdx, 'home', e.target.value)}
                      disabled={mode === 'view'}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      className={`w-12 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.fiveMinMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                      value={draft.fiveMinute?.[rowIdx]?.away ?? ''}
                      onChange={(e) => onUpdateFiveMinute(rowIdx, 'away', e.target.value)}
                      disabled={mode === 'view'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Runs & Lead */}
      <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary mb-6">Runy i przewaga</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {draft.teams.map((team, tIdx) => (
          <div key={team.id} className="bg-bkpk-surface-tint-1 border border-bkpk-border-strong rounded-xl p-4 flex flex-col gap-4">
            <h4 className="text-lg font-bold text-bkpk-text-primary border-b border-bkpk-border-subtle pb-2">{team.name}</h4>
            <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
              Największy run (pkt)
              <input
                className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors"
                value={team.biggest_run || ''}
                onChange={(e) => onUpdateTeamStat(tIdx, 'biggest_run', e.target.value)}
                disabled={mode === 'view'}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
              Największa przewaga (pkt)
              <input
                className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors"
                value={team.biggest_lead || ''}
                onChange={(e) => onUpdateTeamStat(tIdx, 'biggest_lead', e.target.value)}
                disabled={mode === 'view'}
              />
            </label>
          </div>
        ))}
      </div>
    </>
  );
}
