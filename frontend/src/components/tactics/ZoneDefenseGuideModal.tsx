import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  BookOpen,
  X,
  Target,
  Compass,
  ArrowRight,
  Sparkles,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton from '../../shared/ui/BkpkButton';
import { cn } from '../../shared/lib/utils';

interface ZoneDefenseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialZoneType?: '2-3' | '3-2';
}

export default function ZoneDefenseGuideModal({
  isOpen,
  onClose,
  initialZoneType = '2-3'
}: ZoneDefenseGuideModalProps) {
  const [selectedZone, setSelectedZone] = useState<'2-3' | '3-2'>(initialZoneType);
  const [activeScenario, setActiveScenario] = useState<'top' | 'wing' | 'corner' | 'high_post'>('top');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-bkpk-surface border border-bkpk-border-strong rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-bkpk-border-subtle bg-bkpk-surface-tint-1 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block font-outfit">
                  Podręcznik Taktyczny Obrony
                </span>
                <h2 className="text-lg sm:text-xl font-black text-bkpk-text-primary uppercase font-outfit tracking-tight">
                  Zasady Poruszania się po Strefie (Dla Nowicjusza)
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Przełącznik Systemu Strefy (2-3 vs 3-2) */}
          <div className="p-4 sm:px-6 bg-bkpk-surface-tint-2 border-b border-bkpk-border-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedZone('2-3')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 min-h-[38px]",
                  selectedZone === '2-3'
                    ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                    : "bg-bkpk-surface text-bkpk-text-muted hover:text-bkpk-text-primary border border-bkpk-border-subtle"
                )}
              >
                <Layers className="w-4 h-4" />
                Obrona Strefowa 2-3
              </button>

              <button
                onClick={() => setSelectedZone('3-2')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 min-h-[38px]",
                  selectedZone === '3-2'
                    ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    : "bg-bkpk-surface text-bkpk-text-muted hover:text-bkpk-text-primary border border-bkpk-border-subtle"
                )}
              >
                <Target className="w-4 h-4" />
                Obrona Strefowa 3-2
              </button>
            </div>

            <span className="text-[11px] font-bold text-bkpk-text-muted">
              {selectedZone === '2-3' ? '🛡️ Ochrona trumny & zbiórka' : '🎯 Blokada rzutów za 3 punkty'}
            </span>
          </div>

          {/* Treść Przewodnika (Scrollable) */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* 1. Złota Zasada */}
            <div className={cn(
              "p-4 rounded-2xl border flex items-start gap-3.5",
              selectedZone === '2-3'
                ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                : "bg-blue-500/10 border-blue-500/30 text-blue-200"
            )}>
              <Zap className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black uppercase tracking-wider text-sm mb-1 font-outfit text-white">
                  {selectedZone === '2-3'
                    ? 'Złota Zasada Strefy 2-3: Piłka Rządzi Całą Piątką (Ball-You-Man)'
                    : 'Złota Zasada Strefy 3-2: Zero Czystych Rzutów za 3 (Perimeter Wall)'}
                </h4>
                <p className="text-bkpk-text-secondary leading-relaxed">
                  {selectedZone === '2-3'
                    ? 'W strefie 2-3 NIE kryjesz pustego parkietu! Wszyscy 5 obrońcy przesuwają się synchronicznie jak jeden organizm w kierunku piłki. Zawsze widzisz piłkę i swojego atakującego w strefie (Zasada Ball-You-Man).'
                    : 'W strefie 3-2 trójka górna (D1, D2, D3) tworzy nieprzenikniony, falujący mur wzdłuż całej linii 6.75m. Żaden rywal nie ma prawa oddać czystego rzutu bez natychmiastowego doskoku (Closeout z ręką w górze).'}
                </p>
              </div>
            </div>

            {/* 2. Symulator Reakcji na Pozycję Piłki po Obwodzie */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black uppercase tracking-wider text-sm font-outfit text-bkpk-text-primary flex items-center gap-2">
                  <Compass className="w-4 h-4 text-bkpk-primary" />
                  Gdzie jest piłka? (Instrukcja Ruchu dla Każdej Pozycji)
                </h3>
              </div>

              {/* Przyciski Wyboru Pozycji Piłki */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'top', label: '1. Piłka na Szczycie' },
                  { id: 'wing', label: '2. Piłka na Prawym Skrzydle' },
                  { id: 'corner', label: '3. Piłka w Prawym Rogu' },
                  { id: 'high_post', label: '4. Piłka w Środku (High Post)' }
                ].map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setActiveScenario(sc.id as any)}
                    className={cn(
                      "p-2.5 rounded-xl text-left border transition-all min-h-[44px]",
                      activeScenario === sc.id
                        ? "bg-bkpk-surface-tint-2 border-bkpk-primary text-bkpk-primary font-black shadow-sm"
                        : "bg-bkpk-surface-tint-1 border-bkpk-border-subtle text-bkpk-text-muted hover:text-bkpk-text-primary"
                    )}
                  >
                    <div className="text-[10px] uppercase font-bold text-bkpk-text-muted mb-0.5">Scenariusz</div>
                    <div className="text-xs font-bold truncate">{sc.label}</div>
                  </button>
                ))}
              </div>

              {/* Karta Ruchu Obrońców dla Wybranego Scenariusza */}
              <BkpkCard variant="glass" className="p-4 sm:p-5 border-bkpk-border-strong space-y-4">
                {selectedZone === '2-3' ? (
                  <>
                    {activeScenario === 'top' && (
                      <div className="space-y-3">
                        <div className="font-bold text-rose-400 uppercase text-xs">
                          🏀 Piłka na Szczycie (Top of the Key):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-blue-400">D1 & D2 (Górna Linia):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Jeden z obrońców (D1 lub D2) wywiera presję On-Ball na kozłującym. Drugi asekuruje linię rzutów wolnych (Nail), zamykając wjazd do środka.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-pink-400">D3 & D4 (Dolne Skrzydła):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Ustawieni na wysokości dolnych bloków. Gotowi do sprintu w skrzydło, gdy poleci podanie.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle sm:col-span-2">
                            <span className="font-black text-purple-400">D5 (Środkowy):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Kotwica w centrum trumny pod koszem. Komunikuje głośno zasłony i rozstawienie rywali.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'wing' && (
                      <div className="space-y-3">
                        <div className="font-bold text-rose-400 uppercase text-xs">
                          🏀 Piłka na Prawym Skrzydle (Right Wing):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-blue-400">D2 (Doskok do Skrzydła):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Atakuje piłkę w niskiej postawie. Ręce w górze odcinają rzut i korytarz wzdłuż linii bocznej.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-blue-400">D1 (Zejście na Nail):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Schodzi na środek linii rzutów wolnych (Nail). Odcina podanie do gracza na łokciu.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-pink-400">D4 (Podbicie wyżej) & D5 (Prawy Blok):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              D4 podchodzi pod linię rzutu, a D5 przesuwa się na prawy blok pod koszem.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-pink-400">D3 (Weak-Side Drop):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Zbiega głęboko pod kosz, zabezpieczając ścięcia za plecami D5 i zbiórkę z dystansu.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'corner' && (
                      <div className="space-y-3">
                        <div className="font-bold text-rose-400 uppercase text-xs">
                          🏀 Piłka w Prawym Rogu (Corner Trap):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-pink-400">D4 (Zamknięcie Rogu):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Sprintuje w róg z rękami w górze. Blokuje rzut za 3 bez skakania w przód.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-purple-400">D5 (Odcięcie Linii Końcowej):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Doskakuje do linii końcowej, uniemożliwiając wjazd pod kosz wzdłuż autu.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-blue-400">D2 (Zejście na Prawy Łokieć):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Opada na łokieć trumny, odcinając podanie zwrotne na skrzydło.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-pink-400">D1 & D3 (Zabezpieczenie Kosza):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Pilnują środka i przeciwnego skrzydła przed podaniami typu skip pass.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'high_post' && (
                      <div className="space-y-3">
                        <div className="font-bold text-rose-400 uppercase text-xs">
                          ⚠️ Piłka w High Post (Najgroźniejszy punkt dla Strefy 2-3):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 sm:col-span-2">
                            <span className="font-black text-amber-300">Zasada Sandwich (Podwójne Zaciśnięcie):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Gdy rywal otrzyma piłkę na linii rzutów wolnych (High Post), D1/D2 naciskają z góry, a D5 doskakuje od dołu. Obrońcy D3 i D4 natychmiast zamykają linie do rogów!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {activeScenario === 'top' && (
                      <div className="space-y-3">
                        <div className="font-bold text-blue-400 uppercase text-xs">
                          🏀 Piłka na Szczycie (Top of the Key):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-blue-400">D1 (Presja na Szczycie):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Wysoko na łuku 3PT. Nie pozwala na łatwy rzut ze szczytu.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-blue-400">D2 & D3 (Skrzydła 3PT):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Rozstawieni szeroko na skrzydłach na linii 6.75m. Gotowi do błyskawicznego doskoku.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle sm:col-span-2">
                            <span className="font-black text-amber-400">D4 & D5 (Dolna Dwójka):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Stoją po obu stronach trumny (bloki). Kontrolują wbiegających i zabezpieczają deskę.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'wing' && (
                      <div className="space-y-3">
                        <div className="font-bold text-blue-400 uppercase text-xs">
                          🏀 Piłka na Prawym Skrzydle (Right Wing):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-blue-400">D2 (Agresywny Closeout):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Doskakuje do strzelca z wyciągniętą ręką. Wymusza podanie lub trudny koźle w środek.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-blue-400">D1 (Prawy Łokieć):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Schodzi na prawy łokieć trumny, blokując wjazd w kierunku środka boiska.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-blue-400">D3 (Środek Obwodu):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Przesuwa się w stronę szczytu, odcinając łatwe podanie powrotne.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-amber-400">D4 & D5 (Rotacja Pod Koszem):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              D4 wychodzi w stronę prawego narożnika, a D5 przesuwa się pod samą obręcz.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'corner' && (
                      <div className="space-y-3">
                        <div className="font-bold text-blue-400 uppercase text-xs">
                          🏀 Piłka w Prawym Rogu (Corner Rotation):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-amber-400">D4 (Wyjście do Rogu):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Wychodzi z pomalowanego w róg, by zablokować trójkę.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-black text-amber-400">D5 (Obrona Obręczy):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Zostaje jedynym obrońcą pod koszem. Zastawia pozycję przeciwko centrowi rywali.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle sm:col-span-2">
                            <span className="font-black text-blue-400">D2 & D1 (Zejście w Głąb):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              D2 cofa się do prawego łokcia, D1 zabezpiecza linię rzutów wolnych.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'high_post' && (
                      <div className="space-y-3">
                        <div className="font-bold text-blue-400 uppercase text-xs">
                          🏀 Piłka w High Post:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle sm:col-span-2">
                            <span className="font-black text-blue-400">Zaciśnięcie Trójki:</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              D1, D2 i D3 natychmiast opadają w stronę piłki, podczas gdy D4 i D5 nie pozwalają na podanie lobem za plecy.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </BkpkCard>
            </div>

            {/* 3. Kluczowe Zasady: Bump & Pass oraz Komunikacja */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle space-y-2">
                <div className="flex items-center gap-2 text-bkpk-primary font-black uppercase text-xs font-outfit">
                  <CheckCircle2 className="w-4 h-4" />
                  Zasada &quot;Bump &amp; Pass&quot; (Przekazywanie Gracza)
                </div>
                <p className="text-bkpk-text-secondary text-[11px] leading-relaxed">
                  Gdy atakujący bez piłki ścina przez twoją strefę: nie biegnij za nim po całym boisku! Wykonaj lekki, legalny kontakt klatką piersiową (<strong>Bump</strong>), zwalniając jego bieg, a następnie głośno przekaż go (<strong>Pass-off</strong>) koledze z sąsiedniej strefy.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-bkpk-surface-tint-1 border border-bkpk-border-subtle space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-black uppercase text-xs font-outfit">
                  <AlertTriangle className="w-4 h-4" />
                  Zbiórka Defensywna (Box-Out w Strefie)
                </div>
                <p className="text-bkpk-text-secondary text-[11px] leading-relaxed">
                  W strefie nie masz przypisanego konkretnego rywala do zbiórki. W momencie rzutu każdy obrońca natychmiast szuka najbliższego atakującego w swoim sektorze, odwraca się tyłem (<strong>Box-Out</strong>) i nie pozwala na dobitkę.
                </p>
              </div>
            </div>

            {/* 4. Porównanie Kiedy Stosować 2-3 vs 3-2 */}
            <div className="p-4 rounded-2xl bg-bkpk-surface-tint-2 border border-bkpk-border-strong space-y-2">
              <h4 className="font-black uppercase tracking-wider text-xs text-bkpk-text-primary font-outfit">
                Kiedy wybrać Strefę 2-3, a kiedy Strefę 3-2?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <span className="font-bold text-rose-400 block mb-1">🛡️ Wybierz Strefę 2-3 gdy:</span>
                  <ul className="list-disc list-inside space-y-1 text-bkpk-text-muted">
                    <li>Rywal ma silnych graczy podkoszowych</li>
                    <li>Chcesz całkowicie zamknąć wjazdy w pomalowane</li>
                    <li>Potrzebujesz dominacji na zbiórce defensywnej</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <span className="font-bold text-blue-400 block mb-1">🎯 Wybierz Strefę 3-2 gdy:</span>
                  <ul className="list-disc list-inside space-y-1 text-bkpk-text-muted">
                    <li>Rywal rzuca seryjnie za 3 punkty (5-Out / Spacing)</li>
                    <li>Przeciwnik nie ma dominującego środkowego</li>
                    <li>Chcesz wymusić trudne podania i straty na obwodzie</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-bkpk-surface-tint-1 border-t border-bkpk-border-subtle flex items-center justify-between shrink-0">
            <span className="text-[11px] text-bkpk-text-muted">
              Wskazówka: Włącz przycisk <strong>Strefy [WŁ]</strong> w odtwarzaczu, aby widzieć sektory na żywo!
            </span>
            <BkpkButton variant="primary" size="sm" onClick={onClose}>
              Rozumiem, przejdź do animacji
            </BkpkButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
