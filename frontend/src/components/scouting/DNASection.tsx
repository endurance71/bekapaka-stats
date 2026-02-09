
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkTooltip from '../../shared/ui/BkpkTooltip';
import { Activity, Target, Crosshair, HelpCircle } from 'lucide-react';

interface DNAProps {
    data: {
        pace: number;
        shotProfile: { two: number; three: number; ft: number };
        fourFactors: { efg: number; tov: number; orb: number; ftr: number };
        situational?: { fourthQuarterDiff: number; clutchPlay: string };
    };
}

export const DNASection: React.FC<DNAProps> = ({ data }) => {
    if (!data) return null;

    const { pace, shotProfile, fourFactors } = data;

    // Pace Logic
    const paceLabel = pace > 84 ? 'SZYBKIE TEMPO' : (pace < 78 ? 'WOLNE TEMPO' : 'NORMALNE TEMPO');
    const paceColor = pace > 84 ? 'text-bkpk-danger' : (pace < 78 ? 'text-bkpk-primary' : 'text-bkpk-success');

    // Shot Profile Data for Chart
    const pieData = [
        { name: '2pkt', value: shotProfile.two, color: 'var(--bkpk-color-info)' },
        { name: '3pkt', value: shotProfile.three, color: 'var(--bkpk-color-success)' },
        { name: 'Wolne', value: shotProfile.ft, color: 'var(--bkpk-color-warning)' },
    ];

    // Four Factors Evaluation (Simple Logic)
    const getFactorColor = (val: number, type: 'efg' | 'tov' | 'orb' | 'ftr') => {
        // Good thresholds (returning Tailwind colors)
        if (type === 'efg') return val > 50 ? 'bg-bkpk-success' : (val < 40 ? 'bg-bkpk-danger' : 'bg-bkpk-warning');
        if (type === 'tov') return val < 15 ? 'bg-bkpk-success' : (val > 20 ? 'bg-bkpk-danger' : 'bg-bkpk-warning');
        if (type === 'orb') return val > 25 ? 'bg-bkpk-success' : (val < 15 ? 'bg-bkpk-danger' : 'bg-bkpk-warning');
        if (type === 'ftr') return val > 20 ? 'bg-bkpk-success' : (val < 10 ? 'bg-bkpk-danger' : 'bg-bkpk-warning');
        return 'bg-bkpk-surface-tint-6';
    };

    const getWidth = (val: number) => Math.min(Math.max(val, 0), 100) + '%';
    const getTovWidth = (val: number) => Math.min(Math.max(val * 4, 0), 100) + '%';

    // Tactical Advice Generators
    const getPaceAdvice = () => {
        if (pace > 84) return "Kluczem jest szybki powrót do obrony (transition defense) i spowolnienie ich gry.";
        if (pace < 78) return "Narzuć presję na całym boisku, zmuś ich do szybszej gry i błędów.";
        return "Kontroluj rytm gry, nie pozwalaj na serie punktowe.";
    };

    const getShotProfileAdvice = () => {
        if (shotProfile.three > 35) return "Mocno obsadzają obwód. Wyjdź wyżej w obronie, nie pomagaj od strzelców.";
        if (shotProfile.two > 60) return "Atakują głównie pomalowane. Zagęść środek (pack the paint).";
        return "Zrównoważony atak. Bądź gotowy na każdą opcję.";
    };

    // Four Factors Advice
    const getFactorAdvice = (type: 'efg' | 'tov' | 'orb' | 'ftr', val: number) => {
        if (type === 'efg') return val > 50 ? "Trafiają na wysokim procencie. Utrudniaj każdy rzut (contest)." : "Mają problemy ze skutecznością. Zmuś do rzutów z nieprzygotowanych pozycji.";
        if (type === 'tov') return val > 20 ? "Popełniają dużo strat. Graj agresywnie na piłce, szukaj przechwytów." : "Szanują piłkę. Graj cierpliwie w obronie, nie ryzykuj.";
        if (type === 'orb') return val > 25 ? "Dominują na desce. Konieczny mocny zastawianie (box out)!" : "Słabo zbierają w ataku. Możesz szybciej uruchamiać kontrę.";
        if (type === 'ftr') return val > 25 ? "Często wymuszają faule. Broń czysto, ręce w górze (no reach)." : "Rzadko stają na linii. Możesz grać bardziej fizycznie.";
        return "";
    };

    return (
        <div className="space-y-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 bg-bkpk-primary rounded-full" />
                <h2 className="text-2xl font-black text-bkpk-text-primary font-outfit uppercase tracking-wider">DNA Zespołu</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* PACE */}
                <BkpkCard
                    title={
                        <div className="flex items-center gap-1.5">
                            <span>PACE (Tempo Gry)</span>
                            <BkpkTooltip content="Szacowana liczba posiadań piłki na 40 minut. Wyższe tempo sprzyja szybkim atakom, niższe - przemyślanej grze pozycyjnej." />
                        </div>
                    }
                    icon={<Activity className="w-5 h-5 text-bkpk-primary" />}
                    variant="glass"
                    className="h-full"
                    overflowVisible={true}
                >
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="text-display font-black text-bkpk-text-primary font-outfit mb-2 tracking-tighter">{pace.toFixed(1)}</div>
                        <div className={`text-caption-bold uppercase tracking-[0.2em] mb-6 px-3 py-1 bg-bkpk-surface-tint-2 rounded-full border border-bkpk-border-strong ${paceColor}`}>{paceLabel}</div>

                        <div className="bg-bkpk-surface-tint-1 rounded-2xl p-4 border border-bkpk-border-strong w-full shadow-inner">
                            <div className="text-sm text-bkpk-text-secondary leading-relaxed font-medium">
                                <div className="flex items-center gap-1.5 mb-2 text-bkpk-primary">
                                    <Target className="w-4 h-4" />
                                    <strong className="uppercase text-[10px] tracking-[0.2em]">Rekomendacja Taktyczna</strong>
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
                    icon={<Target className="w-5 h-5 text-bkpk-success" />}
                    variant="glass"
                    className="h-full"
                    overflowVisible={true}
                >
                    <div className="h-48 w-full relative mb-4">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--bkpk-color-surface-elevated)', border: '1px solid var(--bkpk-border-strong)', borderRadius: 12, color: 'var(--bkpk-text-primary)' }}
                                    itemStyle={{ color: 'var(--bkpk-text-primary)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-caption font-black text-bkpk-text-muted uppercase tracking-widest">Wykres</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 mb-6">
                        {pieData.map(p => (
                            <div key={p.name} className="flex items-center gap-1.5 bg-bkpk-surface-tint-2 px-2 py-1 rounded-lg border border-bkpk-border-strong">
                                <div className="w-2 h-2 rounded-full" style={{ background: p.color }}></div>
                                <span className="text-caption font-black text-bkpk-text-secondary uppercase">{p.name} <span className="text-bkpk-text-primary ml-1">{p.value}%</span></span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-bkpk-surface-tint-1 rounded-2xl p-4 border border-bkpk-border-strong w-full shadow-inner">
                        <div className="text-sm text-bkpk-text-secondary leading-relaxed font-medium">
                            <div className="flex items-center gap-1.5 mb-2 text-bkpk-success">
                                <Crosshair className="w-4 h-4" />
                                <strong className="uppercase text-caption-bold tracking-[0.2em]">Rekomendacja Taktyczna</strong>
                            </div>
                            {getShotProfileAdvice()}
                        </div>
                    </div>
                </BkpkCard>

                {/* FOUR FACTORS */}
                <BkpkCard
                    title={
                        <div className="flex items-center gap-1.5">
                            <span>Four Factors</span>
                            <BkpkTooltip content="Najważniejsze statystyki w nowoczesnej koszykówce. eFG% (skuteczność), TOV% (straty), ORB% (zbiórki ataku) i FTR (częstotliwość fauli)." />
                        </div>
                    }
                    icon={<Crosshair className="w-5 h-5 text-bkpk-warning" />}
                    variant="glass"
                    className="h-full"
                    overflowVisible={true}
                >
                    <div className="space-y-6">
                        <div className="space-y-5">
                            {/* eFG% */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-caption-bold text-bkpk-text-secondary uppercase tracking-wider group-hover:text-bkpk-primary transition-colors">eFG% (Efektywność)</span>
                                        <BkpkTooltip content="Efektywny Procent Rzutów z Pola. Uwzględnia wyższą wartość rzutów za 3 punkty." />
                                    </div>
                                    <span className="text-sm font-black text-bkpk-text-primary">{fourFactors.efg.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-bkpk-surface-tint-2 rounded-full overflow-hidden shadow-inner border border-bkpk-border-strong/30">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${getFactorColor(fourFactors.efg, 'efg')}`} style={{ width: getWidth(fourFactors.efg) }} />
                                </div>
                                <div className="text-[11px] text-bkpk-text-secondary mt-1.5 leading-tight font-medium opacity-80 group-hover:opacity-100 transition-opacity italic">{getFactorAdvice('efg', fourFactors.efg)}</div>
                            </div>

                            {/* TOV% */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-caption-bold text-bkpk-text-secondary uppercase tracking-wider group-hover:text-bkpk-primary transition-colors">TOV% (Straty)</span>
                                        <BkpkTooltip content="Procent posiadań kończących się stratą. Im niższy, tym lepiej zespół szanuje piłkę." />
                                    </div>
                                    <span className="text-sm font-black text-bkpk-text-primary">{fourFactors.tov.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-bkpk-surface-tint-2 rounded-full overflow-hidden shadow-inner border border-bkpk-border-strong/30">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${getFactorColor(fourFactors.tov, 'tov')}`} style={{ width: getTovWidth(fourFactors.tov) }} />
                                </div>
                                <div className="text-caption text-bkpk-text-secondary mt-1.5 leading-tight font-medium opacity-80 group-hover:opacity-100 transition-opacity italic">{getFactorAdvice('tov', fourFactors.tov)}</div>
                            </div>

                            {/* ORB% */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-caption-bold text-bkpk-text-secondary uppercase tracking-wider group-hover:text-bkpk-primary transition-colors">ORB% (Zbiórki Ataku)</span>
                                        <BkpkTooltip content="Procent dostępnych zbiórek ofensywnych zebranych przez zespół. Klucz do punktów drugiej szansy." />
                                    </div>
                                    <span className="text-sm font-black text-bkpk-text-primary">{fourFactors.orb.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-bkpk-surface-tint-2 rounded-full overflow-hidden shadow-inner border border-bkpk-border-strong/30">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${getFactorColor(fourFactors.orb, 'orb')}`} style={{ width: getWidth(fourFactors.orb * 2) }} />
                                </div>
                                <div className="text-caption text-bkpk-text-secondary mt-1.5 leading-tight font-medium opacity-80 group-hover:opacity-100 transition-opacity italic">{getFactorAdvice('orb', fourFactors.orb)}</div>
                            </div>

                            {/* FTR */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-caption-bold text-bkpk-text-secondary uppercase tracking-wider group-hover:text-bkpk-primary transition-colors">FTR (Rzuty Wolne)</span>
                                        <BkpkTooltip content="Współczynnik rzutów wolnych do rzutów z pola. Pokazuje, jak agresywnie zespół wymusza faule." />
                                    </div>
                                    <span className="text-sm font-black text-bkpk-text-primary">{fourFactors.ftr.toFixed(2)}</span>
                                </div>
                                <div className="h-2 w-full bg-bkpk-surface-tint-2 rounded-full overflow-hidden shadow-inner border border-bkpk-border-strong/30">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${getFactorColor(fourFactors.ftr, 'ftr')}`} style={{ width: getWidth(fourFactors.ftr * 2) }} />
                                </div>
                                <div className="text-caption text-bkpk-text-secondary mt-1.5 leading-tight font-medium opacity-80 group-hover:opacity-100 transition-opacity italic">{getFactorAdvice('ftr', fourFactors.ftr)}</div>
                            </div>
                        </div>
                    </div>
                </BkpkCard>

            </div>
        </div>
    );
};
