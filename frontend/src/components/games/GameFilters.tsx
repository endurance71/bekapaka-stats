import { clsx } from 'clsx';

interface GameFiltersProps {
    resultFilter: 'all' | 'W' | 'L';
    onResultChange: (filter: 'all' | 'W' | 'L') => void;
    onSortChange: (sort: 'date-desc' | 'date-asc') => void;
    sortBy: 'date-desc' | 'date-asc';
}

export default function GameFilters({
    resultFilter,
    onResultChange,
    onSortChange,
    sortBy
}: GameFiltersProps) {
    const baseButtonClass = "px-4 py-2 border border-bkpk-border-strong bg-bkpk-surface-tint-1 text-bkpk-text-primary rounded-lg text-sm font-medium transition-all hover:bg-bkpk-surface-tint-3 hover:border-bkpk-border-strong";
    const activeBaseClass = "bg-bkpk-primary-fill border-bkpk-primary-fill text-white hover:bg-bkpk-primary-fill-hover hover:border-bkpk-primary-fill-hover";

    return (
        <div className="flex flex-col gap-5 bg-bkpk-card rounded-xl p-5 mb-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-wider">Wynik:</label>
                <div className="flex flex-wrap gap-2">
                    <button
                        className={clsx(baseButtonClass, resultFilter === 'all' && activeBaseClass)}
                        onClick={() => onResultChange('all')}
                    >
                        Wszystkie
                    </button>
                    <button
                        className={clsx(
                            baseButtonClass,
                            resultFilter === 'W' && "bg-bkpk-success-fill border-bkpk-success-fill text-white hover:bg-bkpk-success-fill-hover hover:border-bkpk-success-fill-hover"
                        )}
                        onClick={() => onResultChange('W')}
                    >
                        Wygrane
                    </button>
                    <button
                        className={clsx(
                            baseButtonClass,
                            resultFilter === 'L' && "bg-bkpk-danger-fill border-bkpk-danger-fill text-white hover:bg-bkpk-danger-fill-hover hover:border-bkpk-danger-fill-hover"
                        )}
                        onClick={() => onResultChange('L')}
                    >
                        Przegrane
                    </button>
                </div>
            </div>



            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-wider">Sortowanie:</label>
                <div className="flex flex-wrap gap-2">
                    <button
                        className={clsx(baseButtonClass, sortBy === 'date-desc' && activeBaseClass)}
                        onClick={() => onSortChange('date-desc')}
                    >
                        Najnowsze
                    </button>
                    <button
                        className={clsx(baseButtonClass, sortBy === 'date-asc' && activeBaseClass)}
                        onClick={() => onSortChange('date-asc')}
                    >
                        Najstarsze
                    </button>
                </div>
            </div>
        </div>
    );
}
