import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Printer,
  Copy,
  Check,
  Shield,
  Target,
  Zap,
  Clock,
  MapPin,
  Shirt,
  Calendar,
  AlertCircle
} from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton from '../../shared/ui/BkpkButton';
import { cn } from '../../shared/lib/utils';
import { postJSON } from '../../lib/api';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';

export interface PreGameData {
  id: string;
  seasonId: string;
  opponentName: string;
  matchDate?: string | null;
  gatheringTime?: string | null;
  tipoffTime?: string | null;
  jerseyColor: string;
  venue: string;
  tacticalKeys: Array<{ number: number; title: string; description: string; focus: string }>;
  startingFive: Array<{ position: string; name: string; number?: number; assignment: string }>;
  benchKeys?: string | null;
  motivationalMotto?: string | null;
  generatedByAi: boolean;
}

interface PreGameMatchCardProps {
  briefing: PreGameData | null;
  opponent: string | null;
  seasonId: string;
  onRefresh: () => void;
}

export default function PreGameMatchCard({
  briefing,
  opponent,
  seasonId,
  onRefresh
}: PreGameMatchCardProps) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (force = false) => {
    setGenerating(true);
    try {
      await postJSON('/api/tactics/pregame/generate', {
        seasonId,
        opponent,
        force
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyText = () => {
    if (!briefing) return;
    const text = `🏀 ODPRAWA PRZEDMECZOWA: BeKaPaKa vs ${briefing.opponentName}
📅 Data: ${briefing.matchDate ? new Date(briefing.matchDate).toLocaleDateString('pl-PL') : 'Najbliższa kolejka'}
⏰ Zbiórka: ${briefing.gatheringTime || '45 min przed meczem'} | Mecz: ${briefing.tipoffTime || '18:30'}
🎽 Stroje: ${briefing.jerseyColor} | 📍 ${briefing.venue}

🎯 3 KLUCZOWE ZAŁOŻENIA TAKTYCZNE:
${briefing.tacticalKeys?.map((k) => `${k.number}. ${k.title.toUpperCase()}: ${k.description}`).join('\n')}

⭐ WYJŚCIOWA PIĄTKA & KRYCIE:
${briefing.startingFive?.map((p) => `- [${p.position}] #${p.number || ''} ${p.name}: ${p.assignment}`).join('\n')}

⚡ ŁAWKA: ${briefing.benchKeys || 'Utrzymanie tempa i energii'}
🔥 MOTTO: "${briefing.motivationalMotto || 'Gramy twardo od pierwszej minuty!'}"`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!opponent && !briefing) {
    return (
      <KalkEmptyState
        title="Brak Nadchodzącego Rywala w Terminarzu"
        description="Odprawa przedmeczowa będzie dostępna, gdy w terminarzu sezonu pojawi się zaplanowany mecz BeKaPaKa."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Pasek Akcji */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-bkpk-text-primary uppercase tracking-wider">
            Odprawa Meczowa: vs {opponent || briefing?.opponentName}
          </h3>
          <p className="text-xs text-bkpk-text-muted">
            1-stronicowy panel taktyczny dla zespołu (gotowy na Messenger/WhatsApp oraz do druku)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {briefing && (
            <>
              <BkpkButton variant="outline" size="sm" onClick={handleCopyText}>
                {copied ? <Check className="w-4 h-4 mr-1.5 text-bkpk-success" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copied ? 'Skopiowano!' : 'Kopiuj na Messenger'}
              </BkpkButton>
              <BkpkButton variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1.5" />
                Drukuj A4 / PDF
              </BkpkButton>
            </>
          )}
          <BkpkButton
            variant="primary"
            size="sm"
            onClick={() => handleGenerate(!!briefing)}
            loading={generating}
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {briefing ? 'Wygeneruj Ponownie AI' : 'Generuj Odprawę AI'}
          </BkpkButton>
        </div>
      </div>

      {/* Karta Główna Odprawy (Print & Screen ready) */}
      {!briefing ? (
        <BkpkCard variant="glass" className="text-center py-16">
          <Shield className="w-12 h-12 text-bkpk-primary/40 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-bkpk-text-primary uppercase tracking-wider mb-2">
            Odprawa na mecz z {opponent} nie została jeszcze wygenerowana
          </h4>
          <p className="text-xs text-bkpk-text-muted max-w-md mx-auto mb-6">
            Kliknij poniższy przycisk, aby Gemini AI przygotowało 3 kluczowe założenia, wyjściową piątkę i krycie indywidualne na podstawie scoutingu.
          </p>
          <BkpkButton variant="primary" onClick={() => handleGenerate(false)} loading={generating}>
            <Sparkles className="w-4 h-4 mr-2" />
            Przygotuj Odprawę Przedmeczową
          </BkpkButton>
        </BkpkCard>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="print:bg-white print:text-black print:p-6"
        >
          <BkpkCard
            variant="glass"
            className="p-6 sm:p-8 border-2 border-bkpk-primary/40 relative overflow-hidden shadow-2xl bg-gradient-to-b from-[#141416] to-[#0d0d0f]"
          >
            {/* Nagłówek Wizualny */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-bkpk-border-strong">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-bkpk-primary bg-bkpk-primary/10 px-3 py-1 rounded-full border border-bkpk-primary/20 inline-block mb-2">
                  KALK Dywizja II • Matchday Briefing
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-bkpk-text-primary tracking-tight font-outfit uppercase">
                  BEKAPAKA <span className="text-bkpk-primary">vs</span> {briefing.opponentName}
                </h2>
              </div>

              {/* Informacje Logistyczne */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs w-full sm:w-auto bg-bkpk-surface-tint-1 p-3 rounded-2xl border border-bkpk-border-subtle">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-bkpk-primary shrink-0" />
                  <div>
                    <span className="text-[10px] text-bkpk-text-muted block font-medium">Data</span>
                    <span className="font-bold text-bkpk-text-primary">
                      {briefing.matchDate ? new Date(briefing.matchDate).toLocaleDateString('pl-PL') : 'Najbliższa'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-bkpk-text-muted block font-medium">Zbiórka / Mecz</span>
                    <span className="font-bold text-bkpk-text-primary">
                      {briefing.gatheringTime || '17:45'} / {briefing.tipoffTime || '18:30'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-bkpk-success shrink-0" />
                  <div>
                    <span className="text-[10px] text-bkpk-text-muted block font-medium">Stroje</span>
                    <span className="font-bold text-bkpk-text-primary">{briefing.jerseyColor}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-bkpk-text-muted block font-medium">Hala</span>
                    <span className="font-bold text-bkpk-text-primary truncate max-w-[120px]">
                      {briefing.venue}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Kluczowe Założenia Taktyczne */}
            <div className="my-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-bkpk-primary mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" />
                3 Kluczowe Założenia Meczowe (Game Directives)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {briefing.tacticalKeys?.map((key) => {
                  const isDefense = key.focus === 'defense';
                  const isOffense = key.focus === 'offense';

                  return (
                    <div
                      key={key.number}
                      className={cn(
                        "p-4 rounded-2xl border relative overflow-hidden flex flex-col justify-between",
                        isDefense
                          ? "bg-rose-950/20 border-rose-500/30"
                          : isOffense
                            ? "bg-amber-950/20 border-amber-500/30"
                            : "bg-emerald-950/20 border-emerald-500/30"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-bkpk-primary text-black font-black text-xs flex items-center justify-center font-outfit">
                            {key.number}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                              isDefense
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                : isOffense
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            )}
                          >
                            {key.focus || 'Taktyka'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-bkpk-text-primary mb-1.5">{key.title}</h4>
                        <p className="text-xs text-bkpk-text-secondary leading-relaxed">{key.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wyjściowa Piątka & Krycie Indywidualne */}
            <div className="my-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-bkpk-primary mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Wyjściowa Piątka &amp; Zadania Indywidualne (Matchup Assignments)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {briefing.startingFive?.map((player) => (
                  <div
                    key={player.position}
                    className="p-3.5 rounded-2xl bg-bkpk-surface-tint-1 border border-bkpk-border-strong flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-bkpk-primary font-outfit px-2 py-0.5 rounded-md bg-bkpk-primary/10 border border-bkpk-primary/20">
                          {player.position}
                        </span>
                        {player.number != null && (
                          <span className="text-xs font-black text-bkpk-text-muted font-outfit">
                            #{player.number}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-bkpk-text-primary block truncate mb-2">
                        {player.name}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-bkpk-border-subtle">
                      <span className="text-[10px] text-bkpk-text-muted uppercase block font-medium mb-0.5">
                        Zadanie / Krycie:
                      </span>
                      <p className="text-[11px] text-bkpk-text-secondary leading-snug">
                        {player.assignment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zadania dla Ławki i Hasło Motywacyjne */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-bkpk-border-strong">
              {briefing.benchKeys && (
                <div className="p-4 rounded-2xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                    ⚡ Rola Ławki Rezerwowych
                  </span>
                  <p className="text-xs text-bkpk-text-secondary leading-relaxed">
                    {briefing.benchKeys}
                  </p>
                </div>
              )}

              {briefing.motivationalMotto && (
                <div className="p-4 rounded-2xl bg-bkpk-primary/10 border border-bkpk-primary/20 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-bkpk-primary shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-bkpk-primary block mb-0.5">
                      Motto Meczowe
                    </span>
                    <p className="text-xs font-bold text-bkpk-text-primary italic">
                      "{briefing.motivationalMotto}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </BkpkCard>
        </motion.div>
      )}
    </div>
  );
}
