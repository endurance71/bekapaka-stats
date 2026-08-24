import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Flame, Shield, TrendingUp, Search, Award } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';

export interface DuoRecord {
  id: string;
  player1: { id: string; name: string; number?: number | null };
  player2: { id: string; name: string; number?: number | null };
  gamesTogether: number;
  combinedPoints: number;
  avgCombinedPpg: number;
  avgPlusMinus: number;
  synergyScore: number;
}

interface SynergyMatrixProps {
  duos: DuoRecord[];
  bestOffensivePair: DuoRecord | null;
  bestDefensivePair: DuoRecord | null;
  gamesAnalyzed: number;
  loading?: boolean;
}

export default function SynergyMatrix({
  duos,
  bestOffensivePair,
  bestDefensivePair,
  gamesAnalyzed,
  loading
}: SynergyMatrixProps) {
  const [filterPlayer, setFilterPlayer] = useState('');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        <div className="h-32 bg-bkpk-surface-tint-2 rounded-2xl" />
        <div className="h-32 bg-bkpk-surface-tint-2 rounded-2xl" />
        <div className="h-32 bg-bkpk-surface-tint-2 rounded-2xl" />
      </div>
    );
  }

  if (!duos || duos.length === 0 || gamesAnalyzed === 0) {
    return (
      <KalkEmptyState
        title="Brak Danych o Zestawieniach w Wybranym Sezonie"
        description="Analiza synergii duetów i wskaźniki efektywności par (Net Rating / Plus-Minus) zostaną obliczone automatycznie po rozegraniu pierwszych meczów w sezonie."
      />
    );
  }

  const filteredDuos = duos.filter((d) => {
    if (!filterPlayer) return true;
    const query = filterPlayer.toLowerCase();
    return (
      d.player1.name.toLowerCase().includes(query) ||
      d.player2.name.toLowerCase().includes(query)
    );
  });

  const bestOverallDuo = duos[0] || null;

  return (
    <div className="space-y-6">
      {/* 3 Karty Wyróżnionych Zestawień (Hero Duos) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Liderzy Synergii */}
        {bestOverallDuo && (
          <BkpkCard variant="glass" className="p-5 border-bkpk-primary/40 shadow-bkpk-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-bkpk-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 text-bkpk-primary text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="w-4 h-4" />
              Najwyższa Synergia (Chemistry)
            </div>
            <h4 className="text-base font-black text-bkpk-text-primary mb-1">
              {bestOverallDuo.player1.name} &amp; {bestOverallDuo.player2.name}
            </h4>
            <div className="flex items-baseline gap-3 mt-3">
              <div>
                <span className="text-2xl font-black text-bkpk-primary font-outfit">
                  {bestOverallDuo.synergyScore}
                </span>
                <span className="text-[10px] text-bkpk-text-muted uppercase block font-medium">Index Synergii</span>
              </div>
              <div className="border-l border-bkpk-border-subtle pl-3">
                <span className="text-sm font-bold text-bkpk-text-secondary">
                  {bestOverallDuo.gamesTogether} meczów razem
                </span>
                <span className="text-[10px] text-bkpk-text-muted block">
                  {bestOverallDuo.avgPlusMinus > 0 ? `+${bestOverallDuo.avgPlusMinus}` : bestOverallDuo.avgPlusMinus} avg +/-
                </span>
              </div>
            </div>
          </BkpkCard>
        )}

        {/* Najskuteczniejszy Duet Strzelecki */}
        {bestOffensivePair && (
          <BkpkCard variant="glass" className="p-5 border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4" />
              Najskuteczniejszy Duet (Ofensywa)
            </div>
            <h4 className="text-base font-black text-bkpk-text-primary mb-1">
              {bestOffensivePair.player1.name} &amp; {bestOffensivePair.player2.name}
            </h4>
            <div className="flex items-baseline gap-3 mt-3">
              <div>
                <span className="text-2xl font-black text-amber-400 font-outfit">
                  {bestOffensivePair.avgCombinedPpg}
                </span>
                <span className="text-[10px] text-bkpk-text-muted uppercase block font-medium">Średnio PTS razem</span>
              </div>
              <div className="border-l border-bkpk-border-subtle pl-3">
                <span className="text-sm font-bold text-bkpk-text-secondary">
                  {bestOffensivePair.combinedPoints} PTS łącznie
                </span>
                <span className="text-[10px] text-bkpk-text-muted block">
                  w {bestOffensivePair.gamesTogether} meczach
                </span>
              </div>
            </div>
          </BkpkCard>
        )}

        {/* Najlepszy Duet Defensywny */}
        {bestDefensivePair && (
          <BkpkCard variant="glass" className="p-5 border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-4 h-4" />
              Najlepszy Bilans +/- (Obrona)
            </div>
            <h4 className="text-base font-black text-bkpk-text-primary mb-1">
              {bestDefensivePair.player1.name} &amp; {bestDefensivePair.player2.name}
            </h4>
            <div className="flex items-baseline gap-3 mt-3">
              <div>
                <span className="text-2xl font-black text-emerald-400 font-outfit">
                  {bestDefensivePair.avgPlusMinus > 0 ? `+${bestDefensivePair.avgPlusMinus}` : bestDefensivePair.avgPlusMinus}
                </span>
                <span className="text-[10px] text-bkpk-text-muted uppercase block font-medium">Średni Plus/Minus</span>
              </div>
              <div className="border-l border-bkpk-border-subtle pl-3">
                <span className="text-sm font-bold text-bkpk-text-secondary">
                  {bestDefensivePair.gamesTogether} meczów
                </span>
                <span className="text-[10px] text-bkpk-text-muted block">
                  razem na parkiecie
                </span>
              </div>
            </div>
          </BkpkCard>
        )}
      </div>

      {/* Tabela Par i Wyszukiwarka */}
      <BkpkCard variant="glass" className="p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-bold text-bkpk-text-primary uppercase tracking-wider">
              Ranking Synergii Wszystkich Duetów
            </h3>
            <p className="text-xs text-bkpk-text-muted">
              Analiza na podstawie {gamesAnalyzed} meczów rozegranych w sezonie
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-bkpk-text-muted" />
            <input
              type="text"
              value={filterPlayer}
              onChange={(e) => setFilterPlayer(e.target.value)}
              placeholder="Filtruj po zawodniku..."
              className="bg-bkpk-bg border border-bkpk-border-strong rounded-xl pl-9 pr-3 py-1.5 text-xs text-bkpk-text-primary placeholder:text-bkpk-text-muted/50 focus:outline-none focus:border-bkpk-primary w-full sm:w-56"
            />
          </div>
        </div>

        {/* Lista wierszy duetów */}
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-bold text-bkpk-text-muted uppercase tracking-wider border-b border-bkpk-border-subtle min-w-[500px]">
            <div className="col-span-6 sm:col-span-5">Duet Zawodników</div>
            <div className="col-span-2 text-center">Wspólne Mecze</div>
            <div className="col-span-2 text-center">Śr. Punkty</div>
            <div className="col-span-2 sm:col-span-3 text-right">Synergia / +/-</div>
          </div>

          {filteredDuos.map((duo, idx) => {
            const isPositivePm = duo.avgPlusMinus > 0;
            return (
              <motion.div
                key={duo.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="grid grid-cols-12 gap-2 px-3 py-3 rounded-xl bg-bkpk-surface-tint-1 hover:bg-bkpk-surface-tint-2 border border-bkpk-border-subtle items-center min-w-[500px] transition-colors"
              >
                <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
                  <span className="w-5 text-[11px] font-black text-bkpk-text-muted">{idx + 1}.</span>
                  <div className="truncate">
                    <span className="text-xs font-bold text-bkpk-text-primary block truncate">
                      {duo.player1.name}
                    </span>
                    <span className="text-xs font-medium text-bkpk-text-muted block truncate">
                      + {duo.player2.name}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 text-center text-xs font-bold text-bkpk-text-primary">
                  {duo.gamesTogether}
                </div>

                <div className="col-span-2 text-center text-xs font-bold text-amber-400 font-outfit">
                  {duo.avgCombinedPpg} <span className="text-[10px] text-bkpk-text-muted font-normal">PPG</span>
                </div>

                <div className="col-span-2 sm:col-span-3 text-right">
                  <span className="text-xs font-black font-outfit text-bkpk-primary block">
                    {duo.synergyScore} pkt
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      isPositivePm ? "text-bkpk-success" : "text-bkpk-danger"
                    )}
                  >
                    {isPositivePm ? `+${duo.avgPlusMinus}` : duo.avgPlusMinus} +/-
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </BkpkCard>
    </div>
  );
}
