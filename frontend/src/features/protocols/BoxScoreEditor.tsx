import React, { memo, useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import useIsMobile from '../../hooks/useIsMobile';
import type { Player, Team, StatKey, ValidationResult } from './types';
import { formatPct, sumTeamTotals } from './utils';

// ── Types ──────────────────────────────────────────────────────────────

interface BoxScoreEditorProps {
  team: Team;
  teamIndex: number;
  mode: 'view' | 'edit';
  validation: ValidationResult;
  onUpdatePlayerStat: (teamIndex: number, playerIndex: number, key: StatKey, value: string) => void;
  onRecalcTeam: (teamIndex: number) => void;
  onAddPlayer: (teamIndex: number) => void;
  onRemovePlayer: (teamIndex: number, playerIndex: number) => void;
}

// ── Shared input class ─────────────────────────────────────────────────

const INPUT_BASE =
  'w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all';
const INPUT_ERROR =
  'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger bg-bkpk-danger/10';

// ── Mobile Player Card (collapsible) ───────────────────────────────────

interface MobilePlayerCardProps {
  player: Player;
  playerIndex: number;
  teamIndex: number;
  mode: 'view' | 'edit';
  onUpdate: (teamIndex: number, playerIndex: number, key: StatKey, value: string) => void;
  onRemove: (teamIndex: number, playerIndex: number) => void;
}

const STAT_FIELDS: { key: StatKey; label: string }[] = [
  { key: 'min', label: 'Min' },
  { key: 'two_pm', label: '2P C' },
  { key: 'two_pa', label: '2P W' },
  { key: 'three_pm', label: '3P C' },
  { key: 'three_pa', label: '3P W' },
  { key: 'ftm', label: 'FT C' },
  { key: 'fta', label: 'FT W' },
  { key: 'oreb', label: 'Zb A' },
  { key: 'dreb', label: 'Zb O' },
  { key: 'reb', label: 'Zb Su' },
  { key: 'ast', label: 'A' },
  { key: 'tov', label: 'S' },
  { key: 'stl', label: 'P' },
  { key: 'blk', label: 'B' },
  { key: 'pf', label: 'F' },
  { key: 'fouls_committed', label: 'FP' },
  { key: 'fouls_drawn', label: 'FW' },
  { key: 'plusMinus', label: '+/-' },
];

const MobilePlayerCard = memo(function MobilePlayerCard({
  player,
  playerIndex,
  teamIndex,
  mode,
  onUpdate,
  onRemove,
}: MobilePlayerCardProps) {
  const [expanded, setExpanded] = useState(false);

  const computedPts =
    Number(player.two_pm ?? 0) * 2 +
    Number(player.three_pm ?? 0) * 3 +
    Number(player.ftm ?? 0);

  const getPlayerValue = (key: StatKey): string | number => {
    if (key === 'min') return player.min || '';
    return player[key] ?? '';
  };

  return (
    <div className="bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 hover:bg-bkpk-surface-tint-2 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {player.number && (
            <span className="text-xs font-mono text-bkpk-text-muted bg-bkpk-bg px-2 py-0.5 rounded">
              #{player.number}
            </span>
          )}
          <span className="font-medium text-bkpk-text-primary text-sm">{player.name || 'Bez nazwy'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-bkpk-primary text-lg">{computedPts} pkt</span>
          {expanded ? <ChevronUp size={16} className="text-bkpk-text-muted" /> : <ChevronDown size={16} className="text-bkpk-text-muted" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-bkpk-border-subtle/50">
          <div className="grid grid-cols-3 gap-2 mt-3">
            {STAT_FIELDS.map(({ key, label }) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-[10px] text-bkpk-text-muted font-bold uppercase tracking-wider">{label}</span>
                <input
                  className={INPUT_BASE}
                  type="text"
                  inputMode="numeric"
                  value={getPlayerValue(key)}
                  onChange={(e) => onUpdate(teamIndex, playerIndex, key, e.target.value)}
                  disabled={mode === 'view'}
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-bkpk-text-muted">
              PKT: <strong className="text-bkpk-text-primary">{player.pts ?? computedPts}</strong>
              {' · '}2P: {formatPct(player.two_pm, player.two_pa)}%
              {' · '}3P: {formatPct(player.three_pm, player.three_pa)}%
              {' · '}FT: {formatPct(player.ftm, player.fta)}%
            </div>
            {mode === 'edit' && (
              <button
                className="text-bkpk-text-danger hover:text-red-400 font-bold text-xs uppercase p-1 rounded hover:bg-bkpk-danger/10 transition-colors"
                onClick={() => onRemove(teamIndex, playerIndex)}
                title="Usuń zawodnika"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Desktop Player Row (memoized) ──────────────────────────────────────

interface DesktopPlayerRowProps {
  player: Player;
  playerIndex: number;
  teamIndex: number;
  mode: 'view' | 'edit';
  onUpdate: (teamIndex: number, playerIndex: number, key: StatKey, value: string) => void;
  onRemove: (teamIndex: number, playerIndex: number) => void;
}

const DesktopPlayerRow = memo(function DesktopPlayerRow({
  player,
  playerIndex,
  teamIndex,
  mode,
  onUpdate,
  onRemove,
}: DesktopPlayerRowProps) {
  const computedPts =
    Number(player.two_pm ?? 0) * 2 +
    Number(player.three_pm ?? 0) * 3 +
    Number(player.ftm ?? 0);
  const ptsMismatch = player.pts !== undefined && Number(player.pts ?? 0) !== computedPts;
  const twoMismatch = Number(player.two_pm ?? 0) > Number(player.two_pa ?? 0);
  const threeMismatch = Number(player.three_pm ?? 0) > Number(player.three_pa ?? 0);
  const ftMismatch = Number(player.ftm ?? 0) > Number(player.fta ?? 0);
  const rebMismatch = Number(player.reb ?? 0) !== (Number(player.oreb ?? 0) + Number(player.dreb ?? 0));

  return (
    <tr className="border-b border-bkpk-border-subtle/30 hover:bg-bkpk-surface-tint-2 transition-colors group">
      <td className="p-2 border-r border-bkpk-border-subtle/30 text-center font-mono text-xs sticky left-0 bg-bkpk-surface-elevated group-hover:bg-bkpk-surface-tint-2">{player.number}</td>
      <td className="p-2 border-r border-bkpk-border-subtle/30 whitespace-nowrap font-medium text-bkpk-text-primary sticky left-12 bg-bkpk-surface-elevated group-hover:bg-bkpk-surface-tint-2 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]">
        {player.name}
      </td>
      {/* Min */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.min || ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'min', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* 2P Made */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
        <input className={`${INPUT_BASE} ${twoMismatch ? INPUT_ERROR : ''}`} type="text" inputMode="numeric" value={player.two_pm ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'two_pm', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* 2P Att */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
        <input className={`${INPUT_BASE} ${twoMismatch ? INPUT_ERROR : ''}`} type="text" inputMode="numeric" value={player.two_pa ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'two_pa', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* 2P % */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 text-xs text-center text-bkpk-text-muted bg-bkpk-surface-tint-2/30">
        {formatPct(player.two_pm, player.two_pa)}
      </td>
      {/* 3P Made */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={`${INPUT_BASE} ${threeMismatch ? INPUT_ERROR : ''}`} type="text" inputMode="numeric" value={player.three_pm ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'three_pm', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* 3P Att */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={`${INPUT_BASE} ${threeMismatch ? INPUT_ERROR : ''}`} type="text" inputMode="numeric" value={player.three_pa ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'three_pa', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* 3P % */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 text-xs text-center text-bkpk-text-muted">
        {formatPct(player.three_pm, player.three_pa)}
      </td>
      {/* FT Made */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
        <input className={`${INPUT_BASE} ${ftMismatch ? INPUT_ERROR : ''}`} type="text" inputMode="numeric" value={player.ftm ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'ftm', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* FT Att */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
        <input className={`${INPUT_BASE} ${ftMismatch ? INPUT_ERROR : ''}`} type="text" inputMode="numeric" value={player.fta ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'fta', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* FT % */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 text-xs text-center text-bkpk-text-muted bg-bkpk-surface-tint-2/30">
        {formatPct(player.ftm, player.fta)}
      </td>
      {/* OREB */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.oreb ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'oreb', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* DREB */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.dreb ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'dreb', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* REB */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={`${INPUT_BASE} ${rebMismatch ? INPUT_ERROR : ''}`} type="text" inputMode="numeric" value={player.reb ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'reb', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* AST */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.ast ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'ast', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* TOV */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.tov ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'tov', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* STL */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.stl ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'stl', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* BLK */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.blk ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'blk', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* PF */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.pf ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'pf', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* Fouls Committed */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.fouls_committed ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'fouls_committed', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* Fouls Drawn */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.fouls_drawn ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'fouls_drawn', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* +/- */}
      <td className="p-1 border-r border-bkpk-border-subtle/30">
        <input className={INPUT_BASE} type="text" inputMode="numeric" value={player.plusMinus ?? ''} onChange={(e) => onUpdate(teamIndex, playerIndex, 'plusMinus', e.target.value)} disabled={mode === 'view'} />
      </td>
      {/* PTS */}
      <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30 text-center">
        <span className={`font-bold ${ptsMismatch ? 'text-bkpk-text-danger' : 'text-bkpk-text-primary'}`}>
          {player.pts ?? 0}
        </span>
      </td>
      {/* Remove */}
      {mode === 'edit' && (
        <td className="p-1 text-center">
          <button
            className="text-bkpk-text-danger hover:text-red-400 font-bold text-xs uppercase p-1 rounded hover:bg-bkpk-danger/10 transition-colors"
            onClick={() => onRemove(teamIndex, playerIndex)}
            title="Usuń zawodnika"
          >
            ×
          </button>
        </td>
      )}
    </tr>
  );
});

// ── Main BoxScoreEditor ────────────────────────────────────────────────

export default function BoxScoreEditor({
  team,
  teamIndex,
  mode,
  validation,
  onUpdatePlayerStat,
  onRecalcTeam,
  onAddPlayer,
  onRemovePlayer,
}: BoxScoreEditorProps) {
  const isMobile = useIsMobile(1024); // 1024px breakpoint for wide table
  const totals = useMemo(() => sumTeamTotals(team), [team]);
  const totalsMismatch =
    (team.isBekapaka ? validation.homeTotalsMismatch : validation.awayTotalsMismatch) || false;

  // ── Mobile Layout ──────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-bkpk-border-strong pb-3">
          <h4 className="text-lg font-bold font-outfit text-bkpk-text-primary">{team.name}</h4>
          {mode === 'edit' && (
            <div className="flex flex-wrap gap-2">
              <button
                className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                onClick={() => onRecalcTeam(teamIndex)}
              >
                Przelicz PKT
              </button>
              <button
                className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                onClick={() => onAddPlayer(teamIndex)}
              >
                Dodaj zawodnika
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {team.players.map((player, playerIndex) => (
            <MobilePlayerCard
              key={player.id}
              player={player}
              playerIndex={playerIndex}
              teamIndex={teamIndex}
              mode={mode}
              onUpdate={onUpdatePlayerStat}
              onRemove={onRemovePlayer}
            />
          ))}
        </div>
        {/* Mobile totals summary */}
        <div className="bg-bkpk-surface-elevated border-2 border-bkpk-border-strong rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-bkpk-text-secondary text-sm">W sumie</span>
            <span className={`text-xl font-bold ${validation.scoreMismatch ? 'text-bkpk-text-danger' : 'text-bkpk-primary'}`}>
              {totals.pts} pkt
            </span>
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-bkpk-text-muted">
            <span>2P: {totals.two_pm}/{totals.two_pa} ({formatPct(totals.two_pm, totals.two_pa)}%)</span>
            <span>3P: {totals.three_pm}/{totals.three_pa} ({formatPct(totals.three_pm, totals.three_pa)}%)</span>
            <span>FT: {totals.ftm}/{totals.fta} ({formatPct(totals.ftm, totals.fta)}%)</span>
            <span>Zb: {totals.reb}</span>
            <span>A: {totals.ast}</span>
            <span>S: {totals.tov}</span>
            <span>P: {totals.stl}</span>
            <span>B: {totals.blk}</span>
            <span>F: {totals.pf}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop Layout ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-bkpk-border-strong pb-3">
        <h4 className="text-lg font-bold font-outfit text-bkpk-text-primary">{team.name}</h4>
        {mode === 'edit' && (
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
              onClick={() => onRecalcTeam(teamIndex)}
            >
              Przelicz PKT
            </button>
            <button
              className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
              onClick={() => onAddPlayer(teamIndex)}
            >
              Dodaj zawodnika
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto border border-bkpk-border-strong rounded-xl bg-bkpk-surface-tint-1">
        <table className="w-full text-sm border-collapse min-w-[1400px]">
          <thead>
            <tr className="border-b border-bkpk-border-subtle/50 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-12 text-center sticky left-0 bg-bkpk-surface-elevated z-20">Nr.</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 min-w-[200px] text-left sticky left-12 bg-bkpk-surface-elevated z-20 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]">Nazwisko i imię</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[70px]">Min</th>
              <th colSpan={3} className="p-2 border-r border-bkpk-border-subtle/30 text-center bg-bkpk-surface-tint-2">Za 2</th>
              <th colSpan={3} className="p-2 border-r border-bkpk-border-subtle/30 text-center">Za 3</th>
              <th colSpan={3} className="p-2 border-r border-bkpk-border-subtle/30 text-center bg-bkpk-surface-tint-2">Za 1</th>
              <th colSpan={3} className="p-2 border-r border-bkpk-border-subtle/30 text-center">Zb</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[50px] text-center bg-bkpk-surface-tint-2">A</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[50px] text-center">S</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[50px] text-center bg-bkpk-surface-tint-2">P</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[50px] text-center">B</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[50px] text-center bg-bkpk-surface-tint-2">F</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[50px] text-center">FP</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[50px] text-center bg-bkpk-surface-tint-2">FW</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[50px] text-center">+/-</th>
              <th rowSpan={2} className="p-2 border-r border-bkpk-border-subtle/30 w-[60px] text-center font-black bg-bkpk-surface-tint-2 text-bkpk-text-primary">PKT</th>
              {mode === 'edit' && <th rowSpan={2} className="p-2"></th>}
            </tr>
            <tr className="border-b border-bkpk-border-strong text-[10px] text-bkpk-text-muted font-bold uppercase tracking-wider">
              <th className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2 text-center w-[50px]">C</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2 text-center w-[50px]">W</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2 text-center w-[50px]">%</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 text-center w-[50px]">C</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 text-center w-[50px]">W</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 text-center w-[50px]">%</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2 text-center w-[50px]">C</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2 text-center w-[50px]">W</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2 text-center w-[50px]">%</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 text-center w-[50px]">A</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 text-center w-[50px]">O</th>
              <th className="p-1 border-r border-bkpk-border-subtle/30 text-center w-[50px]">Su</th>
            </tr>
          </thead>
          <tbody>
            {team.players.map((player, playerIndex) => (
              <DesktopPlayerRow
                key={player.id}
                player={player}
                playerIndex={playerIndex}
                teamIndex={teamIndex}
                mode={mode}
                onUpdate={onUpdatePlayerStat}
                onRemove={onRemovePlayer}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-bkpk-surface-elevated font-bold border-t-2 border-bkpk-border-strong">
              <td colSpan={3} className="p-3 text-right text-bkpk-text-secondary border-r border-bkpk-border-subtle/30 sticky left-0 z-30 bg-bkpk-surface-elevated shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]">W sumie</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.two_pm}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.two_pa}</td>
              <td className="p-2 text-center border-r border-bkpk-border-subtle/30 text-bkpk-text-muted text-xs font-normal">{formatPct(totals.two_pm, totals.two_pa)}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.three_pm}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.three_pa}</td>
              <td className="p-2 text-center border-r border-bkpk-border-subtle/30 text-bkpk-text-muted text-xs font-normal">{formatPct(totals.three_pm, totals.three_pa)}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.ftm}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.fta}</td>
              <td className="p-2 text-center border-r border-bkpk-border-subtle/30 text-bkpk-text-muted text-xs font-normal">{formatPct(totals.ftm, totals.fta)}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.oreb}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.dreb}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.reb}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.ast}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.tov}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.stl}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.blk}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.pf}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.fouls_committed}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.fouls_drawn}</td>
              <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-text-danger' : ''}`}>{totals.plusMinus}</td>
              <td className="p-2 text-center border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2">
                <strong className={`text-lg ${validation.scoreMismatch ? 'text-bkpk-text-danger' : 'text-bkpk-primary'}`}>
                  {totals.pts}
                </strong>
              </td>
              {mode === 'edit' && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
