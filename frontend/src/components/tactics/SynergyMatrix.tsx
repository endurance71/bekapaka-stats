import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Shield, Search, Award } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import { pluralPl } from '../../shared/lib/plural';

/** GET /api/tactics/synergy (backend/kalk/v2/synergy.js → computeTeamSynergy). */
export interface DuoPlayer {
  id: string;
  rosterId: string | null;
  name: string;
  number?: number | null;
}

export interface DuoRecord {
  id: string;
  player1: DuoPlayer;
  player2: DuoPlayer;
  gamesTogether: number;
  /** Tylko akcja po akcji */
  minutesTogether?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  plusMinus?: number;
  pointsForPer10?: number | null;
  pointsAgainstPer10?: number | null;
  /** Tylko box score (starsze sezony) */
  avgCombinedPpg?: number;
}

export interface SynergyResponse {
  source: 'pbp' | 'box' | 'none';
  gamesAnalyzed: number;
  /** % czasu meczów z pewnym składem (5 na parkiecie) */
  dataQuality: number | null;
  duos: DuoRecord[];
  bestOffensivePair: DuoRecord | null;
  bestDefensivePair: DuoRecord | null;
}

export const EMPTY_SYNERGY: SynergyResponse = {
  source: 'none',
  gamesAnalyzed: 0,
  dataQuality: null,
  duos: [],
  bestOffensivePair: null,
  bestDefensivePair: null
};

const signed = (n: number | undefined) => (n == null ? '–' : n > 0 ? `+${n}` : String(n));
const fmt1 = (n: number | null | undefined) => (n == null ? '–' : n.toFixed(1).replace('.', ','));

function PlayerName({ p, className }: { p: DuoPlayer; className?: string }) {
  return p.rosterId ? (
    <Link to={`/players/${p.rosterId}`} className={cn('hover:text-bkpk-primary transition-colors', className)}>
      {p.name}
    </Link>
  ) : (
    <span className={className}>{p.name}</span>
  );
}

function DuoTitle({ duo }: { duo: DuoRecord }) {
  return (
    <h4 className="font-display uppercase text-[20px] leading-tight text-bkpk-text-primary mb-1">
      <PlayerName p={duo.player1} /> &amp; <PlayerName p={duo.player2} />
    </h4>
  );
}

/** Taktyka → „Synergia duetów”: pary BeKaPaKa — razem na parkiecie (akcja po akcji) albo wspólne mecze (starsze sezony). */
export default function SynergyMatrix({ data, loading }: { data: SynergyResponse; loading?: boolean }) {
  const [filterPlayer, setFilterPlayer] = useState('');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        <div className="h-32 bg-bkpk-surface-tint-2" />
        <div className="h-32 bg-bkpk-surface-tint-2" />
        <div className="h-32 bg-bkpk-surface-tint-2" />
      </div>
    );
  }

  const { duos, bestOffensivePair, bestDefensivePair, gamesAnalyzed, source, dataQuality } = data;
  const pbp = source === 'pbp';

  if (!duos.length || gamesAnalyzed === 0) {
    return (
      <KalkEmptyState
        title="Za mało wspólnych meczów"
        message={
          pbp
            ? 'Duety pokażemy, gdy para zagra razem co najmniej 10 minut (liczone z akcji po akcji).'
            : 'Duety pokażemy, gdy para zagra razem co najmniej 3 mecze w sezonie.'
        }
      />
    );
  }

  const query = filterPlayer.toLowerCase();
  const filteredDuos = duos.filter(
    (d) => !query || d.player1.name.toLowerCase().includes(query) || d.player2.name.toLowerCase().includes(query)
  );
  const bestTogether = pbp ? duos[0] : null;
  const matchesLabel = `${gamesAnalyzed} ${pluralPl(gamesAnalyzed, 'mecz', 'mecze', 'meczów')}`;

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-bkpk-text-muted max-w-3xl">
        {pbp
          ? `Liczone z akcji po akcji: czas, gdy obaj zawodnicy byli razem na parkiecie, i bilans punktów w tym czasie (${matchesLabel}${
              dataQuality != null && dataQuality < 100 ? `, ${fmt1(dataQuality)}% czasu z pewnym składem` : ''
            }).`
          : `Sezon bez zapisu akcja po akcji — pokazujemy wspólne mecze i punkty pary (${matchesLabel}).`}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bestTogether && (
          <BkpkCard variant="glass" className="p-5 border-t-[3px] border-t-brand-gold-500">
            <div className="flex items-center gap-2 text-brand-gold-500 label-caps text-[12px] mb-2">
              <Award className="w-4 h-4" aria-hidden />
              Najlepszy bilans razem
            </div>
            <DuoTitle duo={bestTogether} />
            <div className="flex items-baseline gap-3 mt-3">
              <div>
                <span className="text-[36px] leading-none text-brand-gold-500 font-display tabular-nums">{signed(bestTogether.plusMinus)}</span>
                <span className="label-caps text-[11px] text-bkpk-text-muted block">Bilans pkt</span>
              </div>
              <div className="border-l border-bkpk-border-subtle pl-3 text-[13px] text-bkpk-text-secondary tabular-nums">
                {bestTogether.minutesTogether} min razem
                <span className="block text-bkpk-text-muted">
                  {bestTogether.pointsFor}:{bestTogether.pointsAgainst}
                </span>
              </div>
            </div>
          </BkpkCard>
        )}

        {bestOffensivePair && (
          <BkpkCard variant="glass" className="p-5 border-t-[3px] border-t-bkpk-primary">
            <div className="flex items-center gap-2 text-bkpk-primary label-caps text-[12px] mb-2">
              <Flame className="w-4 h-4" aria-hidden />
              {pbp ? 'Najlepszy atak' : 'Najwięcej punktów razem'}
            </div>
            <DuoTitle duo={bestOffensivePair} />
            <div className="flex items-baseline gap-3 mt-3">
              <div>
                <span className="text-[36px] leading-none text-bkpk-text-primary font-display tabular-nums">
                  {pbp ? fmt1(bestOffensivePair.pointsForPer10) : fmt1(bestOffensivePair.avgCombinedPpg)}
                </span>
                <span className="label-caps text-[11px] text-bkpk-text-muted block">{pbp ? 'Pkt drużyny / 10 min' : 'Pkt pary / mecz'}</span>
              </div>
              <div className="border-l border-bkpk-border-subtle pl-3 text-[13px] text-bkpk-text-secondary tabular-nums">
                {pbp ? `${bestOffensivePair.minutesTogether} min razem` : `${bestOffensivePair.gamesTogether} meczów razem`}
              </div>
            </div>
          </BkpkCard>
        )}

        {bestDefensivePair && (
          <BkpkCard variant="glass" className="p-5 border-t-[3px] border-t-brand-stone-200">
            <div className="flex items-center gap-2 text-brand-stone-200 label-caps text-[12px] mb-2">
              <Shield className="w-4 h-4" aria-hidden />
              Najlepsza obrona
            </div>
            <DuoTitle duo={bestDefensivePair} />
            <div className="flex items-baseline gap-3 mt-3">
              <div>
                <span className="text-[36px] leading-none text-bkpk-text-primary font-display tabular-nums">{fmt1(bestDefensivePair.pointsAgainstPer10)}</span>
                <span className="label-caps text-[11px] text-bkpk-text-muted block">Pkt rywala / 10 min</span>
              </div>
              <div className="border-l border-bkpk-border-subtle pl-3 text-[13px] text-bkpk-text-secondary tabular-nums">
                {bestDefensivePair.minutesTogether} min razem
              </div>
            </div>
          </BkpkCard>
        )}
      </div>

      <BkpkCard variant="glass" className="p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5">
          <h3 className="text-[20px] sm:text-[22px] leading-tight text-bkpk-text-primary">Wszystkie duety</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-bkpk-text-muted" aria-hidden />
            <input
              type="text"
              value={filterPlayer}
              onChange={(e) => setFilterPlayer(e.target.value)}
              placeholder="Szukaj zawodnika…"
              aria-label="Szukaj zawodnika"
              className="bg-bkpk-bg border border-bkpk-border-strong pl-9 pr-3 py-1.5 min-h-[44px] text-[14px] text-bkpk-text-primary placeholder:text-bkpk-text-muted/50 focus:border-bkpk-text-primary w-full sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 px-3 py-2.5 label-caps text-[11px] text-bkpk-text-secondary bg-ink-700 border-b border-bkpk-border-strong min-w-[500px]">
            <div className="col-span-6">Duet</div>
            <div className="col-span-2 text-center">{pbp ? 'Min razem' : 'Mecze razem'}</div>
            <div className="col-span-2 text-center">{pbp ? 'Punkty' : 'Pkt pary / mecz'}</div>
            <div className="col-span-2 text-right">{pbp ? 'Bilans' : ''}</div>
          </div>

          {filteredDuos.map((duo, idx) => (
            <motion.div
              key={duo.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx, 20) * 0.02 }}
              className="grid grid-cols-12 gap-2 px-3 py-3 even:bg-bkpk-surface-tint-1 border-b border-bkpk-border-subtle items-center min-w-[500px]"
            >
              <div className="col-span-6 flex items-center gap-2 min-w-0">
                <span className="w-6 text-[15px] font-display tabular-nums text-bkpk-text-muted">{idx + 1}.</span>
                <div className="min-w-0">
                  <PlayerName p={duo.player1} className="text-[14px] font-semibold text-bkpk-text-primary block truncate" />
                  <span className="text-[13px] text-bkpk-text-muted block truncate">
                    + <PlayerName p={duo.player2} />
                  </span>
                </div>
              </div>
              <div className="col-span-2 text-center text-[16px] font-display tabular-nums text-bkpk-text-primary">
                {pbp ? duo.minutesTogether : duo.gamesTogether}
              </div>
              <div className="col-span-2 text-center text-[16px] text-bkpk-text-primary font-display tabular-nums">
                {pbp ? `${duo.pointsFor}:${duo.pointsAgainst}` : fmt1(duo.avgCombinedPpg)}
              </div>
              <div
                className={cn(
                  'col-span-2 text-right text-[16px] font-display tabular-nums',
                  pbp && (duo.plusMinus ?? 0) > 0 && 'text-bkpk-success',
                  pbp && (duo.plusMinus ?? 0) < 0 && 'text-bkpk-text-danger'
                )}
              >
                {pbp ? signed(duo.plusMinus) : ''}
              </div>
            </motion.div>
          ))}
        </div>
        {pbp && (
          <p className="mt-3 text-[12px] text-bkpk-text-muted">
            Pary, które zagrały razem co najmniej 10 minut. Bilans = punkty drużyny minus punkty rywala w tym czasie.
          </p>
        )}
      </BkpkCard>
    </div>
  );
}
