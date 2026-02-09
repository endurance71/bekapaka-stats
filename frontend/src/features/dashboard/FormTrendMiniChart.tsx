import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import BkpkCard from '../../shared/ui/BkpkCard';

export interface FormTrendProps {
    matches: Array<{ id: string; result: 'W' | 'L'; score: string; date: string }>;
    loading?: boolean;
}

export function FormTrendMiniChart({ matches, loading }: FormTrendProps) {
    return (
        <BkpkCard variant="glass" className="w-full">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <span className="text-bkpk-primary text-xs font-bold uppercase tracking-wider">Aktualna Forma</span>
                    <span className="text-bkpk-text-muted text-xs uppercase font-medium">Ostatnie {matches.length} meczów</span>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 -u-scrollbar-hide">
                    {matches.map((match, idx) => (
                        <motion.div
                            key={match.id}
                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.3 }}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                        >
                            <div
                                className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all group-hover:scale-110",
                                    match.result === 'W'
                                        ? "bg-bkpk-success/20 text-bkpk-success border border-bkpk-success/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                        : "bg-bkpk-danger/20 text-bkpk-danger border border-bkpk-danger/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                                )}
                            >
                                {match.result === 'W' ? 'Z' : 'P'}
                            </div>
                            <span className="text-xs text-bkpk-text-muted font-medium group-hover:text-bkpk-text-secondary transition-colors">
                                {match.score}
                            </span>
                        </motion.div>
                    ))}

                    {matches.length === 0 && !loading && (
                        <div className="py-4 text-bkpk-text-muted text-sm italic">Brak ostatnich meczów</div>
                    )}
                </div>
            </div>
        </BkpkCard>
    );
}
