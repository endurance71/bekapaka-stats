import { useCallback, useMemo, useState } from 'react';
import Legend from '../../components/Legend';
import type { Game, StatKey, ValidationResult } from './types';
import { computeValidation, normalizeFiveMinute, sumTeamTotals } from './utils';
import ValidationPanel from './ValidationPanel';
import BoxScoreEditor from './BoxScoreEditor';
import QuarterScoreEditor from './QuarterScoreEditor';
import { Settings, ChevronDown, ChevronUp, ArrowLeft, Save, Copy } from 'lucide-react';

interface ProtocolEditorProps {
  draft: Game;
  mode: 'view' | 'edit';
  saveState: 'idle' | 'saving' | 'saved';
  onSetDraft: (draft: Game | null) => void;
  onUpdateDraftField: (field: keyof Game, value: string) => void;
  onUpdateQuarter: (index: number, side: 'home' | 'away', value: string) => void;
  onUpdatePlayerStat: (teamIndex: number, playerIndex: number, key: StatKey, value: string) => void;
  onUpdateFiveMinute: (index: number, side: 'home' | 'away', value: string) => void;
  onUpdateTeamStat: (teamIndex: number, field: string, value: string) => void;
  onUpdateRunField: (key: string, value: string) => void;
  onRecalcTeam: (teamIndex: number) => void;
  onAddPlayer: (teamIndex: number) => void;
  onRemovePlayer: (teamIndex: number, playerIndex: number) => void;
  onRecalcFiveMinuteFromQuarters: () => void;
  onSave: () => void;
  onCopyJson: () => void;
}

export default function ProtocolEditor({
  draft,
  mode,
  saveState,
  onSetDraft,
  onUpdateDraftField,
  onUpdateQuarter,
  onUpdatePlayerStat,
  onUpdateFiveMinute,
  onUpdateTeamStat,
  onUpdateRunField,
  onRecalcTeam,
  onAddPlayer,
  onRemovePlayer,
  onRecalcFiveMinuteFromQuarters,
  onSave,
  onCopyJson,
}: ProtocolEditorProps) {
  const [showTools, setShowTools] = useState(false);
  // Memoize validation so it doesn't re-compute on every render
  const validation = useMemo<ValidationResult>(() => computeValidation(draft), [draft]);

  // ── Toolbar actions ──────────────────────────────────────────────

  const handleMatchScoreToQuarters = useCallback(() => {
    const homeSum = draft.quarters.reduce((s, q) => s + (Number(q.home) || 0), 0);
    const awaySum = draft.quarters.reduce((s, q) => s + (Number(q.away) || 0), 0);
    onSetDraft({ ...draft, finalScore: `${homeSum} - ${awaySum}` });
  }, [draft, onSetDraft]);

  const handleMatchScoreToBoxscore = useCallback(() => {
    const homeTeam = draft.teams.find((t) => t.isBekapaka) || draft.teams[0];
    const awayTeam = draft.teams.find((t) => !t.isBekapaka) || draft.teams[1];
    const homeTotals = homeTeam ? sumTeamTotals(homeTeam) : { pts: 0 };
    const awayTotals = awayTeam ? sumTeamTotals(awayTeam) : { pts: 0 };
    onSetDraft({ ...draft, finalScore: `${homeTotals.pts} - ${awayTotals.pts}` });
  }, [draft, onSetDraft]);

  const handleAlignQuartersToFiveMin = useCallback(() => {
    const rows = normalizeFiveMinute(draft.fiveMinute);
    const homeQuarters = [
      (rows[0]?.home || 0) + (rows[1]?.home || 0),
      (rows[2]?.home || 0) + (rows[3]?.home || 0),
      (rows[4]?.home || 0) + (rows[5]?.home || 0),
      (rows[6]?.home || 0) + (rows[7]?.home || 0),
    ];
    const awayQuarters = [
      (rows[0]?.away || 0) + (rows[1]?.away || 0),
      (rows[2]?.away || 0) + (rows[3]?.away || 0),
      (rows[4]?.away || 0) + (rows[5]?.away || 0),
      (rows[6]?.away || 0) + (rows[7]?.away || 0),
    ];
    const next = {
      ...draft,
      quarters: draft.quarters.map((q, idx) => ({
        ...q,
        home: homeQuarters[idx] ?? q.home,
        away: awayQuarters[idx] ?? q.away,
      })),
    };
    onSetDraft(next);
  }, [draft, onSetDraft]);

  return (
    <div className="bg-bkpk-surface-elevated border border-bkpk-border-strong rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-bkpk-border-strong">
        <div className="flex items-center gap-3">
          <button
            className="p-2 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors cursor-pointer"
            onClick={() => onSetDraft(null)}
            aria-label="Wróć do listy"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-outfit text-bkpk-text-primary">
              {mode === 'edit' ? 'Edycja protokołu' : 'Podgląd protokołu'}
            </h3>
            {mode === 'edit' && (
              <span className="text-[10px] font-black text-bkpk-primary uppercase tracking-widest leading-none block mt-0.5">
                {saveState === 'saving' ? 'Autozapis...' : saveState === 'saved' ? 'Zapisano' : 'Wersja robocza'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-end relative">
          {mode === 'edit' && (
            <>
              {/* Desktop tool buttons */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  className="px-2.5 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors cursor-pointer"
                  onClick={handleMatchScoreToQuarters}
                >
                  Dopasuj do kwart
                </button>
                <button
                  className="px-2.5 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors cursor-pointer"
                  onClick={handleMatchScoreToBoxscore}
                >
                  Dopasuj do boxscore
                </button>
                <button
                  className="px-2.5 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors cursor-pointer"
                  onClick={handleAlignQuartersToFiveMin}
                >
                  Kwarty ➔ 5‑min
                </button>
                <button
                  className="px-2.5 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors cursor-pointer"
                  onClick={onRecalcFiveMinuteFromQuarters}
                >
                  5‑min ➔ Kwarty
                </button>
              </div>

              {/* Mobile/Tablet dropdown for secondary tools */}
              <div className="relative lg:hidden">
                <button
                  onClick={() => setShowTools(!showTools)}
                  className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Narzędzia</span>
                  {showTools ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showTools && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#1b1e26] border border-bkpk-border-strong rounded-xl shadow-2xl z-30 p-1.5 space-y-1">
                    <button
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-bkpk-text-secondary hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => { handleMatchScoreToQuarters(); setShowTools(false); }}
                    >
                      Dopasuj wynik do kwart
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-bkpk-text-secondary hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => { handleMatchScoreToBoxscore(); setShowTools(false); }}
                    >
                      Dopasuj wynik do boxscore
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-bkpk-text-secondary hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => { handleAlignQuartersToFiveMin(); setShowTools(false); }}
                    >
                      Wyrównaj kwarty do 5-min
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-bkpk-text-secondary hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => { onRecalcFiveMinuteFromQuarters(); setShowTools(false); }}
                    >
                      Wyrównaj 5-min do kwart
                    </button>
                  </div>
                )}
              </div>

              <button
                className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors flex items-center gap-1 cursor-pointer"
                onClick={onCopyJson}
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </button>

              <button
                className="px-3 py-1.5 bg-bkpk-primary text-white text-xs font-bold rounded-lg hover:bg-bkpk-primary-hover transition-colors shadow-bkpk-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                onClick={onSave}
                disabled={validation.issues.length > 0}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Zapisz</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Validation panel */}
      <ValidationPanel validation={validation} />

      {/* Editor content */}
      <div className="flex flex-col gap-8">
        {/* Meta fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
            Liga
            <input
              className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50"
              value={draft.league}
              onChange={(e) => onUpdateDraftField('league', e.target.value)}
              disabled={mode === 'view'}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
            Data
            <input
              className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50"
              value={draft.date}
              onChange={(e) => onUpdateDraftField('date', e.target.value)}
              disabled={mode === 'view'}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
            Godzina
            <input
              className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50"
              value={draft.time || ''}
              onChange={(e) => onUpdateDraftField('time', e.target.value)}
              disabled={mode === 'view'}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
            Hala
            <input
              className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50"
              value={draft.venue || ''}
              onChange={(e) => onUpdateDraftField('venue', e.target.value)}
              disabled={mode === 'view'}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
            Wynik końcowy
            <input
              className={`w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50 ${validation.scoreMismatch ? 'border-bkpk-danger focus:border-bkpk-danger' : ''}`}
              value={draft.finalScore}
              onChange={(e) => onUpdateDraftField('finalScore', e.target.value)}
              disabled={mode === 'view'}
            />
          </label>
        </div>

        {/* Quarter scores, 5-min, team stats, runs */}
        <QuarterScoreEditor
          draft={draft}
          mode={mode}
          validation={validation}
          onUpdateQuarter={onUpdateQuarter}
          onUpdateFiveMinute={onUpdateFiveMinute}
          onUpdateTeamStat={onUpdateTeamStat}
          onUpdateRunField={onUpdateRunField}
        />

        {/* Box scores per team */}
        {draft.teams.map((team, teamIndex) => (
          <BoxScoreEditor
            key={team.id}
            team={team}
            teamIndex={teamIndex}
            mode={mode}
            validation={validation}
            onUpdatePlayerStat={onUpdatePlayerStat}
            onRecalcTeam={onRecalcTeam}
            onAddPlayer={onAddPlayer}
            onRemovePlayer={onRemovePlayer}
          />
        ))}

        {/* Legend */}
        <Legend
          title="Legenda skrótów (Protokół)"
          items={[
            { term: 'C/W', desc: 'Celne/Wykonane (trafione/próby).' },
            { term: 'Za 2/Za 3/Za 1', desc: 'Rzuty za 2, za 3 i wolne.' },
            { term: 'Zb A/O/Su', desc: 'Zbiórki w ataku / obronie / suma.' },
            { term: 'A/S/P/B', desc: 'Asysty / straty / przechwyty / bloki.' },
            { term: 'F/FP/FW', desc: 'Faule / faule popełnione / faule wymuszone.' },
            { term: '+/-', desc: 'Bilans punktowy przy zawodniku.' },
          ]}
        />
      </div>
    </div>
  );
}
