import {
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { deleteJSON, fetchJSON, postJSON, putJSON } from '../lib/api';
import Legend from '../components/Legend';
// styles removed

type Player = {
  id: string;
  // ... (keeping types to reduce context if possible, but replace_file_content needs context. I'll just match the import line)

  name: string;
  min?: string;
  number?: string;
  two_pm?: number;
  two_pa?: number;
  three_pm?: number;
  three_pa?: number;
  ftm?: number;
  fta?: number;
  oreb?: number;
  dreb?: number;
  reb?: number;
  ast?: number;
  tov?: number;
  stl?: number;
  blk?: number;
  pf?: number;
  fouls_committed?: number;
  fouls_drawn?: number;
  plusMinus?: number;
  pts?: number;
};

type Team = {
  id: string;
  name: string;
  isBekapaka?: boolean;
  isHome?: boolean;
  players: Player[];
  points_in_paint?: number;
  points_from_turnover?: number;
  points_second_chance?: number;
  points_fast_break?: number;
  biggest_run?: number;
  biggest_lead?: number;
};

type Game = {
  id: string;
  league: string;
  date: string;
  time?: string;
  venue?: string;
  finalScore: string;
  opponent?: string;
  homeAway?: string;
  quarters: { label: string; home: number; away: number }[];
  teams: Team[];
  fiveMinute?: { label?: string; home?: number; away?: number; team?: string; points?: number[] }[];
  teamStats?: Record<string, { home?: number; away?: number }>;
  runs?: Record<string, any>;
};

type StatKey =
  | 'min'
  | 'two_pm'
  | 'two_pa'
  | 'three_pm'
  | 'three_pa'
  | 'ftm'
  | 'fta'
  | 'oreb'
  | 'dreb'
  | 'reb'
  | 'ast'
  | 'tov'
  | 'stl'
  | 'blk'
  | 'pf'
  | 'fouls_committed'
  | 'fouls_drawn'
  | 'plusMinus'
  | 'pts';

export default function Protocols() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Game | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showAdd, setShowAdd] = useState(false);
  const [importFormat, setImportFormat] = useState<'markdown' | 'json'>('markdown');
  const [importContent, setImportContent] = useState('');
  const [importPreview, setImportPreview] = useState<Game | null>(null);
  const [importMeta, setImportMeta] = useState<{ date: string; opponent: string }>({
    date: '',
    opponent: ''
  });
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

  const startEdit = (game: Game) => {
    setSelectedId(game.id);
    setDraft(JSON.parse(JSON.stringify(game)));
    setMode('edit');
  };

  const startView = (game: Game) => {
    setSelectedId(game.id);
    setDraft(JSON.parse(JSON.stringify(game)));
    setMode('view');
  };

  const handleDelete = async (id: string) => {
    await deleteJSON(`/games/${id}`);
    setGames((prev) => prev.filter((g) => g.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setDraft(null);
    }
  };

  const handleImportParse = async (
    overrideContent?: string,
    overrideFormat?: 'markdown' | 'json'
  ) => {
    try {
      setImportError('');
      const content = overrideContent ?? importContent;
      const format = overrideFormat ?? importFormat;
      const res = await postJSON<{ preview: Game }>(`/import`, {
        format,
        content
      });
      if (format === 'json') {
        setImportPreview(null);
        const refreshed = await fetchJSON<Game[]>('/games');
        setGames(refreshed);
        return;
      }
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
  };

  const handleImportSave = async () => {
    if (!importPreview) return;
    const opponent =
      importMeta.opponent ||
      importPreview.teams.find((t) => !t.isBekapaka)?.name ||
      'Rywal';
    const date = importMeta.date || importPreview.date || 'unknown-date';
    const id = importPreview.id || `game-${date}-${opponent}`.replace(/\\s+/g, '-').toLowerCase();
    const safePreview = JSON.parse(JSON.stringify(importPreview)) as Game;
    const game: Game = {
      ...safePreview,
      id,
      date,
      opponent,
      homeAway: 'home'
    } as Game;
    const saved = await postJSON<Game>('/games', game);
    setGames((prev) => [saved, ...prev]);
    setShowAdd(false);
    setImportContent('');
    setImportPreview(null);
    setFileName('');
  };

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    setImportContent(text);
    setImportFormat('markdown');
    setFileName(file.name);
    setImportPreview(null);
    setImportError('');
    await handleImportParse(text, 'markdown');
  };

  const updateDraftField = (field: keyof Game, value: string) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const updateQuarter = (index: number, side: 'home' | 'away', value: string) => {
    if (!draft) return;
    const next = [...draft.quarters];
    next[index] = { ...next[index], [side]: Number(value) };
    const updated = { ...draft, quarters: next };
    const homeSum = updated.quarters.reduce((s, q) => s + (Number(q.home) || 0), 0);
    const awaySum = updated.quarters.reduce((s, q) => s + (Number(q.away) || 0), 0);
    if (updated.finalScore) {
      updated.finalScore = `${homeSum} - ${awaySum}`;
    }
    setDraft(updated);
  };

  const updatePlayerStat = (
    teamIndex: number,
    playerIndex: number,
    key: StatKey,
    value: string
  ) => {
    if (!draft) return;
    const next = JSON.parse(JSON.stringify(draft)) as Game;
    const player = next.teams[teamIndex].players[playerIndex];
    if (key === 'min') {
      player.min = value;
    } else {
      player[key] = value === '' ? undefined : Number(value);
    }

    // Auto-recalc PKT and FG totals
    const twoPm = Number(player.two_pm ?? 0);
    const threePm = Number(player.three_pm ?? 0);
    const ftm = Number(player.ftm ?? 0);
    const twoPa = Number(player.two_pa ?? 0);
    const threePa = Number(player.three_pa ?? 0);
    const oreb = Number(player.oreb ?? 0);
    const dreb = Number(player.dreb ?? 0);
    player.pts = twoPm * 2 + threePm * 3 + ftm;
    player.fgm = twoPm + threePm;
    player.fga = twoPa + threePa;
    player.reb = oreb + dreb;

    setDraft(next);
  };

  const formatCW = (made?: number, att?: number) =>
    `${made ?? 0}/${att ?? 0}`;

  const formatPct = (made?: number, att?: number) => {
    const a = att ?? 0;
    if (!a) return '0,0';
    const pct = (Number(made ?? 0) / a) * 100;
    return pct.toFixed(1).replace('.', ',');
  };

  const sumTeamTotals = (team: Team) => {
    const totals = team.players.reduce(
      (acc, p) => {
        acc.pts += Number(p.pts ?? 0);
        const fgm = Number(p.fgm ?? (Number(p.two_pm ?? 0) + Number(p.three_pm ?? 0)));
        const fga = Number(p.fga ?? (Number(p.two_pa ?? 0) + Number(p.three_pa ?? 0)));
        acc.fgm += fgm;
        acc.fga += fga;
        acc.two_pm += Number(p.two_pm ?? 0);
        acc.two_pa += Number(p.two_pa ?? 0);
        acc.three_pm += Number(p.three_pm ?? 0);
        acc.three_pa += Number(p.three_pa ?? 0);
        acc.ftm += Number(p.ftm ?? 0);
        acc.fta += Number(p.fta ?? 0);
        const oreb = Number(p.oreb ?? 0);
        const dreb = Number(p.dreb ?? 0);
        acc.oreb += oreb;
        acc.dreb += dreb;
        acc.reb += Number(p.reb ?? (oreb + dreb));
        acc.ast += Number(p.ast ?? 0);
        acc.tov += Number(p.tov ?? 0);
        acc.stl += Number(p.stl ?? 0);
        acc.blk += Number(p.blk ?? 0);
        acc.pf += Number(p.pf ?? 0);
        acc.fouls_committed += Number(p.fouls_committed ?? 0);
        acc.fouls_drawn += Number(p.fouls_drawn ?? 0);
        acc.plusMinus += Number(p.plusMinus ?? 0);
        return acc;
      },
      {
        pts: 0,
        fgm: 0,
        fga: 0,
        two_pm: 0,
        two_pa: 0,
        three_pm: 0,
        three_pa: 0,
        ftm: 0,
        fta: 0,
        oreb: 0,
        dreb: 0,
        reb: 0,
        ast: 0,
        tov: 0,
        stl: 0,
        blk: 0,
        pf: 0,
        fouls_committed: 0,
        fouls_drawn: 0,
        plusMinus: 0
      }
    );
    return totals;
  };

  const parseFinalScore = (score?: string) => {
    if (!score) return null;
    const match = score.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (!match) return null;
    return { a: Number(match[1]), b: Number(match[2]) };
  };

  const recalcTeam = (teamIndex: number) => {
    if (!draft) return;
    const next = JSON.parse(JSON.stringify(draft)) as Game;
    const team = next.teams[teamIndex];
    team.players = team.players.map((p) => {
      const two = Number(p.two_pm ?? 0);
      const three = Number(p.three_pm ?? 0);
      const ft = Number(p.ftm ?? 0);
      const oreb = Number(p.oreb ?? 0);
      const dreb = Number(p.dreb ?? 0);
      const pts = two * 2 + three * 3 + ft;
      const fgm = two + three;
      const fga = Number(p.two_pa ?? 0) + Number(p.three_pa ?? 0);
      return { ...p, pts, fgm, fga, reb: oreb + dreb };
    });
    setDraft(next);
  };

  const computeValidation = (game: Game) => {
    const homeTeam = game.teams.find((t) => t.isBekapaka) || game.teams[0];
    const awayTeam = game.teams.find((t) => !t.isBekapaka) || game.teams[1];
    const homeTotals = homeTeam ? sumTeamTotals(homeTeam) : null;
    const awayTotals = awayTeam ? sumTeamTotals(awayTeam) : null;
    const quartersHome = game.quarters.reduce((s, q) => s + (Number(q.home) || 0), 0);
    const quartersAway = game.quarters.reduce((s, q) => s + (Number(q.away) || 0), 0);
    const score = parseFinalScore(game.finalScore);
    const issues: string[] = [];
    const scoreMismatch =
      !!(score && homeTotals && awayTotals && (homeTotals.pts !== score.a || awayTotals.pts !== score.b));
    const quartersMismatch = !!(score && (quartersHome !== score.a || quartersAway !== score.b));
    const fiveMinRows = normalizeFiveMinute(game.fiveMinute);
    const fiveMinHome = fiveMinRows.reduce((s, r) => s + (Number(r.home) || 0), 0);
    const fiveMinAway = fiveMinRows.reduce((s, r) => s + (Number(r.away) || 0), 0);
    const fiveMinQuarters = [
      (Number(fiveMinRows[0]?.home) || 0) + (Number(fiveMinRows[1]?.home) || 0),
      (Number(fiveMinRows[2]?.home) || 0) + (Number(fiveMinRows[3]?.home) || 0),
      (Number(fiveMinRows[4]?.home) || 0) + (Number(fiveMinRows[5]?.home) || 0),
      (Number(fiveMinRows[6]?.home) || 0) + (Number(fiveMinRows[7]?.home) || 0)
    ];
    const fiveMinQuartersAway = [
      (Number(fiveMinRows[0]?.away) || 0) + (Number(fiveMinRows[1]?.away) || 0),
      (Number(fiveMinRows[2]?.away) || 0) + (Number(fiveMinRows[3]?.away) || 0),
      (Number(fiveMinRows[4]?.away) || 0) + (Number(fiveMinRows[5]?.away) || 0),
      (Number(fiveMinRows[6]?.away) || 0) + (Number(fiveMinRows[7]?.away) || 0)
    ];
    const anyFiveMin = fiveMinRows.some((r) => Number(r.home) || Number(r.away));
    const quarterMismatchIndices = game.quarters.map((q, idx) => {
      if (!anyFiveMin) return false;
      const homeOk = Number(q.home) === fiveMinQuarters[idx];
      const awayOk = Number(q.away) === fiveMinQuartersAway[idx];
      return !(homeOk && awayOk);
    });
    const fiveMinMismatch = !!(score && (fiveMinHome !== score.a || fiveMinAway !== score.b));
    const boxscoreVsQuartersMismatch =
      !!(homeTotals && awayTotals && (homeTotals.pts !== quartersHome || awayTotals.pts !== quartersAway));

    const homeTotalsMismatch =
      !!(homeTotals && (homeTotals.fgm !== homeTotals.two_pm + homeTotals.three_pm ||
        homeTotals.fga !== homeTotals.two_pa + homeTotals.three_pa ||
        homeTotals.two_pm > homeTotals.two_pa ||
        homeTotals.three_pm > homeTotals.three_pa ||
        homeTotals.ftm > homeTotals.fta));
    const awayTotalsMismatch =
      !!(awayTotals && (awayTotals.fgm !== awayTotals.two_pm + awayTotals.three_pm ||
        awayTotals.fga !== awayTotals.two_pa + awayTotals.three_pa ||
        awayTotals.two_pm > awayTotals.two_pa ||
        awayTotals.three_pm > awayTotals.three_pa ||
        awayTotals.ftm > awayTotals.fta));

    if (homeTotals && awayTotals && score && scoreMismatch) {
      issues.push(
        `Suma punktów z boxscore (${homeTotals.pts}-${awayTotals.pts}) nie zgadza się z wynikiem (${score.a}-${score.b}).`
      );
    }
    if (score && quartersMismatch) {
      issues.push(
        `Suma kwart (${quartersHome}-${quartersAway}) nie zgadza się z wynikiem (${score.a}-${score.b}).`
      );
    }
    if (score && fiveMinMismatch) {
      issues.push(
        `Suma 5-min (${fiveMinHome}-${fiveMinAway}) nie zgadza się z wynikiem (${score.a}-${score.b}).`
      );
    }
    if (homeTotals && awayTotals && boxscoreVsQuartersMismatch) {
      issues.push(
        `Suma boxscore (${homeTotals.pts}-${awayTotals.pts}) nie zgadza się z sumą kwart (${quartersHome}-${quartersAway}).`
      );
    }
    if (homeTotalsMismatch || awayTotalsMismatch) {
      issues.push('Niespójne sumy C/W w wierszu „W sumie”.');
    }
    return {
      issues,
      scoreMismatch,
      quartersMismatch,
      fiveMinMismatch,
      boxscoreVsQuartersMismatch,
      quarterMismatchIndices,
      homeTotalsMismatch,
      awayTotalsMismatch
    };
  };

  const createEmptyGame = (): Game => ({
    id: `draft-${Date.now()}`,
    league: 'atom WEBSKA BASKET LIGA - II D - RZ',
    date: '',
    time: '',
    venue: 'Koszalin',
    finalScore: '',
    opponent: '',
    homeAway: 'home',
    quarters: [
      { label: '1', home: 0, away: 0 },
      { label: '2', home: 0, away: 0 },
      { label: '3', home: 0, away: 0 },
      { label: '4', home: 0, away: 0 }
    ],
    teams: [
      {
        id: 'BB',
        name: 'BEKAPAKA BOBOLICE',
        isBekapaka: true,
        isHome: true,
        players: Array.from({ length: 12 }).map((_, idx) => ({
          id: `bb-${idx + 1}`,
          number: '',
          name: '',
          min: ''
        }))
      },
      {
        id: 'OP',
        name: 'RYWAL',
        isBekapaka: false,
        isHome: false,
        players: Array.from({ length: 12 }).map((_, idx) => ({
          id: `op-${idx + 1}`,
          number: '',
          name: '',
          min: ''
        }))
      }
    ],
    fiveMinute: Array.from({ length: 8 }).map((_, i) => ({
      label: `${i * 5}-${i * 5 + 5}`,
      home: 0,
      away: 0
    })),
    teamStats: {
      'Punkty po stratach': { home: 0, away: 0 },
      'Punkty spod kosza': { home: 0, away: 0 },
      'Punkty drugiej szansy': { home: 0, away: 0 },
      'Punkty po szybkim ataku': { home: 0, away: 0 },
      'Punkty zmienników': { home: 0, away: 0 }
    },
    runs: {
      maxLead: '',
      maxRun: '',
      leadChanges: '',
      ties: '',
      timeLeading: ''
    }
  });

  const normalizeFiveMinute = (input?: Game['fiveMinute']) => {
    if (!input || input.length === 0) {
      return Array.from({ length: 8 }).map((_, i) => ({
        label: `${i * 5}-${i * 5 + 5}`,
        home: 0,
        away: 0
      }));
    }
    if (input[0]?.label) return input as any;
    const byTeam = new Map<string, number[]>();
    input.forEach((row: any) => {
      if (row.team && Array.isArray(row.points)) byTeam.set(row.team, row.points);
    });
    const teams = [...byTeam.keys()];
    if (teams.length >= 2) {
      const a = byTeam.get(teams[0]) || [];
      const b = byTeam.get(teams[1]) || [];
      return a.map((home, idx) => ({
        label: `${idx * 5}-${idx * 5 + 5}`,
        home,
        away: b[idx] ?? 0
      }));
    }
    return Array.from({ length: 8 }).map((_, i) => ({
      label: `${i * 5}-${i * 5 + 5}`,
      home: 0,
      away: 0
    }));
  };

  const updateFiveMinute = (index: number, side: 'home' | 'away', value: string) => {
    if (!draft) return;
    const next = JSON.parse(JSON.stringify(draft)) as Game;
    const rows = normalizeFiveMinute(next.fiveMinute);
    rows[index] = { ...rows[index], [side]: Number(value) };
    next.fiveMinute = rows as any;
    // Recompute quarters from 5-min blocks (2 blocks per quarter)
    const homeQuarters = [
      (rows[0]?.home || 0) + (rows[1]?.home || 0),
      (rows[2]?.home || 0) + (rows[3]?.home || 0),
      (rows[4]?.home || 0) + (rows[5]?.home || 0),
      (rows[6]?.home || 0) + (rows[7]?.home || 0)
    ];
    const awayQuarters = [
      (rows[0]?.away || 0) + (rows[1]?.away || 0),
      (rows[2]?.away || 0) + (rows[3]?.away || 0),
      (rows[4]?.away || 0) + (rows[5]?.away || 0),
      (rows[6]?.away || 0) + (rows[7]?.away || 0)
    ];
    next.quarters = next.quarters.map((q, idx) => ({
      ...q,
      home: homeQuarters[idx] ?? q.home,
      away: awayQuarters[idx] ?? q.away
    }));
    const homeSum = homeQuarters.reduce((s, v) => s + v, 0);
    const awaySum = awayQuarters.reduce((s, v) => s + v, 0);
    if (next.finalScore !== '') {
      next.finalScore = `${homeSum} - ${awaySum}`;
    }
    setDraft(next);
  };

  const recalcFiveMinuteFromQuarters = () => {
    if (!draft) return;
    const next = JSON.parse(JSON.stringify(draft)) as Game;
    const rows = normalizeFiveMinute(next.fiveMinute);
    next.quarters.forEach((q, idx) => {
      const baseIdx = idx * 2;
      const halfHome = Math.floor((Number(q.home) || 0) / 2);
      const halfAway = Math.floor((Number(q.away) || 0) / 2);
      rows[baseIdx].home = halfHome;
      rows[baseIdx + 1].home = (Number(q.home) || 0) - halfHome;
      rows[baseIdx].away = halfAway;
      rows[baseIdx + 1].away = (Number(q.away) || 0) - halfAway;
    });
    next.fiveMinute = rows as any;
    setDraft(next);
  };

  const defaultTeamStats = [
    'Punkty po stratach',
    'Punkty spod kosza',
    'Punkty drugiej szansy',
    'Punkty po szybkim ataku',
    'Punkty zmienników'
  ];

  const updateTeamStat = (label: string, side: 'home' | 'away', value: string) => {
    if (!draft) return;
    const next = JSON.parse(JSON.stringify(draft)) as Game;
    if (!next.teamStats) next.teamStats = {};
    if (!next.teamStats[label]) next.teamStats[label] = {};
    next.teamStats[label][side] = Number(value);
    setDraft(next);
  };

  const updateRunField = (key: string, value: string) => {
    if (!draft) return;
    const next = JSON.parse(JSON.stringify(draft)) as Game;
    next.runs = { ...(next.runs || {}), [key]: value };
    setDraft(next);
  };

  const addPlayer = (teamIndex: number) => {
    if (!draft) return;
    const next = JSON.parse(JSON.stringify(draft)) as Game;
    next.teams[teamIndex].players.push({
      id: `p-${Date.now()}`,
      name: 'Nowy Zawodnik'
    });
    setDraft(next);
  };

  const removePlayer = (teamIndex: number, playerIndex: number) => {
    if (!draft) return;
    const next = JSON.parse(JSON.stringify(draft)) as Game;
    next.teams[teamIndex].players.splice(playerIndex, 1);
    setDraft(next);
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaveState('saving');
    const updated = await putJSON<Game>(`/games/${draft.id}`, draft);
    setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setDraft(updated);
    setSaveState('saved');
  };

  const copyAsJson = async () => {
    if (!draft) return;
    const text = JSON.stringify(draft, null, 2);
    await navigator.clipboard.writeText(text);
  };

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

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 max-w-[1800px] mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black font-outfit text-bkpk-text-primary tracking-tight">Protokoły</h1>
        <p className="text-bkpk-text-muted text-lg">Zarządzanie protokołami meczowymi, edycja wyników i statystyk.</p>
      </div>

      {!draft && (
        <div className="bg-bkpk-surface-elevated border border-bkpk-border-strong rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary">Lista protokołów</h3>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-sm font-bold rounded-xl hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                onClick={() => {
                  const empty = createEmptyGame();
                  setDraft(empty);
                  setMode('edit');
                }}
              >
                Dodaj pusty protokół
              </button>
              <button
                className="px-4 py-2 bg-bkpk-primary text-white text-sm font-bold rounded-xl hover:bg-bkpk-primary-hover transition-colors shadow-bkpk-primary"
                onClick={() => setShowAdd(true)}
              >
                Dodaj protokół
              </button>
            </div>
          </div>
          <div className="grid gap-3">
            {games.map((game) => (
              <div key={game.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl p-4 hover:border-bkpk-primary/30 transition-colors">
                <div>
                  <div className="font-bold text-bkpk-text-primary text-lg">
                    {game.teams.find((t) => !t.isBekapaka)?.name || 'Rywal'}
                  </div>
                  <div className="text-bkpk-text-muted text-xs font-medium uppercase tracking-wider mt-1">
                    {game.date} · <span className="text-bkpk-text-secondary">{game.finalScore}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                    onClick={() => startView(game)}
                  >
                    Podgląd
                  </button>
                  <button
                    className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                    onClick={() => startEdit(game)}
                  >
                    Edytuj
                  </button>
                  <button
                    className="bg-bkpk-danger/10 text-bkpk-danger border border-bkpk-danger/20 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-bkpk-danger/20 transition-colors"
                    onClick={() => handleDelete(game.id)}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
            {games.length === 0 && (
              <div className="p-8 text-center text-bkpk-text-muted italic border-2 border-dashed border-bkpk-border-subtle rounded-xl">
                Brak protokołów. Dodaj pierwszy protokół powyżej.
              </div>
            )}
          </div>
        </div>
      )}

      {draft && (
        <div className="bg-bkpk-surface-elevated border border-bkpk-border-strong rounded-2xl p-6 shadow-sm">
          {(() => {
            const validation = computeValidation(draft);
            return (
              <>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                  <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary">
                    {mode === 'edit' ? 'Edycja protokołu (format wzoru)' : 'Podgląd protokołu'}
                  </h3>
                  <div className="flex flex-wrap gap-2.5 items-center justify-end">
                    <button
                      className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                      onClick={() => setDraft(null)}
                    >
                      Wróć do listy
                    </button>
                    {mode === 'edit' && (
                      <span className="text-xs font-bold text-bkpk-text-muted uppercase tracking-wider mx-2">
                        {saveState === 'saving' ? 'Zapisywanie...' : saveState === 'saved' ? 'Zapisano' : ''}
                      </span>
                    )}
                    {mode === 'edit' && (
                      <>
                        <button
                          className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                          onClick={() => {
                            if (!draft) return;
                            const homeSum = draft.quarters.reduce((s, q) => s + (Number(q.home) || 0), 0);
                            const awaySum = draft.quarters.reduce((s, q) => s + (Number(q.away) || 0), 0);
                            setDraft({ ...draft, finalScore: `${homeSum} - ${awaySum}` });
                          }}
                        >
                          Dopasuj wynik do kwart
                        </button>
                        <button
                          className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                          onClick={() => {
                            if (!draft) return;
                            const homeTeam = draft.teams.find((t) => t.isBekapaka) || draft.teams[0];
                            const awayTeam = draft.teams.find((t) => !t.isBekapaka) || draft.teams[1];
                            const homeTotals = homeTeam ? sumTeamTotals(homeTeam) : { pts: 0 };
                            const awayTotals = awayTeam ? sumTeamTotals(awayTeam) : { pts: 0 };
                            setDraft({ ...draft, finalScore: `${homeTotals.pts} - ${awayTotals.pts}` });
                          }}
                        >
                          Dopasuj wynik do boxscore
                        </button>
                        <button
                          className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                          onClick={() => {
                            if (!draft) return;
                            const rows = normalizeFiveMinute(draft.fiveMinute);
                            const homeQuarters = [
                              (rows[0]?.home || 0) + (rows[1]?.home || 0),
                              (rows[2]?.home || 0) + (rows[3]?.home || 0),
                              (rows[4]?.home || 0) + (rows[5]?.home || 0),
                              (rows[6]?.home || 0) + (rows[7]?.home || 0)
                            ];
                            const awayQuarters = [
                              (rows[0]?.away || 0) + (rows[1]?.away || 0),
                              (rows[2]?.away || 0) + (rows[3]?.away || 0),
                              (rows[4]?.away || 0) + (rows[5]?.away || 0),
                              (rows[6]?.away || 0) + (rows[7]?.away || 0)
                            ];
                            const next = {
                              ...draft,
                              quarters: draft.quarters.map((q, idx) => ({
                                ...q,
                                home: homeQuarters[idx] ?? q.home,
                                away: awayQuarters[idx] ?? q.away
                              }))
                            };
                            setDraft(next);
                          }}
                        >
                          Wyrównaj kwarty do 5‑min
                        </button>
                        <button
                          className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                          onClick={recalcFiveMinuteFromQuarters}
                        >
                          Wyrównaj 5‑min do kwart
                        </button>
                        <button
                          className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                          onClick={copyAsJson}
                        >
                          Kopiuj JSON
                        </button>
                        <button
                          className="px-3 py-1.5 bg-bkpk-primary text-white text-xs font-bold rounded-lg hover:bg-bkpk-primary-hover transition-colors shadow-bkpk-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleSave}
                          disabled={validation.issues.length > 0}
                        >
                          Zapisz zmiany
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {validation.issues.length > 0 && (
                  <div className="bg-bkpk-warning/10 border border-bkpk-warning/30 p-4 rounded-xl text-bkpk-text-primary text-sm mb-6">
                    <strong className="text-bkpk-warning block mb-2">Walidacja</strong>
                    <ul className="list-disc pl-5 space-y-1">
                      {validation.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-bkpk-text-muted font-bold pt-3 border-t border-bkpk-warning/20">
                      <span className={validation.scoreMismatch ? 'text-bkpk-danger' : 'text-bkpk-success'}>
                        Boxscore: {validation.scoreMismatch ? 'BŁĄD' : 'OK'}
                      </span>
                      <span className={validation.quartersMismatch ? 'text-bkpk-danger' : 'text-bkpk-success'}>
                        Kwarty: {validation.quartersMismatch ? 'BŁĄD' : 'OK'}
                      </span>
                      <span className={validation.fiveMinMismatch ? 'text-bkpk-danger' : 'text-bkpk-success'}>
                        5‑min: {validation.fiveMinMismatch ? 'BŁĄD' : 'OK'}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-bkpk-text-muted opacity-80">
                      <div><strong>Legenda błędów:</strong></div>
                      <div>• Czerwone pola w boxscore = C &gt; W (np. 2P/3P/FT)</div>
                      <div>• Czerwone pola w kwartach = niezgodne z 5‑min</div>
                      <div>• Czerwone PKT w „W sumie” = suma boxscore nie zgadza się z wynikiem</div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                      Liga
                      <input
                        className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50"
                        value={draft.league}
                        onChange={(e) => updateDraftField('league', e.target.value)}
                        disabled={mode === 'view'}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                      Data
                      <input
                        className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50"
                        value={draft.date}
                        onChange={(e) => updateDraftField('date', e.target.value)}
                        disabled={mode === 'view'}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                      Godzina
                      <input
                        className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50"
                        value={draft.time || ''}
                        onChange={(e) => updateDraftField('time', e.target.value)}
                        disabled={mode === 'view'}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                      Hala
                      <input
                        className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50"
                        value={draft.venue || ''}
                        onChange={(e) => updateDraftField('venue', e.target.value)}
                        disabled={mode === 'view'}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                      Wynik końcowy
                      <input
                        className={`w-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors disabled:opacity-50 ${validation.scoreMismatch ? 'border-bkpk-danger focus:border-bkpk-danger' : ''}`}
                        value={draft.finalScore}
                        onChange={(e) => updateDraftField('finalScore', e.target.value)}
                        disabled={mode === 'view'}
                      />
                    </label>
                  </div>

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
                          <td className="p-3 font-semibold text-bkpk-text-primary">{draft.teams.find((t) => t.isBekapaka)?.name || 'BeKaPaKa'}</td>
                          {draft.quarters.map((q, idx) => (
                            <td key={`home-${q.label}`} className="p-2 text-center">
                              <input
                                className={`w-16 h-9 bg-bkpk-bg border border-bkpk-border-strong rounded-lg text-center text-sm focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.quarterMismatchIndices?.[idx] ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                                type="text"
                                inputMode="numeric"
                                value={q.home}
                                onChange={(e) => updateQuarter(idx, 'home', e.target.value)}
                                disabled={mode === 'view'}
                              />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-bkpk-text-primary">{draft.teams.find((t) => !t.isBekapaka)?.name || 'Rywal'}</td>
                          {draft.quarters.map((q, idx) => (
                            <td key={`away-${q.label}`} className="p-2 text-center">
                              <input
                                className={`w-16 h-9 bg-bkpk-bg border border-bkpk-border-strong rounded-lg text-center text-sm focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.quarterMismatchIndices?.[idx] ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                                type="text"
                                inputMode="numeric"
                                value={q.away}
                                onChange={(e) => updateQuarter(idx, 'away', e.target.value)}
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

                  {draft.teams.map((team, teamIndex) => (
                    <div key={team.id} className="flex flex-col gap-4 mt-8">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-bkpk-border-strong pb-3">
                        <h4 className="text-lg font-bold font-outfit text-bkpk-text-primary">{team.name}</h4>
                        {mode === 'edit' && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                              onClick={() => recalcTeam(teamIndex)}
                            >
                              Przelicz PKT
                            </button>
                            <button
                              className="px-3 py-1.5 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-xs font-bold rounded-lg hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                              onClick={() => addPlayer(teamIndex)}
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
                            {team.players.map((player, playerIndex) => {
                              const computedPts = (Number(player.two_pm ?? 0) * 2) + (Number(player.three_pm ?? 0) * 3) + Number(player.ftm ?? 0);
                              const ptsMismatch = player.pts !== undefined && Number(player.pts ?? 0) !== computedPts;
                              const twoMismatch = Number(player.two_pm ?? 0) > Number(player.two_pa ?? 0);
                              const threeMismatch = Number(player.three_pm ?? 0) > Number(player.three_pa ?? 0);
                              const ftMismatch = Number(player.ftm ?? 0) > Number(player.fta ?? 0);
                              const rebMismatch = Number(player.reb ?? 0) !== (Number(player.oreb ?? 0) + Number(player.dreb ?? 0));
                              return (
                                <tr key={player.id} className="border-b border-bkpk-border-subtle/30 hover:bg-bkpk-surface-tint-2 transition-colors group">
                                  <td className="p-2 border-r border-bkpk-border-subtle/30 text-center font-mono text-xs sticky left-0 bg-bkpk-surface-elevated group-hover:bg-bkpk-surface-tint-2">{player.number}</td>
                                  <td className="p-2 border-r border-bkpk-border-subtle/30 whitespace-nowrap font-medium text-bkpk-text-primary sticky left-12 bg-bkpk-surface-elevated group-hover:bg-bkpk-surface-tint-2 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]">
                                    {player.name}
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.min || ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'min', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
                                    <input
                                      className={`w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${twoMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger bg-bkpk-danger/10' : ''}`}
                                      type="text"
                                      inputMode="numeric"
                                      value={player.two_pm ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'two_pm', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
                                    <input
                                      className={`w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${twoMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger bg-bkpk-danger/10' : ''}`}
                                      type="text"
                                      inputMode="numeric"
                                      value={player.two_pa ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'two_pa', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 text-xs text-center text-bkpk-text-muted bg-bkpk-surface-tint-2/30">
                                    {formatPct(player.two_pm, player.two_pa)}
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className={`w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${threeMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger bg-bkpk-danger/10' : ''}`}
                                      type="text"
                                      inputMode="numeric"
                                      value={player.three_pm ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'three_pm', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className={`w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${threeMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger bg-bkpk-danger/10' : ''}`}
                                      type="text"
                                      inputMode="numeric"
                                      value={player.three_pa ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'three_pa', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 text-xs text-center text-bkpk-text-muted">
                                    {formatPct(player.three_pm, player.three_pa)}
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
                                    <input
                                      className={`w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${ftMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger bg-bkpk-danger/10' : ''}`}
                                      type="text"
                                      inputMode="numeric"
                                      value={player.ftm ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'ftm', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
                                    <input
                                      className={`w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${ftMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger bg-bkpk-danger/10' : ''}`}
                                      type="text"
                                      inputMode="numeric"
                                      value={player.fta ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'fta', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 text-xs text-center text-bkpk-text-muted bg-bkpk-surface-tint-2/30">
                                    {formatPct(player.ftm, player.fta)}
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.oreb ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'oreb', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.dreb ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'dreb', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className={`w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${rebMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger bg-bkpk-danger/10' : ''}`}
                                      type="text"
                                      inputMode="numeric"
                                      value={player.reb ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'reb', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.ast ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'ast', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.tov ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'tov', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.stl ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'stl', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.blk ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'blk', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.pf ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'pf', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.fouls_committed ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(
                                          teamIndex,
                                          playerIndex,
                                          'fouls_committed',
                                          e.target.value
                                        )
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.fouls_drawn ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(
                                          teamIndex,
                                          playerIndex,
                                          'fouls_drawn',
                                          e.target.value
                                        )
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30">
                                    <input
                                      className="w-full h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                      type="text"
                                      inputMode="numeric"
                                      value={player.plusMinus ?? ''}
                                      onChange={(e) =>
                                        updatePlayerStat(teamIndex, playerIndex, 'plusMinus', e.target.value)
                                      }
                                      disabled={mode === 'view'}
                                    />
                                  </td>
                                  <td className="p-1 border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2/30 text-center">
                                    <span className={`font-bold ${ptsMismatch ? 'text-bkpk-danger' : 'text-bkpk-text-primary'}`}>
                                      {player.pts ?? 0}
                                    </span>
                                  </td>
                                  {mode === 'edit' && (
                                    <td className="p-1 text-center">
                                      <button
                                        className="text-bkpk-danger hover:text-red-400 font-bold text-xs uppercase p-1 rounded hover:bg-bkpk-danger/10 transition-colors"
                                        onClick={() => removePlayer(teamIndex, playerIndex)}
                                        title="Usuń zawodnika"
                                      >
                                        ×
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            {(() => {
                              const totals = sumTeamTotals(team);
                              const totalsMismatch =
                                (team.isBekapaka ? validation.homeTotalsMismatch : validation.awayTotalsMismatch) || false;
                              return (
                                <tr className="bg-bkpk-surface-elevated font-bold border-t-2 border-bkpk-border-strong">
                                  <td colSpan={3} className="p-3 text-right text-bkpk-text-secondary border-r border-bkpk-border-subtle/30 sticky left-0 z-30 bg-bkpk-surface-elevated shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]">W sumie</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.two_pm}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.two_pa}</td>
                                  <td className="p-2 text-center border-r border-bkpk-border-subtle/30 text-bkpk-text-muted text-xs font-normal">{formatPct(totals.two_pm, totals.two_pa)}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.three_pm}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.three_pa}</td>
                                  <td className="p-2 text-center border-r border-bkpk-border-subtle/30 text-bkpk-text-muted text-xs font-normal">{formatPct(totals.three_pm, totals.three_pa)}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.ftm}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.fta}</td>
                                  <td className="p-2 text-center border-r border-bkpk-border-subtle/30 text-bkpk-text-muted text-xs font-normal">{formatPct(totals.ftm, totals.fta)}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.oreb}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.dreb}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.reb}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.ast}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.tov}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.stl}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.blk}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.pf}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.fouls_committed}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.fouls_drawn}</td>
                                  <td className={`p-2 text-center border-r border-bkpk-border-subtle/30 ${totalsMismatch ? 'text-bkpk-danger' : ''}`}>{totals.plusMinus}</td>
                                  <td className="p-2 text-center border-r border-bkpk-border-subtle/30 bg-bkpk-surface-tint-2">
                                    <strong className={`text-lg ${validation.scoreMismatch ? 'text-bkpk-danger' : 'text-bkpk-primary'}`}>
                                      {totals.pts}
                                    </strong>
                                  </td>
                                  {mode === 'edit' && <td></td>}
                                </tr>
                              );
                            })()}
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
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
                                onChange={(e) => updateTeamStat(tIdx, 'points_in_paint', e.target.value)}
                                disabled={mode === 'view'}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                className="w-14 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                type="text"
                                inputMode="numeric"
                                value={team.points_from_turnover || ''}
                                onChange={(e) => updateTeamStat(tIdx, 'points_from_turnover', e.target.value)}
                                disabled={mode === 'view'}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                className="w-14 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                type="text"
                                inputMode="numeric"
                                value={team.points_second_chance || ''}
                                onChange={(e) => updateTeamStat(tIdx, 'points_second_chance', e.target.value)}
                                disabled={mode === 'view'}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                className="w-14 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                                type="text"
                                inputMode="numeric"
                                value={team.points_fast_break || ''}
                                onChange={(e) => updateTeamStat(tIdx, 'points_fast_break', e.target.value)}
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

                  <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary mb-6">Punkty w 5-minutowych przedziałach</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* First Half */}
                    <div className="bg-bkpk-surface-tint-1 border border-bkpk-border-strong rounded-xl p-4">
                      <h4 className="text-sm font-bold text-bkpk-text-muted uppercase tracking-wider mb-4 border-b border-bkpk-border-subtle pb-2">I Połowa</h4>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                            <th className="p-2 text-left">Minuta</th>
                            <th className="p-2 text-center">{draft.teams.find((t) => t.isBekapaka)?.name || 'Gospodarze'}</th>
                            <th className="p-2 text-center">{draft.teams.find((t) => !t.isBekapaka)?.name || 'Goście'}</th>
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
                                  onChange={(e) => updateFiveMinute(rowIdx, 'home', e.target.value)}
                                  disabled={mode === 'view'}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  className={`w-12 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.fiveMinMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                                  value={draft.fiveMinute?.[rowIdx]?.away ?? ''}
                                  onChange={(e) => updateFiveMinute(rowIdx, 'away', e.target.value)}
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
                            <th className="p-2 text-center">{draft.teams.find((t) => t.isBekapaka)?.name || 'Gospodarze'}</th>
                            <th className="p-2 text-center">{draft.teams.find((t) => !t.isBekapaka)?.name || 'Goście'}</th>
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
                                  onChange={(e) => updateFiveMinute(rowIdx, 'home', e.target.value)}
                                  disabled={mode === 'view'}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  className={`w-12 h-8 bg-bkpk-bg border border-bkpk-border-strong rounded text-center text-xs focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all ${validation.fiveMinMismatch ? 'border-bkpk-danger focus:border-bkpk-danger focus:ring-bkpk-danger' : ''}`}
                                  value={draft.fiveMinute?.[rowIdx]?.away ?? ''}
                                  onChange={(e) => updateFiveMinute(rowIdx, 'away', e.target.value)}
                                  disabled={mode === 'view'}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

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
                            onChange={(e) => updateTeamStat(tIdx, 'biggest_run', e.target.value)}
                            disabled={mode === 'view'}
                          />
                        </label>
                        <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                          Największa przewaga (pkt)
                          <input
                            className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors"
                            value={team.biggest_lead || ''}
                            onChange={(e) => updateTeamStat(tIdx, 'biggest_lead', e.target.value)}
                            disabled={mode === 'view'}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                  <Legend
                    title="Legenda skrótów (Protokół)"
                    items={[
                      { term: 'C/W', desc: 'Celne/Wykonane (trafione/próby).' },
                      { term: 'Za 2/Za 3/Za 1', desc: 'Rzuty za 2, za 3 i wolne.' },
                      { term: 'Zb A/O/Su', desc: 'Zbiórki w ataku / obronie / suma.' },
                      { term: 'A/S/P/B', desc: 'Asysty / straty / przechwyty / bloki.' },
                      { term: 'F/FP/FW', desc: 'Faule / faule popełnione / faule wymuszone.' },
                      { term: '+/-', desc: 'Bilans punktowy przy zawodniku.' }
                    ]}
                  />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-bkpk-overlay-strong flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-bkpk-surface-elevated border border-bkpk-border-strong rounded-2xl w-[600px] max-w-full overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-bkpk-border-strong bg-bkpk-surface-tint-1">
              <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary">Dodaj / importuj protokół</h3>
              <button
                className="text-bkpk-text-muted hover:text-bkpk-text-primary transition-colors p-1"
                onClick={() => setShowAdd(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                  Format danych
                  <select
                    className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors"
                    value={importFormat}
                    onChange={(e) => setImportFormat(e.target.value as 'markdown' | 'json')}
                  >
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON (Baza danych)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                  Data meczu
                  <input
                    className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors"
                    value={importMeta.date}
                    onChange={(e) => setImportMeta({ ...importMeta, date: e.target.value })}
                    placeholder="YYYY-MM-DD"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
                Rywal
                <input
                  className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors"
                  value={importMeta.opponent}
                  onChange={(e) => setImportMeta({ ...importMeta, opponent: e.target.value })}
                  placeholder="Nazwa Drużyny"
                />
              </label>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-bold text-bkpk-text-primary uppercase tracking-wider">Wgraj plik (opcjonalnie)</span>
                <label className="block p-8 border-2 border-dashed border-bkpk-border-strong rounded-xl text-center cursor-pointer hover:bg-bkpk-surface-tint-2 hover:border-bkpk-primary transition-all group">
                  <div className="flex flex-col items-center gap-3 text-bkpk-text-muted group-hover:text-bkpk-text-primary transition-colors">
                    <Upload size={32} />
                    <span className="font-medium text-sm">Kliknij, aby wybrać plik .json / .md</span>
                  </div>
                  <input
                    type="file"
                    accept=".json,.md,text/markdown"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
                {fileName && <span className="text-sm font-medium text-bkpk-primary mt-1 text-center bg-bkpk-primary/10 py-1 px-3 rounded-full self-center">{fileName}</span>}
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-bold text-bkpk-text-primary uppercase tracking-wider">Treść protokołu</span>
                <textarea
                  placeholder='Wklej tutaj zawartość...'
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  className="w-full h-32 bg-bkpk-bg border border-bkpk-border-strong rounded-xl p-3 text-xs font-mono resize-none focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
                />
              </div>
            </div>

            {importError && (
              <div className="mx-6 mb-4 p-3 bg-bkpk-danger/10 border border-bkpk-danger/20 rounded-lg text-bkpk-danger text-sm font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                {importError}
              </div>
            )}

            {importPreview && (
              <div className="mx-6 mb-6">
                <span className="block text-xs font-bold text-bkpk-text-muted uppercase tracking-wider mb-2">Podgląd danych</span>
                <pre className="bg-bkpk-surface-tint-2 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-bkpk-border-subtle max-h-60 text-bkpk-text-secondary">
                  {JSON.stringify(importPreview, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end gap-3 p-6 border-t border-bkpk-border-strong bg-bkpk-surface-tint-1">
              {/* Parse button if content but no preview */}
              {!importPreview && importContent && (
                <button
                  className="px-4 py-2 bg-bkpk-accent text-white text-sm font-bold rounded-xl hover:bg-bkpk-accent-hover transition-colors shadow-sm"
                  onClick={() => handleImportParse()}
                >
                  Sprawdź poprawność
                </button>
              )}

              <button
                className="px-4 py-2 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-sm font-bold rounded-xl hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
                onClick={() => setShowAdd(false)}
              >
                Anuluj
              </button>
              <button
                className="px-4 py-2 bg-bkpk-primary text-white text-sm font-bold rounded-xl hover:bg-bkpk-primary-hover transition-colors shadow-bkpk-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleImportSave}
                disabled={!importPreview && importFormat === 'markdown'}
              >
                <Save size={16} />
                {importPreview ? 'Zapisz protokół' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
