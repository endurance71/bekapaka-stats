import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
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
                    <span className="kicker text-bkpk-text-primary">Forma drużyny</span>
                    <span className="label-caps text-bkpk-text-muted text-xs">
                        {matches.length > 0 ? `Ostatnie ${matches.length} ${matches.length === 1 ? 'mecz' : matches.length < 5 ? 'mecze' : 'meczów'}` : 'Brak meczów'}
                    </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {matches.map((match, idx) => (
                        <motion.div
                            key={match.id}
                            title={`${match.result === 'W' ? 'Wygrana' : 'Porażka'} ${match.score}`}
                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.3 }}
                            className="min-w-[44px]"
                        >
                            <Link to={`/games/${match.id}`} className="flex flex-col items-center gap-1.5 group min-h-[44px]">
                            <div
                                className={clsx(
                                    // Jak .standings-badge na bekapaka.pl: wygrana wypełniona, porażka obrysowana
                                    "w-7 h-7 inline-grid place-items-center border-[1.5px] font-text font-semibold text-xs leading-none transition-colors",
                                    match.result === 'W'
                                        ? "bg-bkpk-text-primary border-bkpk-text-primary text-bkpk-bg"
                                        : "bg-transparent border-bkpk-text-secondary text-bkpk-text-primary group-hover:border-bkpk-text-primary"
                                )}
                            >
                                {match.result === 'W' ? 'W' : 'P'}
                            </div>
                            <span className="text-xs text-bkpk-text-muted font-medium tabular-nums group-hover:text-bkpk-text-secondary transition-colors">
                                {match.score}
                            </span>
                            </Link>
                        </motion.div>
                    ))}

                    {matches.length === 0 && !loading && (
                        <div className="py-2 label-caps text-bkpk-text-muted text-xs">
                            Forma zespołu pojawi się po rozegraniu pierwszych meczów w sezonie.
                        </div>
                    )}
                </div>
            </div>
        </BkpkCard>
    );
}
