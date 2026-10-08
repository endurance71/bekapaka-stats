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
  AlertTriangle,
  Play
} from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton, { bkpkActivePillClass } from '../../shared/ui/BkpkButton';
import { cn } from '../../shared/lib/utils';

// Paleta Digital 2.0 — mini-boisko SVG (wartości zgodne z tokens.css, --c-*).
// Obrońcy = stone (linia górna jaśniejsza, dolna ciemniejsza) + etykieta D1–D5, piłka = złoto.
const ZONE_GUIDE_PALETTE = {
  floor: '#121212', // ink-900
  line: 'rgba(247, 246, 242, 0.24)',
  lineKey: 'rgba(247, 246, 242, 0.45)',
  lineFreeThrow: 'rgba(247, 246, 242, 0.6)',
  lineThree: 'rgba(247, 246, 242, 0.6)',
  paint: '#1F1E1C', // ink-700
  backboard: '#F7F6F2',
  rim: '#EF1734', // red-500
  zoneFill: 'rgba(216, 212, 204, 0.06)',
  zoneStroke: 'rgba(216, 212, 204, 0.4)',
  zoneLabel: '#9C978F', // stone-400
  vector: 'rgba(247, 246, 242, 0.3)',
  ball: '#F4A816', // gold-500
  ballStroke: '#0B0B0B',
  ballRing: 'rgba(244, 168, 22, 0.5)',
  frontLine: '#D8D4CC', // stone-200
  backLine: '#9C978F', // stone-400
  tokenFill: '#1F1E1C', // ink-700
  tagBg: 'rgba(11, 11, 11, 0.92)',
  tagText: '#F7F6F2',
} as const;

const ZONE_GUIDE_FONT = '"Barlow Condensed", "Barlow", sans-serif';

interface ZoneDefenseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialZoneType?: '2-3' | '3-2';
}

interface DefenderState {
  id: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  role: string;
  color: string;
}

const SCENARIO_CONFIGS_2_3: Record<string, { ball: { x: number; y: number }; defenders: DefenderState[] }> = {
  top: {
    ball: { x: 50, y: 80 },
    defenders: [
      { id: 'D1', x: 44, y: 72, baseX: 30, baseY: 70, role: 'ON-BALL', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D2', x: 56, y: 62, baseX: 70, baseY: 70, role: 'NAIL HELP', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D3', x: 22, y: 32, baseX: 20, baseY: 25, role: 'LEWY BLOK', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D4', x: 78, y: 32, baseX: 80, baseY: 25, role: 'PRAWY BLOK', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D5', x: 50, y: 24, baseX: 50, baseY: 25, role: 'OBRĘCZ & DESKA', color: ZONE_GUIDE_PALETTE.backLine }
    ]
  },
  wing: {
    ball: { x: 82, y: 64 },
    defenders: [
      { id: 'D1', x: 50, y: 58, baseX: 30, baseY: 70, role: 'NAIL HELP', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D2', x: 76, y: 62, baseX: 70, baseY: 70, role: 'CLOSEOUT SKRZYDŁO', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D3', x: 34, y: 20, baseX: 20, baseY: 25, role: 'WEAK-SIDE DROP', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D4', x: 80, y: 44, baseX: 80, baseY: 25, role: 'PODBICIE W SKRZYDŁO', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D5', x: 60, y: 22, baseX: 50, baseY: 25, role: 'PRAWY BLOK', color: ZONE_GUIDE_PALETTE.backLine }
    ]
  },
  corner: {
    ball: { x: 90, y: 16 },
    defenders: [
      { id: 'D1', x: 46, y: 52, baseX: 30, baseY: 70, role: 'ŚRODEK', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D2', x: 68, y: 46, baseX: 70, baseY: 70, role: 'PRAWY ŁOKIEĆ', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D3', x: 36, y: 20, baseX: 20, baseY: 25, role: 'WEAK-SIDE DROP', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D4', x: 88, y: 20, baseX: 80, baseY: 25, role: 'ZAMKNIĘCIE ROGU', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D5', x: 62, y: 18, baseX: 50, baseY: 25, role: 'ODCIĘCIE LINII', color: ZONE_GUIDE_PALETTE.backLine }
    ]
  },
  high_post: {
    ball: { x: 50, y: 52 },
    defenders: [
      { id: 'D1', x: 44, y: 58, baseX: 30, baseY: 70, role: 'SANDWICH GÓRA', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D2', x: 56, y: 58, baseX: 70, baseY: 70, role: 'SANDWICH GÓRA', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D3', x: 22, y: 28, baseX: 20, baseY: 25, role: 'ODCIĘCIE ROGU', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D4', x: 78, y: 28, baseX: 80, baseY: 25, role: 'ODCIĘCIE ROGU', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D5', x: 50, y: 38, baseX: 50, baseY: 25, role: 'SANDWICH DÓŁ', color: ZONE_GUIDE_PALETTE.backLine }
    ]
  }
};

const SCENARIO_CONFIGS_3_2: Record<string, { ball: { x: number; y: number }; defenders: DefenderState[] }> = {
  top: {
    ball: { x: 50, y: 82 },
    defenders: [
      { id: 'D1', x: 50, y: 75, baseX: 50, baseY: 78, role: 'ON-BALL SZCZYT', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D2', x: 72, y: 66, baseX: 78, baseY: 60, role: 'MUR PRAWE SKRZYDŁO', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D3', x: 28, y: 66, baseX: 22, baseY: 60, role: 'MUR LEWE SKRZYDŁO', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D4', x: 64, y: 26, baseX: 70, baseY: 22, role: 'PRAWY DÓŁ', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D5', x: 36, y: 26, baseX: 30, baseY: 22, role: 'LEWY DÓŁ', color: ZONE_GUIDE_PALETTE.backLine }
    ]
  },
  wing: {
    ball: { x: 82, y: 62 },
    defenders: [
      { id: 'D1', x: 62, y: 70, baseX: 50, baseY: 78, role: 'PRAWY ŁOKIEĆ', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D2', x: 76, y: 60, baseX: 78, baseY: 60, role: 'AGRESYWNY CLOSEOUT', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D3', x: 38, y: 58, baseX: 22, baseY: 60, role: 'ŚRODEK OBWODU', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D4', x: 68, y: 24, baseX: 70, baseY: 22, role: 'WYJŚCIE W RÓG', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D5', x: 46, y: 20, baseX: 30, baseY: 22, role: 'OBRONA OBRĘCZY', color: ZONE_GUIDE_PALETTE.backLine }
    ]
  },
  corner: {
    ball: { x: 90, y: 16 },
    defenders: [
      { id: 'D1', x: 56, y: 68, baseX: 50, baseY: 78, role: 'LINIA WOLNYCH', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D2', x: 76, y: 48, baseX: 78, baseY: 60, role: 'PRAWY ŁOKIEĆ', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D3', x: 36, y: 50, baseX: 22, baseY: 60, role: 'ŚRODEK TRUMNY', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D4', x: 88, y: 20, baseX: 70, baseY: 22, role: 'ZAMKNIĘCIE ROGU', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D5', x: 50, y: 18, baseX: 30, baseY: 22, role: 'OBRONA OBRĘCZY', color: ZONE_GUIDE_PALETTE.backLine }
    ]
  },
  high_post: {
    ball: { x: 50, y: 52 },
    defenders: [
      { id: 'D1', x: 50, y: 60, baseX: 50, baseY: 78, role: 'ZACIŚNIĘCIE GÓRA', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D2', x: 66, y: 56, baseX: 78, baseY: 60, role: 'ZACIŚNIĘCIE SKRZYDŁO', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D3', x: 34, y: 56, baseX: 22, baseY: 60, role: 'ZACIŚNIĘCIE SKRZYDŁO', color: ZONE_GUIDE_PALETTE.frontLine },
      { id: 'D4', x: 60, y: 24, baseX: 70, baseY: 22, role: 'ODCIĘCIE POD KOSZEM', color: ZONE_GUIDE_PALETTE.backLine },
      { id: 'D5', x: 40, y: 24, baseX: 30, baseY: 22, role: 'ODCIĘCIE POD KOSZEM', color: ZONE_GUIDE_PALETTE.backLine }
    ]
  }
};

export default function ZoneDefenseGuideModal({
  isOpen,
  onClose,
  initialZoneType = '2-3'
}: ZoneDefenseGuideModalProps) {
  const [selectedZone, setSelectedZone] = useState<'2-3' | '3-2'>(initialZoneType);
  const [activeScenario, setActiveScenario] = useState<'top' | 'wing' | 'corner' | 'high_post'>('top');

  if (!isOpen) return null;

  const currentConfig = selectedZone === '2-3'
    ? SCENARIO_CONFIGS_2_3[activeScenario]
    : SCENARIO_CONFIGS_3_2[activeScenario];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-bkpk-overlay-strong">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-bkpk-surface border border-bkpk-border-strong shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-bkpk-border-subtle bg-bkpk-surface-tint-1 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-bkpk-border-strong flex items-center justify-center text-bkpk-primary shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="kicker">
                  Podręcznik Taktyczny &amp; Symulator Ruchu
                </span>
                <h2 className="text-[22px] sm:text-[26px] leading-tight text-bkpk-text-primary">
                  Zasady Poruszania się po Strefie (Dla Nowicjusza)
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 border border-transparent text-bkpk-text-muted hover:text-bkpk-text-primary hover:border-bkpk-border-strong transition-colors"
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
                  "px-4 py-2 label-caps text-[12px] transition-colors flex items-center gap-2 min-h-[44px] border",
                  selectedZone === '2-3'
                    ? bkpkActivePillClass
                    : "bg-transparent text-bkpk-text-muted hover:text-bkpk-text-primary border-bkpk-border-strong"
                )}
              >
                <Layers className="w-4 h-4" />
                Obrona Strefowa 2-3
              </button>

              <button
                onClick={() => setSelectedZone('3-2')}
                className={cn(
                  "px-4 py-2 label-caps text-[12px] transition-colors flex items-center gap-2 min-h-[44px] border",
                  selectedZone === '3-2'
                    ? bkpkActivePillClass
                    : "bg-transparent text-bkpk-text-muted hover:text-bkpk-text-primary border-bkpk-border-strong"
                )}
              >
                <Target className="w-4 h-4" />
                Obrona Strefowa 3-2
              </button>
            </div>

            <span className="text-[13px] font-semibold text-bkpk-text-secondary">
              {selectedZone === '2-3' ? '🛡️ Ochrona trumny & zbiórka' : '🎯 Blokada rzutów za 3 punkty'}
            </span>
          </div>

          {/* Treść Przewodnika (Scrollable) */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
            {/* 1. Złota Zasada */}
            <div className="p-4 border border-bkpk-border-subtle border-l-[3px] border-l-bkpk-primary bg-bkpk-surface-tint-1 text-bkpk-primary flex items-start gap-3.5">
              <Zap className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="uppercase text-[17px] leading-tight mb-1 font-display text-bkpk-text-primary">
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

            {/* 2. INTERAKTYWNY ANIMOWANY SYMULATOR BOISKA (MINI-COURT) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] sm:text-[20px] leading-tight text-bkpk-text-primary flex items-center gap-2">
                  <Compass className="w-4 h-4 text-bkpk-primary" />
                  Symulator Przesunięć: Wybierz Gdzie Znajduje się Piłka
                </h3>
              </div>

              {/* Przyciski Wyboru Pozycji Piłki */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'top', label: '1. Piłka na Szczycie' },
                  { id: 'wing', label: '2. Piłka na Skrzydle' },
                  { id: 'corner', label: '3. Piłka w Rogu' },
                  { id: 'high_post', label: '4. Piłka na linii wolnych' }
                ].map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setActiveScenario(sc.id as any)}
                    className={cn(
                      "p-2.5 text-left border transition-colors min-h-[44px]",
                      activeScenario === sc.id
                        ? "bg-bkpk-surface-tint-2 border-bkpk-primary text-bkpk-text-primary"
                        : "bg-transparent border-bkpk-border-subtle text-bkpk-text-muted hover:text-bkpk-text-primary hover:border-bkpk-border-strong"
                    )}
                  >
                    <div className="label-caps text-[11px] text-bkpk-text-muted mb-0.5">Scenariusz</div>
                    <div className="text-[13px] font-semibold truncate">{sc.label}</div>
                  </button>
                ))}
              </div>

              {/* Wektorowe Animowane Boisko 2D w Modalu */}
              <div className="relative w-full aspect-[16/10] max-w-[650px] mx-auto bg-brand-black border border-bkpk-border-strong overflow-hidden p-2">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Tło parkietu */}
                  <rect x="0" y="0" width="100" height="100" fill={ZONE_GUIDE_PALETTE.floor} />

                  {/* Linie boiska FIBA */}
                  <rect x="4" y="4" width="92" height="92" fill="none" stroke={ZONE_GUIDE_PALETTE.line} strokeWidth="0.8" />
                  
                  {/* Trumna */}
                  <rect x="33" y="4" width="34" height="38" fill={ZONE_GUIDE_PALETTE.paint} stroke={ZONE_GUIDE_PALETTE.lineKey} strokeWidth="0.8" />
                  <line x1="33" y1="42" x2="67" y2="42" stroke={ZONE_GUIDE_PALETTE.lineFreeThrow} strokeWidth="0.8" />
                  <circle cx="50" cy="42" r="12" fill="none" stroke={ZONE_GUIDE_PALETTE.lineKey} strokeWidth="0.8" />

                  {/* Tablica i obręcz */}
                  <line x1="44" y1="8" x2="56" y2="8" stroke={ZONE_GUIDE_PALETTE.backboard} strokeWidth="1.2" />
                  <circle cx="50" cy="12.5" r="3" fill="none" stroke={ZONE_GUIDE_PALETTE.rim} strokeWidth="1" />

                  {/* Łuk 3PT */}
                  <path d="M 12 4 L 12 28 A 38 38 0 0 0 88 28 L 88 4" fill="none" stroke={ZONE_GUIDE_PALETTE.lineThree} strokeWidth="0.8" />

                  {/* Poligony Stref w Tle */}
                  {selectedZone === '2-3' ? (
                    <>
                      {/* D1/D2 Top */}
                      <rect x="6" y="50" width="44" height="42" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      <rect x="50" y="50" width="44" height="42" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      {/* D3/D4 Bottom Wings */}
                      <rect x="4" y="4" width="32" height="46" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      <rect x="64" y="4" width="32" height="46" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      {/* D5 Center */}
                      <rect x="36" y="4" width="28" height="46" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      {/* Etykiety sektorów (rozróżnienie stref bez kolorów) */}
                      <g fill={ZONE_GUIDE_PALETTE.zoneLabel} fontSize="2.6" fontWeight="800" fontFamily={ZONE_GUIDE_FONT}>
                        <text x="8" y="90">D1</text>
                        <text x="92" y="90" textAnchor="end">D2</text>
                        <text x="6" y="48">D3</text>
                        <text x="94" y="48" textAnchor="end">D4</text>
                        <text x="50" y="48" textAnchor="middle">D5</text>
                      </g>
                    </>
                  ) : (
                    <>
                      {/* 3-2 Zones */}
                      <rect x="30" y="64" width="40" height="30" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      <rect x="64" y="38" width="32" height="42" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      <rect x="4" y="38" width="32" height="42" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      <rect x="50" y="4" width="46" height="34" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      <rect x="4" y="4" width="46" height="34" fill={ZONE_GUIDE_PALETTE.zoneFill} stroke={ZONE_GUIDE_PALETTE.zoneStroke} strokeDasharray="2,2" strokeWidth="0.6" />
                      {/* Etykiety sektorów (rozróżnienie stref bez kolorów) */}
                      <g fill={ZONE_GUIDE_PALETTE.zoneLabel} fontSize="2.6" fontWeight="800" fontFamily={ZONE_GUIDE_FONT}>
                        <text x="50" y="92" textAnchor="middle">D1</text>
                        <text x="94" y="78" textAnchor="end">D2</text>
                        <text x="6" y="78">D3</text>
                        <text x="94" y="36" textAnchor="end">D4</text>
                        <text x="6" y="36">D5</text>
                      </g>
                    </>
                  )}

                  {/* Animowane Wektory Przesunięć Obrońców */}
                  {currentConfig.defenders.map((d) => (
                    <motion.line
                      key={`line-${d.id}`}
                      initial={false}
                      animate={{ x1: d.baseX, y1: d.baseY, x2: d.x, y2: d.y }}
                      transition={{ type: 'spring', damping: 20, stiffness: 160 }}
                      stroke={ZONE_GUIDE_PALETTE.vector}
                      strokeWidth="0.6"
                      strokeDasharray="1.5,1.5"
                    />
                  ))}

                  {/* Animowana Piłka */}
                  <motion.g
                    initial={false}
                    animate={{ cx: currentConfig.ball.x, cy: currentConfig.ball.y }}
                    transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                  >
                    <circle cx={currentConfig.ball.x} cy={currentConfig.ball.y} r="3.2" fill={ZONE_GUIDE_PALETTE.ball} stroke={ZONE_GUIDE_PALETTE.ballStroke} strokeWidth="0.8" />
                    <circle cx={currentConfig.ball.x} cy={currentConfig.ball.y} r="5.5" fill="none" stroke={ZONE_GUIDE_PALETTE.ballRing} strokeWidth="0.6" />
                  </motion.g>

                  {/* Animowani Obrońcy (D1-D5) */}
                  {currentConfig.defenders.map((d) => (
                    <motion.g
                      key={d.id}
                      initial={false}
                      animate={{ x: d.x, y: d.y }}
                      transition={{ type: 'spring', damping: 20, stiffness: 160 }}
                    >
                      {/* Kółko gracza */}
                      <circle cx={0} cy={0} r="3.8" fill={ZONE_GUIDE_PALETTE.tokenFill} stroke={d.color} strokeWidth="0.8" />
                      <text
                        x={0}
                        y={0.9}
                        fill={d.color}
                        fontSize="3"
                        fontWeight="800"
                        fontFamily={ZONE_GUIDE_FONT}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {d.id}
                      </text>

                      {/* Etykieta roli nad graczem */}
                      <g transform="translate(0, -6.5)">
                        <rect x="-14" y="-2.5" width="28" height="5" rx="1.5" fill={ZONE_GUIDE_PALETTE.tagBg} stroke={d.color} strokeWidth="0.4" />
                        <text
                          x={0}
                          y={0.6}
                          fill={ZONE_GUIDE_PALETTE.tagText}
                          fontSize="2.2"
                          fontWeight="800"
                          fontFamily={ZONE_GUIDE_FONT}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {d.role}
                        </text>
                      </g>
                    </motion.g>
                  ))}
                </svg>
              </div>

              {/* Karta Ruchu Obrońców dla Wybranego Scenariusza */}
              <BkpkCard variant="glass" className="p-4 sm:p-5 space-y-4">
                {selectedZone === '2-3' ? (
                  <>
                    {activeScenario === 'top' && (
                      <div className="space-y-3">
                        <div className="kicker">
                          🏀 Piłka na Szczycie (Top of the Key):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D1 & D2 (Górna Linia):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Jeden z obrońców (D1 lub D2) wywiera presję On-Ball na kozłującym. Drugi asekuruje linię rzutów wolnych (Nail), zamykając wjazd do środka.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D3 & D4 (Dolne Skrzydła):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Ustawieni na wysokości dolnych bloków. Gotowi do sprintu w skrzydło, gdy poleci podanie.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle sm:col-span-2">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D5 (Środkowy):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Kotwica w centrum trumny pod koszem. Komunikuje głośno zasłony i rozstawienie rywali.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'wing' && (
                      <div className="space-y-3">
                        <div className="kicker">
                          🏀 Piłka na Prawym Skrzydle (Right Wing):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D2 (Doskok do Skrzydła):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Atakuje piłkę w niskiej postawie. Ręce w górze odcinają rzut i korytarz wzdłuż linii bocznej.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D1 (Zejście na Nail):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Schodzi na środek linii rzutów wolnych (Nail). Odcina podanie do gracza na łokciu.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D4 (Podbicie wyżej) & D5 (Prawy Blok):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              D4 podchodzi pod linię rzutu, a D5 przesuwa się na prawy blok pod koszem.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D3 (Weak-Side Drop):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Zbiega głęboko pod kosz, zabezpieczając ścięcia za plecami D5 i zbiórkę z dystansu.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'corner' && (
                      <div className="space-y-3">
                        <div className="kicker">
                          🏀 Piłka w Prawym Rogu (Corner Trap):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D4 (Zamknięcie Rogu):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Sprintuje w róg z rękami w górze. Blokuje rzut za 3 bez skakania w przód.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D5 (Odcięcie Linii Końcowej):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Doskakuje do linii końcowej, uniemożliwiając wjazd pod kosz wzdłuż autu.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D2 (Zejście na Prawy Łokieć):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Opada na łokieć trumny, odcinając podanie zwrotne na skrzydło.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D1 & D3 (Zabezpieczenie Kosza):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Pilnują środka i przeciwnego skrzydła przed podaniami typu skip pass.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'high_post' && (
                      <div className="space-y-3">
                        <div className="kicker">
                          ⚠️ Piłka na linii rzutów wolnych (high post) — najgroźniejszy punkt dla strefy 2-3:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle border-l-[3px] border-l-bkpk-primary sm:col-span-2">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">Zasada Sandwich (Podwójne Zaciśnięcie):</span>
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
                        <div className="kicker">
                          🏀 Piłka na Szczycie (Top of the Key):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D1 (Presja na Szczycie):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Wysoko na łuku 3PT. Nie pozwala na łatwy rzut ze szczytu.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D2 & D3 (Skrzydła 3PT):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Rozstawieni szeroko na skrzydłach na linii 6.75m. Gotowi do błyskawicznego doskoku.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle sm:col-span-2">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D4 & D5 (Dolna Dwójka):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Stoją po obu stronach trumny (bloki). Kontrolują wbiegających i zabezpieczają deskę.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'wing' && (
                      <div className="space-y-3">
                        <div className="kicker">
                          🏀 Piłka na Prawym Skrzydle (Right Wing):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D2 (Agresywny Closeout):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Doskakuje do strzelca z wyciągniętą ręką. Wymusza podanie lub trudny koźle w środek.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D1 (Prawy Łokieć):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Schodzi na prawy łokieć trumny, blokując wjazd w kierunku środka boiska.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D3 (Środek Obwodu):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Przesuwa się w stronę szczytu, odcinając łatwe podanie powrotne.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D4 & D5 (Rotacja Pod Koszem):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              D4 wychodzi w stronę prawego narożnika, a D5 przesuwa się pod samą obręcz.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'corner' && (
                      <div className="space-y-3">
                        <div className="kicker">
                          🏀 Piłka w Prawym Rogu (Corner Rotation):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D4 (Wyjście do Rogu):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Wychodzi z pomalowanego w róg, by zablokować trójkę.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D5 (Obrona Obręczy):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              Zostaje jedynym obrońcą pod koszem. Zastawia pozycję przeciwko centrowi rywali.
                            </p>
                          </div>
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle sm:col-span-2">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">D2 & D1 (Zejście w Głąb):</span>
                            <p className="text-bkpk-text-secondary mt-1">
                              D2 cofa się do prawego łokcia, D1 zabezpiecza linię rzutów wolnych.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScenario === 'high_post' && (
                      <div className="space-y-3">
                        <div className="kicker">
                          🏀 Piłka na linii rzutów wolnych (high post):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                          <div className="p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle sm:col-span-2">
                            <span className="font-display text-[16px] uppercase text-bkpk-text-primary">Zaciśnięcie Trójki:</span>
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
              <div className="p-4 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle space-y-2">
                <div className="flex items-center gap-2 text-bkpk-text-primary uppercase text-[16px] font-display">
                  <CheckCircle2 className="w-4 h-4 text-bkpk-primary shrink-0" />
                  Zasada &quot;Bump &amp; Pass&quot; (Przekazywanie Gracza)
                </div>
                <p className="text-bkpk-text-secondary text-[13px] leading-relaxed">
                  Gdy atakujący bez piłki ścina przez twoją strefę: nie biegnij za nim po całym boisku! Wykonaj lekki, legalny kontakt klatką piersiową (<strong>Bump</strong>), zwalniając jego bieg, a następnie głośno przekaż go (<strong>Pass-off</strong>) koledze z sąsiedniej strefy.
                </p>
              </div>

              <div className="p-4 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle space-y-2">
                <div className="flex items-center gap-2 text-bkpk-text-primary uppercase text-[16px] font-display">
                  <AlertTriangle className="w-4 h-4 text-bkpk-primary shrink-0" />
                  Zbiórka Defensywna (Box-Out w Strefie)
                </div>
                <p className="text-bkpk-text-secondary text-[13px] leading-relaxed">
                  W strefie nie masz przypisanego konkretnego rywala do zbiórki. W momencie rzutu każdy obrońca natychmiast szuka najbliższego atakującego w swoim sektorze, odwraca się tyłem (<strong>Box-Out</strong>) i nie pozwala na dobitkę.
                </p>
              </div>
            </div>

            {/* 4. Porównanie Kiedy Stosować 2-3 vs 3-2 */}
            <div className="p-4 bg-bkpk-surface-tint-2 border border-bkpk-border-strong space-y-2">
              <h4 className="uppercase text-[17px] text-bkpk-text-primary font-display">
                Kiedy wybrać Strefę 2-3, a kiedy Strefę 3-2?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] pt-1">
                <div className="p-3 border border-bkpk-border-subtle">
                  <span className="font-semibold text-bkpk-text-primary block mb-1">🛡️ Wybierz Strefę 2-3 gdy:</span>
                  <ul className="list-disc list-inside space-y-1 text-bkpk-text-muted">
                    <li>Rywal ma silnych graczy podkoszowych</li>
                    <li>Chcesz całkowicie zamknąć wjazdy w pomalowane</li>
                    <li>Potrzebujesz dominacji na zbiórce defensywnej</li>
                  </ul>
                </div>
                <div className="p-3 border border-bkpk-border-subtle">
                  <span className="font-semibold text-bkpk-text-primary block mb-1">🎯 Wybierz Strefę 3-2 gdy:</span>
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
          <div className="p-4 bg-bkpk-surface-tint-1 border-t border-bkpk-border-subtle flex items-center justify-between gap-3 shrink-0">
            <span className="text-[13px] text-bkpk-text-muted">
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
