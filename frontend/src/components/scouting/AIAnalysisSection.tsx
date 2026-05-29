
import React from 'react';
import BkpkCard from '../../shared/ui/BkpkCard';
import { Bot, Swords, Shield, Zap } from 'lucide-react';

interface AIAnalysisProps {
    data: {
        summary: string;
        offense: string;
        defense: string;
        verdict: string;
        lockerRoom?: string[];
    };
}

export const AIAnalysisSection: React.FC<AIAnalysisProps> = ({ data }) => {
    if (!data) return null;

    return (
        <BkpkCard
            title="AI Game Plan"
            icon={<Bot className="w-5 h-5 text-bkpk-primary" />}
            variant="glass"
            className="h-full border-bkpk-primary/20 shadow-[0_0_15px_rgba(255,107,53,0.1)]"
        >
            <div className="space-y-6">

                {/* SUMMARY */}
                <div className="bg-bkpk-surface-tint-2 p-4 rounded-xl border border-bkpk-border-strong">
                    <h4 className="text-caption-bold text-bkpk-text-secondary uppercase tracking-widest mb-2">Podsumowanie Stylu</h4>
                    <p className="text-body text-bkpk-text-primary leading-relaxed font-medium">{data.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OFFENSE */}
                    <div className="bg-bkpk-surface-tint-2 p-4 rounded-xl border-l-2 border-bkpk-success">
                        <div className="flex items-center gap-2 mb-2">
                            <Swords className="w-4 h-4 text-bkpk-success" />
                            <h4 className="text-caption-bold text-bkpk-text-secondary uppercase tracking-widest">Ich Ofensywa</h4>
                        </div>
                        <p className="text-body text-bkpk-text-secondary leading-relaxed">{data.offense}</p>
                    </div>

                    {/* DEFENSE */}
                    <div className="bg-bkpk-surface-tint-2 p-4 rounded-xl border-l-2 border-bkpk-danger">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-bkpk-danger" />
                            <h4 className="text-caption-bold text-bkpk-text-secondary uppercase tracking-widest">Ich Defensywa</h4>
                        </div>
                        <p className="text-body text-bkpk-text-secondary leading-relaxed">{data.defense}</p>
                    </div>
                </div>

                {/* VERDICT */}
                <div className="bg-gradient-to-r from-bkpk-primary/20 via-bkpk-primary/10 to-transparent p-4 rounded-xl border border-bkpk-primary/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-bkpk-primary" />
                        <h4 className="text-caption-bold text-bkpk-primary uppercase tracking-widest">Klucz do Zwycięstwa</h4>
                    </div>
                    <p className="text-body text-bkpk-text-primary font-bold leading-relaxed">{data.verdict}</p>
                </div>

                {data.lockerRoom && data.lockerRoom.length > 0 && (
                    <div className="bg-bkpk-surface-tint-2 p-4 rounded-xl border border-bkpk-border-strong">
                        <h4 className="text-caption-bold text-bkpk-text-secondary uppercase tracking-widest mb-3">Szatnia — checklista</h4>
                        <ul className="space-y-2">
                            {data.lockerRoom.map((item, i) => (
                                <li key={i} className="text-sm text-bkpk-text-secondary flex gap-2">
                                    <span className="text-bkpk-primary font-bold">{i + 1}.</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </div>
        </BkpkCard>
    );
};
