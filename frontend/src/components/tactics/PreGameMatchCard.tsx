import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Printer, Copy, Check, Shield, Target, Zap, Shirt, AlertCircle } from 'lucide-react';
import { ClockIcon as Clock, VenueIcon as MapPin, CalendarIcon as Calendar } from '../../shared/ui/BrandIcon';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton from '../../shared/ui/BkpkButton';
import { cn } from '../../shared/lib/utils';
import { postJSON } from '../../lib/api';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import { formatMatchTime } from '../../shared/lib/matchUtils';

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

/** Logistyka z terminarza i dnia meczowego (`/api/me/home` → nextMatch) — ma pierwszeństwo przed zapisem w odprawie. */
export interface PreGameSchedule {
  date: string;
  venue?: string | null;
  gatheringTime?: string | null;
  kit?: string | null;
}

const NONE = '—';

/** Data, godziny, strój i hala odprawy: najpierw terminarz/dzień meczowy, potem zapis odprawy; nigdy zmyślone wartości. */
export function pregameLogistics(briefing: PreGameData, schedule?: PreGameSchedule | null) {
  const date = schedule?.date || briefing.matchDate || null;
  return {
    date: date ? new Date(date).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }) : NONE,
    tipoff: schedule?.date ? formatMatchTime(schedule.date) : briefing.tipoffTime || NONE,
    gathering: schedule?.gatheringTime || briefing.gatheringTime || NONE,
    kit: schedule?.kit || briefing.jerseyColor || NONE,
    venue: schedule?.venue || briefing.venue || NONE
  };
}

interface PreGameMatchCardProps {
  briefing: PreGameData | null;
  /** Mecz z terminarza, gdy odprawa dotyczy najbliższego rywala */
  schedule?: PreGameSchedule | null;
  opponent: string | null;
  seasonId: string | null;
  onRefresh: () => void;
  canGenerate?: boolean;
}

export default function PreGameMatchCard({
  briefing,
  schedule,
  opponent,
  seasonId,
  onRefresh,
  canGenerate = false
}: PreGameMatchCardProps) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<'ok' | 'error' | null>(null);
  const logistics = briefing ? pregameLogistics(briefing, schedule) : null;

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

  const handleCopyText = async () => {
    if (!briefing || !logistics) return;
    const text = `🏀 ODPRAWA PRZEDMECZOWA: BeKaPaKa vs ${briefing.opponentName}
📅 Data: ${logistics.date}
⏰ Zbiórka: ${logistics.gathering} | Mecz: ${logistics.tipoff}
🎽 Stroje: ${logistics.kit} | 📍 ${logistics.venue}

🎯 3 KLUCZOWE ZAŁOŻENIA TAKTYCZNE:
${briefing.tacticalKeys?.map((k) => `${k.number}. ${k.title.toUpperCase()}: ${k.description}`).join('\n')}

⭐ WYJŚCIOWA PIĄTKA & KRYCIE:
${briefing.startingFive?.map((p) => `- [${p.position}] #${p.number || ''} ${p.name}: ${p.assignment}`).join('\n')}
${briefing.benchKeys ? `\n⚡ ŁAWKA: ${briefing.benchKeys}` : ''}${briefing.motivationalMotto ? `\n🔥 MOTTO: "${briefing.motivationalMotto}"` : ''}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied('ok');
    } catch {
      setCopied('error');
    }
    setTimeout(() => setCopied(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!opponent && !briefing) {
    return (
      <KalkEmptyState
        title="Brak Nadchodzącego Rywala w Terminarzu"
        message="Odprawa przedmeczowa będzie dostępna, gdy w terminarzu sezonu pojawi się zaplanowany mecz BeKaPaKa."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Pasek Akcji */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-[24px] sm:text-[28px] leading-tight text-bkpk-text-primary">
            Odprawa Meczowa: vs {opponent || briefing?.opponentName}
          </h3>
          {canGenerate && (
            <p className="text-[14px] text-bkpk-text-muted">
              Jedna strona dla drużyny — do wysłania na Messengera albo wydruku.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {briefing && (
            <>
              <BkpkButton variant="outline" size="sm" onClick={handleCopyText}>
                {copied === 'ok' ? <Check className="w-4 h-4 mr-1.5 text-bkpk-success" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copied === 'ok' ? 'Skopiowano!' : copied === 'error' ? 'Nie udało się skopiować' : 'Kopiuj na Messenger'}
              </BkpkButton>
              <BkpkButton variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1.5" />
                Drukuj A4 / PDF
              </BkpkButton>
            </>
          )}
          {canGenerate && <BkpkButton
            variant="primary"
            size="sm"
            onClick={() => handleGenerate(!!briefing)}
            loading={generating}
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {briefing ? 'Wygeneruj Ponownie AI' : 'Generuj Odprawę AI'}
          </BkpkButton>}
        </div>
      </div>

      {/* Karta Główna Odprawy (Print & Screen ready) */}
      {!briefing ? (
        <BkpkCard variant="glass" className="text-center py-16">
          <Shield className="w-12 h-12 text-bkpk-text-muted mx-auto mb-3" />
          <h4 className="font-display uppercase text-[20px] leading-tight text-bkpk-text-primary mb-2">
            Odprawa na mecz z {opponent} jeszcze nie jest gotowa
          </h4>
          <p className="text-[14px] text-bkpk-text-muted max-w-md mx-auto mb-6">
            {canGenerate
              ? 'Przycisk poniżej przygotuje 3 kluczowe założenia, wyjściową piątkę i krycie indywidualne na podstawie scoutingu.'
              : 'Odprawa pojawi się tutaj, gdy trener ją przygotuje.'}
          </p>
          {canGenerate && (
            <BkpkButton variant="primary" onClick={() => handleGenerate(false)} loading={generating}>
              <Sparkles className="w-4 h-4 mr-2" />
              Przygotuj Odprawę Przedmeczową
            </BkpkButton>
          )}
        </BkpkCard>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="print:bg-white print:text-black print:p-6"
        >
          <BkpkCard
            variant="glass"
            className="p-6 sm:p-8 border-t-[3px] border-t-bkpk-primary relative overflow-hidden"
          >
            {/* Nagłówek Wizualny */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-bkpk-border-strong">
              <div>
                <span className="kicker mb-3">
                  KALK Dywizja II • Odprawa przedmeczowa
                </span>
                <h2 className="text-[32px] sm:text-[44px] leading-[0.95] text-bkpk-text-primary">
                  BEKAPAKA <span className="text-bkpk-primary">vs</span> {briefing.opponentName}
                </h2>
              </div>

              {/* Informacje Logistyczne */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[14px] w-full sm:w-auto bg-bkpk-surface-tint-1 p-3 border border-bkpk-border-subtle">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-bkpk-text-muted shrink-0" />
                  <div>
                    <span className="label-caps text-[11px] text-bkpk-text-muted block">Data</span>
                    <span className="font-bold text-bkpk-text-primary">
                      {logistics?.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-bkpk-text-muted shrink-0" />
                  <div>
                    <span className="label-caps text-[11px] text-bkpk-text-muted block">Zbiórka / Mecz</span>
                    <span className="font-bold text-bkpk-text-primary tabular-nums">
                      {logistics?.gathering} / {logistics?.tipoff}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-bkpk-text-muted shrink-0" />
                  <div>
                    <span className="label-caps text-[11px] text-bkpk-text-muted block">Stroje</span>
                    <span className="font-bold text-bkpk-text-primary">{logistics?.kit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-bkpk-text-muted shrink-0" />
                  <div>
                    <span className="label-caps text-[11px] text-bkpk-text-muted block">Hala</span>
                    <span className="font-bold text-bkpk-text-primary truncate max-w-[120px]">
                      {logistics?.venue}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Kluczowe Założenia Taktyczne */}
            <div className="my-8">
              <h3 className="text-[20px] sm:text-[22px] leading-tight text-bkpk-text-primary mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-bkpk-primary shrink-0" />
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
                        "p-4 border border-bkpk-border-subtle border-t-[3px] bg-bkpk-surface-tint-1 relative overflow-hidden flex flex-col justify-between",
                        isDefense
                          ? "border-t-brand-stone-200"
                          : isOffense
                            ? "border-t-brand-red-500"
                            : "border-t-brand-green-400"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="w-8 h-8 bg-bkpk-primary text-brand-white text-[18px] flex items-center justify-center font-display tabular-nums">
                            {key.number}
                          </span>
                          <span
                            className={cn(
                              "status-flag",
                              isDefense
                                ? "text-brand-stone-200"
                                : isOffense
                                  ? "text-brand-red-300"
                                  : "text-brand-green-400"
                            )}
                          >
                            {key.focus || 'Taktyka'}
                          </span>
                        </div>
                        <h4 className="font-display uppercase text-[18px] leading-tight text-bkpk-text-primary mb-1.5">{key.title}</h4>
                        <p className="text-[13px] text-bkpk-text-secondary leading-relaxed">{key.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wyjściowa Piątka & Krycie Indywidualne */}
            <div className="my-8">
              <h3 className="text-[20px] sm:text-[22px] leading-tight text-bkpk-text-primary mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-bkpk-primary shrink-0" />
                Wyjściowa Piątka &amp; Zadania Indywidualne (Matchup Assignments)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {briefing.startingFive?.map((player) => (
                  <div
                    key={player.position}
                    className="p-3.5 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="status-flag text-bkpk-primary">
                          {player.position}
                        </span>
                        {player.number != null && (
                          <span className="text-[16px] text-bkpk-text-muted font-display tabular-nums">
                            #{player.number}
                          </span>
                        )}
                      </div>
                      <span className="text-[14px] font-semibold text-bkpk-text-primary block truncate mb-2">
                        {player.name}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-bkpk-border-subtle">
                      <span className="label-caps text-[11px] text-bkpk-text-muted block mb-0.5">
                        Zadanie / Krycie:
                      </span>
                      <p className="text-[13px] text-bkpk-text-secondary leading-snug">
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
                <div className="p-4 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                  <span className="label-caps text-[11px] text-bkpk-text-muted block mb-1">
                    ⚡ Rola Ławki Rezerwowych
                  </span>
                  <p className="text-[13px] text-bkpk-text-secondary leading-relaxed">
                    {briefing.benchKeys}
                  </p>
                </div>
              )}

              {briefing.motivationalMotto && (
                <div className="p-4 border border-bkpk-border-subtle border-l-[3px] border-l-bkpk-primary flex items-center gap-3">
                  <Zap className="w-5 h-5 text-bkpk-primary shrink-0" />
                  <div>
                    <span className="label-caps text-[11px] text-bkpk-primary block mb-0.5">
                      Motto Meczowe
                    </span>
                    <p className="text-[15px] font-semibold text-bkpk-text-primary italic">
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
