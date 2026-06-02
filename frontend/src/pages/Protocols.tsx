import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteJSON, fetchJSON, postJSON, putJSON } from '../lib/api';
import { ProtocolsList, ProtocolEditor, ImportModal, createEmptyGame, normalizeFiveMinute } from '../features/protocols';
import type { Game, StatKey } from '../features/protocols';

export default function Protocols() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Game | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showAdd, setShowAdd] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importPreview, setImportPreview] = useState<Game | null>(null);
  const [importMeta, setImportMeta] = useState<{ date: string; opponent: string }>({ date: '', opponent: '' });
  const [importError, setImportError] = useState('');
  const [fileName, setFileName] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autosaveTimer = useRef<number | null>(null);

  useEffect(() => {
    fetchJSON<Game[]>('/api/games').then(setGames);
  }, []);

  const selected = useMemo(
    () => games.find((g) => g.id === selectedId) || null,
    [games, selectedId]
  );

  // ── List handlers ──────────────────────────────────────────────────

  const startEdit = useCallback((game: Game) => {
    setSelectedId(game.id);
    setDraft(structuredClone(game));
    setMode('edit');
  }, []);

  const startView = useCallback((game: Game) => {
    setSelectedId(game.id);
    setDraft(structuredClone(game));
    setMode('view');
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteJSON(`/games/${id}`);
    setGames((prev) => prev.filter((g) => g.id !== id));
    setSelectedId((prevId) => (prevId === id ? null : prevId));
    setDraft((prevDraft) => (prevDraft && prevDraft.id === id ? null : prevDraft));
  }, []);

  const handleAddEmpty = useCallback(() => {
    const empty = createEmptyGame();
    setDraft(empty);
    setMode('edit');
  }, []);

  // ── Import handlers ────────────────────────────────────────────────

  const handleImportParse = useCallback(async (overrideContent?: string) => {
    try {
      setImportError('');
      const content = overrideContent ?? importContent;
      const res = await postJSON<{ preview: Game }>(`/import`, { format: 'markdown', content });
      setImportPreview(res.preview);
      if (res.preview?.warning) {
        setImportError(res.preview.warning);
      } else {
        setImportError('');
      }
    } catch (err: any) {
      setImportPreview(null);
      setImportError(err.message || 'Nie udało się sparsować protokołu.');
    }
  }, [importContent]);

  const handleImportSave = useCallback(async () => {
    if (!importPreview) return;
    const opponent = importMeta.opponent || importPreview.teams.find((t) => !t.isBekapaka)?.name || 'Rywal';
    const date = importMeta.date || importPreview.date || 'unknown-date';
    const id = importPreview.id || `game-${date}-${opponent}`.replace(/\s+/g, '-').toLowerCase();
    const safePreview = structuredClone(importPreview);
    const game: Game = { ...safePreview, id, date, opponent, homeAway: 'home' } as Game;
    const saved = await postJSON<Game>('/games', game);
    setGames((prev) => [saved, ...prev]);
    setShowAdd(false);
    setImportContent('');
    setImportPreview(null);
    setFileName('');
  }, [importPreview, importMeta]);

  const handleFileUpload = useCallback(async (file: File) => {
    const text = await file.text();
    setImportContent(text);
    setFileName(file.name);
    setImportPreview(null);
    setImportError('');
    await handleImportParse(text);
  }, [handleImportParse]);

  // ── Draft update handlers (immutable — no JSON.parse deep clone) ──

  const updateDraftField = useCallback((field: keyof Game, value: string) => {
    setDraft((prev) => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const updateQuarter = useCallback((index: number, side: 'home' | 'away', value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, quarters: prev.quarters.map((q, i) => i === index ? { ...q, [side]: Number(value) } : q) };
      const homeSum = next.quarters.reduce((s, q) => s + (Number(q.home) || 0), 0);
      const awaySum = next.quarters.reduce((s, q) => s + (Number(q.away) || 0), 0);
      if (next.finalScore) {
        next.finalScore = `${homeSum} - ${awaySum}`;
      }
      return next;
    });
  }, []);

  const updatePlayerStat = useCallback((teamIndex: number, playerIndex: number, key: StatKey, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const teams = prev.teams.map((team, tIdx) => {
        if (tIdx !== teamIndex) return team;
        const players = team.players.map((player, pIdx) => {
          if (pIdx !== playerIndex) return player;
          const updated = { ...player };
          if (key === 'min') {
            updated.min = value;
          } else {
            (updated as any)[key] = value === '' ? undefined : Number(value);
          }
          // Auto-recalc
          const twoPm = Number(updated.two_pm ?? 0);
          const threePm = Number(updated.three_pm ?? 0);
          const ftm = Number(updated.ftm ?? 0);
          const twoPa = Number(updated.two_pa ?? 0);
          const threePa = Number(updated.three_pa ?? 0);
          const oreb = Number(updated.oreb ?? 0);
          const dreb = Number(updated.dreb ?? 0);
          updated.pts = twoPm * 2 + threePm * 3 + ftm;
          updated.fgm = twoPm + threePm;
          updated.fga = twoPa + threePa;
          updated.reb = oreb + dreb;
          return updated;
        });
        return { ...team, players };
      });
      return { ...prev, teams };
    });
  }, []);

  const updateFiveMinute = useCallback((index: number, side: 'home' | 'away', value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const rows = normalizeFiveMinute(prev.fiveMinute).map((r, i) =>
        i === index ? { ...r, [side]: Number(value) } : { ...r }
      );
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
      const quarters = prev.quarters.map((q, idx) => ({
        ...q,
        home: homeQuarters[idx] ?? q.home,
        away: awayQuarters[idx] ?? q.away,
      }));
      const homeSum = homeQuarters.reduce((s, v) => s + v, 0);
      const awaySum = awayQuarters.reduce((s, v) => s + v, 0);
      const finalScore = prev.finalScore !== '' ? `${homeSum} - ${awaySum}` : prev.finalScore;
      return { ...prev, fiveMinute: rows as any, quarters, finalScore };
    });
  }, []);

  const recalcFiveMinuteFromQuarters = useCallback(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      const rows = normalizeFiveMinute(prev.fiveMinute).map((r) => ({ ...r }));
      prev.quarters.forEach((q, idx) => {
        const baseIdx = idx * 2;
        const halfHome = Math.floor((Number(q.home) || 0) / 2);
        const halfAway = Math.floor((Number(q.away) || 0) / 2);
        rows[baseIdx].home = halfHome;
        rows[baseIdx + 1].home = (Number(q.home) || 0) - halfHome;
        rows[baseIdx].away = halfAway;
        rows[baseIdx + 1].away = (Number(q.away) || 0) - halfAway;
      });
      return { ...prev, fiveMinute: rows as any };
    });
  }, []);

  const updateTeamStat = useCallback((teamIndex: number, field: string, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const teams = prev.teams.map((team, tIdx) => {
        if (tIdx !== teamIndex) return team;
        return { ...team, [field]: Number(value) };
      });
      return { ...prev, teams };
    });
  }, []);

  const updateRunField = useCallback((key: string, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, runs: { ...(prev.runs || {}), [key]: value } };
    });
  }, []);

  const recalcTeam = useCallback((teamIndex: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const teams = prev.teams.map((team, tIdx) => {
        if (tIdx !== teamIndex) return team;
        const players = team.players.map((p) => {
          const two = Number(p.two_pm ?? 0);
          const three = Number(p.three_pm ?? 0);
          const ft = Number(p.ftm ?? 0);
          const oreb = Number(p.oreb ?? 0);
          const dreb = Number(p.dreb ?? 0);
          return { ...p, pts: two * 2 + three * 3 + ft, fgm: two + three, fga: Number(p.two_pa ?? 0) + Number(p.three_pa ?? 0), reb: oreb + dreb };
        });
        return { ...team, players };
      });
      return { ...prev, teams };
    });
  }, []);

  const addPlayer = useCallback((teamIndex: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const teams = prev.teams.map((team, tIdx) => {
        if (tIdx !== teamIndex) return team;
        return { ...team, players: [...team.players, { id: `p-${Date.now()}`, name: 'Nowy Zawodnik' }] };
      });
      return { ...prev, teams };
    });
  }, []);

  const removePlayer = useCallback((teamIndex: number, playerIndex: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const teams = prev.teams.map((team, tIdx) => {
        if (tIdx !== teamIndex) return team;
        return { ...team, players: team.players.filter((_, pIdx) => pIdx !== playerIndex) };
      });
      return { ...prev, teams };
    });
  }, []);

  // ── Save & autosave ────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setSaveState('saving');
    const updated = await putJSON<Game>(`/games/${draft.id}`, draft);
    setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setDraft(updated);
    setSaveState('saved');
  }, [draft]);

  useEffect(() => {
    if (!draft || mode !== 'edit') return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(async () => {
      try {
        setSaveState('saving');
        const updated = await putJSON<Game>(`/games/${draft.id}`, draft);
        setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        setDraft(updated);
        setSaveState('saved');
      } catch {
        setSaveState('idle');
      }
    }, 1200);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [draft, mode]);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 max-w-[1800px] mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black font-outfit text-bkpk-text-primary tracking-tight">Protokoły</h1>
        <p className="text-bkpk-text-muted text-lg">Zarządzanie protokołami meczowymi, edycja wyników i statystyk.</p>
      </div>

      {!draft && (
        <ProtocolsList
          games={games}
          onView={startView}
          onEdit={startEdit}
          onDelete={handleDelete}
          onAddEmpty={handleAddEmpty}
          onShowImport={() => setShowAdd(true)}
        />
      )}

      {draft && (
        <ProtocolEditor
          draft={draft}
          mode={mode}
          saveState={saveState}
          onSetDraft={setDraft}
          onUpdateDraftField={updateDraftField}
          onUpdateQuarter={updateQuarter}
          onUpdatePlayerStat={updatePlayerStat}
          onUpdateFiveMinute={updateFiveMinute}
          onUpdateTeamStat={updateTeamStat}
          onUpdateRunField={updateRunField}
          onRecalcTeam={recalcTeam}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onRecalcFiveMinuteFromQuarters={recalcFiveMinuteFromQuarters}
          onSave={handleSave}
        />
      )}

      {showAdd && (
        <ImportModal
          onClose={() => setShowAdd(false)}
          onImportParse={handleImportParse}
          onImportSave={handleImportSave}
          importContent={importContent}
          setImportContent={setImportContent}
          importPreview={importPreview}
          importError={importError}
          importMeta={importMeta}
          setImportMeta={setImportMeta}
          fileName={fileName}
          onFileUpload={handleFileUpload}
        />
      )}
    </div>
  );
}
