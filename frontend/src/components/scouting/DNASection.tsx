import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkTooltip from '../../shared/ui/BkpkTooltip';
import { Activity, Target, Crosshair, HelpCircle } from 'lucide-react';
import useIsMobile from '../../hooks/useIsMobile';
import { formatStatFixed } from '../../shared/lib/formatStat';
import SectionHeading from '../../shared/ui/SectionHeading';
import {
    chartCategorical,
    chartTooltipItemStyle,
    chartTooltipLabelStyle,
    chartTooltipStyle,
} from '../../shared/lib/chartTheme';

interface DNAProps {
    data: {
        pace: number;
        shotProfile: { two: number; three: number; ft: number };
        fourFactors: { efg: number; tov: number; orb: number; ftr: number };
        situational?: { fourthQuarterDiff: number; clutchPlay: string };
        fallbackFromPreviousMatch?: boolean;
        fallbackBasicOnly?: boolean;
        sourceMatchDate?: string | null;
        sourceMatchLabel?: string | null;
        /** Ile meczów rywala z box score policzono */
        matchesScraped?: number;
    };
}

export const DNASection: React.FC<DNAProps> = ({ data }) => {
    const isMobile = useIsMobile();

    if (!data) return null;

    const { pace, shotProfile, fourFactors } = data;
    // Rekomendacje z 1–2 meczów byłyby zgadywaniem — pokazujemy same liczby
    const games = data.matchesScraped ?? 0;
    const fewGames = games < 3;
    const sampleNote = `Na podstawie ${games} ${games === 1 ? 'meczu' : 'meczów'} — rekomendacje od 3 meczów.`;

    // Pace Logic
    const paceLabel = pace > 84 ? 'Szybka gra — dużo akcji' : (pace < 78 ? 'Wolna gra — długie akcje' : 'Średnie tempo');
    const paceColor = pace > 84 ? 'text-bkpk-text-danger' : (pace < 78 ? 'text-bkpk-text-secondary' : 'text-bkpk-success');

    // Shot Profile Data for Chart
    const pieData = [
        { name: 'Za 2', value: shotProfile.two, color: chartCategorical[0] },
        { name: 'Za 3', value: shotProfile.three, color: chartCategorical[1] },
        { name: 'Wolne', value: shotProfile.ft, color: chartCategorical[2] },
    ];

    // FTR (backend: rzuty wolne / rzuty z gry × 100) — jeden próg dla koloru i porady
    const FTR_HIGH = 25;
    const FTR_LOW = 10;

    // Cztery czynniki Evaluation (Simple Logic)
    const getFactorColor = (val: number, type: 'efg' | 'tov' | 'orb' | 'ftr') => {
        // Good thresholds (returning Tailwind colors) — Digital 2.0: dobry / słaby / neutralny (kamień zamiast złota)
        if (type === 'efg') return val > 50 ? 'bg-bkpk-success' : (val < 40 ? 'bg-bkpk-danger' : 'bg-brand-stone-400');
        if (type === 'tov') return val < 15 ? 'bg-bkpk-success' : (val > 20 ? 'bg-bkpk-danger' : 'bg-brand-stone-400');
        if (type === 'orb') return val > 25 ? 'bg-bkpk-success' : (val < 15 ? 'bg-bkpk-danger' : 'bg-brand-stone-400');
        if (type === 'ftr') return val > FTR_HIGH ? 'bg-bkpk-success' : (val < FTR_LOW ? 'bg-bkpk-danger' : 'bg-brand-stone-400');
        return 'bg-ink-500';
    };

    const getWidth = (val: number) => Math.min(Math.max(val, 0), 100) + '%';
    const getTovWidth = (val: number) => Math.min(Math.max(val * 4, 0), 100) + '%';

    // Tactical Advice Generators
    const getPaceAdvice = () => {
        if (fewGames) return sampleNote;
        if (pace > 84) return "Kluczem jest szybki powrót do obrony i spowolnienie ich gry.";
        if (pace < 78) return "Narzuć presję na całym boisku, zmuś ich do szybszej gry i błędów.";
        return "Kontroluj rytm gry, nie pozwalaj na serie punktowe.";
    };

    const getShotProfileAdvice = () => {
        if (fewGames) return sampleNote;
        if (shotProfile.three > 35) return "Mocno obsadzają obwód. Wyjdź wyżej w obronie, nie pomagaj od strzelców.";
        if (shotProfile.two > 60) return "Atakują głównie spod kosza. Zagęść środek obrony.";
        return "Zrównoważony atak. Bądź gotowy na każdą opcję.";
    };

    // Four Factors Advice
    const getFactorAdvice = (type: 'efg' | 'tov' | 'orb' | 'ftr', val: number) => {
        if (fewGames) return '';
        if (type === 'efg') return val > 50 ? "Trafiają na wysokim procencie. Utrudniaj każdy rzut ręką w górze." : "Mają problemy ze skutecznością. Zmuś do rzutów z nieprzygotowanych pozycji.";
        if (type === 'tov') return val > 20 ? "Popełniają dużo strat. Graj agresywnie na piłce, szukaj przechwytów." : "Szanują piłkę. Graj cierpliwie w obronie, nie ryzykuj.";
        if (type === 'orb') return val > 25 ? "Dominują na tablicy. Po każdym rzucie zastaw rywala przed zbiórką." : "Słabo zbierają w ataku. Możesz szybciej uruchamiać kontrę.";
        if (type === 'ftr') {
            if (val > FTR_HIGH) return "Często wymuszają faule. Broń czysto, ręce w górze, bez sięgania po piłkę.";
            if (val < FTR_LOW) return "Rzadko stają na linii. Możesz grać bardziej fizycznie.";
            return "Rzuty wolne na przeciętnym poziomie.";
        }
        return "";
    };

    return (
        <div className="space-y-6 mb-8">
            <SectionHeading title="Styl gry rywala" className="mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* PACE */}
                <BkpkCard
                    title={
                        <div className="flex items-center gap-1.5">
                            <span>Tempo gry</span>
                            <BkpkTooltip content="Szacowana liczba posiadań piłki na 40 minut. Wyższe tempo sprzyja szybkim atakom, niższe - przemyślanej grze pozycyjnej." />
                        </div>
                    }
                    icon={<Activity className="w-5 h-5 text-bkpk-primary" />}
                    variant="flat"
                    className="h-full"
                    overflowVisible={true}
                >
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="text-[64px] leading-none text-bkpk-text-primary font-display tabular-nums mb-3">{formatStatFixed(pace)}</div>
                        <div className={`status-flag mb-6 ${paceColor}`}>{paceLabel}</div>

                        <div className="bg-bkpk-bg p-4 border border-bkpk-border-subtle border-l-2 border-l-bkpk-primary w-full">
                            <div className="text-sm text-bkpk-text-secondary leading-relaxed font-medium">
                                <div className="flex items-center gap-2 mb-2 text-bkpk-text-primary">
                                    <Target className="w-4 h-4 text-bkpk-primary" />
                                    <strong className="label-caps text-[11px]">Rekomendacja Taktyczna</strong>
                                </div>
                                {getPaceAdvice()}
                            </div>
                        </div>
                    </div>
                </BkpkCard>

                {/* SHOT PROFILE */}
                <BkpkCard
                    title={
                        <div className="flex items-center gap-1.5">
                            <span>Profil Rzutowy (% Pkt)</span>
                            <BkpkTooltip content="Pokazuje, skąd drużyna czerpie najwięcej punktów. Pozwala zidentyfikować, czy rywal polega na rzutach z dystansu, czy na penetracji pod kosz." />
                        </div>
                    }
                    icon={<Target className="w-5 h-5 text-bkpk-primary" />}
                    variant="flat"
                    className="h-full"
                    overflowVisible={true}
                >
                    <div className="w-full relative mb-4" style={{ height: isMobile ? '160px' : '192px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={isMobile ? 40 : 50}
                                    outerRadius={isMobile ? 55 : 70}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="var(--c-ink-800)"
                                    strokeWidth={2}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    trigger={isMobile ? 'click' : 'hover'}
                                    contentStyle={chartTooltipStyle}
                                    itemStyle={chartTooltipItemStyle}
                                    labelStyle={chartTooltipLabelStyle}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="label-caps text-[11px] text-bkpk-text-muted">Wykres</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6">
                        {pieData.map(p => (
                            <div key={p.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 shrink-0" style={{ background: p.color }}></div>
                                <span className="label-caps text-[11px] text-bkpk-text-secondary">{p.name} <span className="font-display text-sm text-bkpk-text-primary tabular-nums ml-1">{p.value}%</span></span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-bkpk-bg p-4 border border-bkpk-border-subtle border-l-2 border-l-bkpk-primary w-full">
                        <div className="text-sm text-bkpk-text-secondary leading-relaxed font-medium">
                            <div className="flex items-center gap-2 mb-2 text-bkpk-text-primary">
                                <Crosshair className="w-4 h-4 text-bkpk-primary" />
                                <strong className="label-caps text-[11px]">Rekomendacja Taktyczna</strong>
                            </div>
                            {getShotProfileAdvice()}
                        </div>
                    </div>
                </BkpkCard>

                {/* FOUR FACTORS */}
                <BkpkCard
                    title={
                        <div className="flex items-center gap-1.5">
                            <span>Cztery czynniki</span>
                            <BkpkTooltip content="Cztery rzeczy, które najczęściej decydują o wyniku: skuteczność rzutów, straty, zbiórki w ataku i częstość rzutów wolnych." />
                        </div>
                    }
                    icon={<Crosshair className="w-5 h-5 text-bkpk-primary" />}
                    variant="flat"
                    className="h-full"
                    overflowVisible={true}
                >
                    <div className="space-y-6">
                        <div className="space-y-5">
                            {/* eFG% */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="label-caps text-[11px] text-bkpk-text-secondary group-hover:text-bkpk-text-primary transition-colors">Skuteczność rzutów</span>
                                        <BkpkTooltip content="Efektywny Procent Rzutów z Pola. Uwzględnia wyższą wartość rzutów za 3 punkty." />
                                    </div>
                                    <span className="font-display text-lg leading-none tabular-nums text-bkpk-text-primary">{formatStatFixed(fourFactors.efg)}%</span>
                                </div>
                                <div className="h-2 w-full bg-bkpk-bg overflow-hidden border border-bkpk-border-subtle">
                                    <div className={`h-full transition-all duration-1000 ${getFactorColor(fourFactors.efg, 'efg')}`} style={{ width: getWidth(fourFactors.efg) }} />
                                </div>
                                <div className="text-xs text-bkpk-text-secondary mt-1.5 leading-snug">{getFactorAdvice('efg', fourFactors.efg)}</div>
                            </div>

                            {/* TOV% */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="label-caps text-[11px] text-bkpk-text-secondary group-hover:text-bkpk-text-primary transition-colors">Straty</span>
                                        <BkpkTooltip content="Procent posiadań kończących się stratą. Im niższy, tym lepiej zespół szanuje piłkę." />
                                    </div>
                                    <span className="font-display text-lg leading-none tabular-nums text-bkpk-text-primary">{formatStatFixed(fourFactors.tov)}%</span>
                                </div>
                                <div className="h-2 w-full bg-bkpk-bg overflow-hidden border border-bkpk-border-subtle">
                                    <div className={`h-full transition-all duration-1000 ${getFactorColor(fourFactors.tov, 'tov')}`} style={{ width: getTovWidth(fourFactors.tov) }} />
                                </div>
                                <div className="text-xs text-bkpk-text-secondary mt-1.5 leading-snug">{getFactorAdvice('tov', fourFactors.tov)}</div>
                            </div>

                            {/* ORB% */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="label-caps text-[11px] text-bkpk-text-secondary group-hover:text-bkpk-text-primary transition-colors">Zbiórki w ataku</span>
                                        <BkpkTooltip content="Procent dostępnych zbiórek ofensywnych zebranych przez zespół. Klucz do punktów drugiej szansy." />
                                    </div>
                                    <span className="font-display text-lg leading-none tabular-nums text-bkpk-text-primary">{formatStatFixed(fourFactors.orb)}%</span>
                                </div>
                                <div className="h-2 w-full bg-bkpk-bg overflow-hidden border border-bkpk-border-subtle">
                                    <div className={`h-full transition-all duration-1000 ${getFactorColor(fourFactors.orb, 'orb')}`} style={{ width: getWidth(fourFactors.orb * 2) }} />
                                </div>
                                <div className="text-xs text-bkpk-text-secondary mt-1.5 leading-snug">{getFactorAdvice('orb', fourFactors.orb)}</div>
                            </div>

                            {/* FTR */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="label-caps text-[11px] text-bkpk-text-secondary group-hover:text-bkpk-text-primary transition-colors">Rzuty wolne</span>
                                        <BkpkTooltip content="Współczynnik rzutów wolnych do rzutów z pola. Pokazuje, jak agresywnie zespół wymusza faule." />
                                    </div>
                                    <span className="font-display text-lg leading-none tabular-nums text-bkpk-text-primary">{formatStatFixed(fourFactors.ftr, 1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-bkpk-bg overflow-hidden border border-bkpk-border-subtle">
                                    <div className={`h-full transition-all duration-1000 ${getFactorColor(fourFactors.ftr, 'ftr')}`} style={{ width: getWidth(fourFactors.ftr * 2) }} />
                                </div>
                                <div className="text-xs text-bkpk-text-secondary mt-1.5 leading-snug">{getFactorAdvice('ftr', fourFactors.ftr)}</div>
                            </div>
                        </div>
                    </div>
                </BkpkCard>

            </div>
        </div>
    );
};
