
import React from 'react';
import BkpkCard from '../../shared/ui/BkpkCard';
import { Users, Crosshair, Crown, Shield } from 'lucide-react';

interface Props {
    data: {
        shooters: string[];
        paintProtectors: string[];
        playmakers: string[];
    };
}

export const PersonnelSection: React.FC<Props> = ({ data }) => {
    if (!data) return null;

    return (
        <BkpkCard
            title="Analiza Kadry"
            icon={<Users className="w-5 h-5 text-bkpk-primary" />}
            variant="glass"
            className="h-full"
            overflowVisible={true}
        >
            <div className="space-y-6">

                {/* SHOOTERS */}
                <div className="group hover:bg-bkpk-surface-tint-1 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-bkpk-border-strong">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-bkpk-success/10 flex items-center justify-center border border-bkpk-success/20">
                            <Crosshair className="w-4 h-4 text-bkpk-success" />
                        </div>
                        <span className="text-sm font-black text-bkpk-text-primary uppercase tracking-[0.15em]">Strzelcy Dystansowi</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {data.shooters.length > 0 ? data.shooters.map(p => (
                            <span key={p} className="px-2.5 py-1 bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg text-xs font-bold text-bkpk-text-primary shadow-sm group-hover:bg-bkpk-surface-tint-4 transition-colors">
                                {p}
                            </span>
                        )) : <span className="text-bkpk-text-muted italic text-xs">Brak wyraźnych strzelców.</span>}
                    </div>
                    <div className="px-3 py-2 bg-bkpk-success/5 border-l-2 border-bkpk-success rounded-r-lg text-caption text-bkpk-success font-bold uppercase tracking-wider">
                        Klawisz: Nie zostawiaj wolnych na obwodzie. Walcz na zasłonach!
                    </div>
                </div>

                {/* PLAYMAKERS */}
                <div className="group hover:bg-bkpk-surface-tint-1 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-bkpk-border-strong">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-bkpk-primary/10 flex items-center justify-center border border-bkpk-primary/20">
                            <Crown className="w-4 h-4 text-bkpk-primary" />
                        </div>
                        <span className="text-sm font-black text-bkpk-text-primary uppercase tracking-[0.15em]">Liderzy Rozegrania</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {data.playmakers.length > 0 ? data.playmakers.map(p => (
                            <span key={p} className="px-2.5 py-1 bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg text-xs font-bold text-bkpk-text-primary shadow-sm group-hover:bg-bkpk-surface-tint-4 transition-colors">
                                {p}
                            </span>
                        )) : <span className="text-bkpk-text-muted italic text-xs">Brak wyraźnych liderów.</span>}
                    </div>
                    <div className="px-3 py-2 bg-bkpk-primary/5 border-l-2 border-bkpk-primary rounded-r-lg text-caption text-bkpk-primary font-bold uppercase tracking-wider">
                        Klawisz: Wywieraj presję na piłce. Odcinaj od podań.
                    </div>
                </div>

                {/* PAINT PROTECTORS */}
                <div className="group hover:bg-bkpk-surface-tint-1 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-bkpk-border-strong">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-bkpk-warning/10 flex items-center justify-center border border-bkpk-warning/20">
                            <Shield className="w-4 h-4 text-bkpk-warning" />
                        </div>
                        <span className="text-sm font-black text-bkpk-text-primary uppercase tracking-[0.15em]">Obrońcy Pomalowanego</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {data.paintProtectors.length > 0 ? data.paintProtectors.map(p => (
                            <span key={p} className="px-2.5 py-1 bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg text-xs font-bold text-bkpk-text-primary shadow-sm group-hover:bg-bkpk-surface-tint-4 transition-colors">
                                {p}
                            </span>
                        )) : <span className="text-bkpk-text-muted italic text-xs">Brak dominatorów podkoszowych.</span>}
                    </div>
                    <div className="px-3 py-2 bg-bkpk-warning/5 border-l-2 border-bkpk-warning rounded-r-lg text-caption text-bkpk-warning font-bold uppercase tracking-wider">
                        Klawisz: Uważaj na bloki. Wymuszaj wyjście z trumny.
                    </div>
                </div>

            </div>
        </BkpkCard>
    );
};
