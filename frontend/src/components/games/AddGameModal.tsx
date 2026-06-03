import { useState } from 'react';
import { postJSON } from '../../lib/api';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface AddGameModalProps {
    onClose: () => void;
    onGameAdded: () => void;
}

export default function AddGameModal({ onClose, onGameAdded }: AddGameModalProps) {
    const [formData, setFormData] = useState({
        opponent: '',
        date: '',
        homeAway: 'home' as 'home' | 'away',
        scoreUs: '',
        scoreThem: '',
        result: '' as '' | 'W' | 'L'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Walidacja
            if (!formData.opponent || !formData.date) {
                throw new Error('Przeciwnik i data są wymagane');
            }

            // Przygotowanie danych
            const gameData: any = {
                opponent: formData.opponent,
                date: new Date(formData.date).toISOString(),
                homeAway: formData.homeAway
            };

            // Jeśli wynik został podany
            if (formData.scoreUs && formData.scoreThem) {
                gameData.scoreUs = parseInt(formData.scoreUs);
                gameData.scoreThem = parseInt(formData.scoreThem);
                gameData.result = gameData.scoreUs > gameData.scoreThem ? 'W' : 'L';
            }

            await postJSON('/api/games', gameData);
            onGameAdded();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd podczas dodawania meczu');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const inputClass = "w-full p-3 bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg text-bkpk-text-primary text-sm focus:outline-none focus:border-bkpk-primary focus:bg-bkpk-surface-tint-3 transition-colors";
    const labelClass = "text-xs font-bold text-bkpk-text-secondary uppercase tracking-wider mb-2 block";

    return (
        <div className="fixed inset-0 bg-bkpk-overlay-strong flex items-center justify-center z-50 p-5 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-bkpk-surface-elevated rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-bkpk-border-subtle" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-bkpk-border-strong">
                    <h2 className="text-xl font-bold text-bkpk-text-primary font-outfit">Dodaj Nowy Mecz</h2>
                    <button
                        className="p-2 -mr-2 text-bkpk-text-secondary hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-colors"
                        onClick={onClose}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {error && (
                        <div className="p-3 bg-bkpk-danger/10 border-l-4 border-bkpk-danger rounded-r-lg text-bkpk-text-danger text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Przeciwnik *</label>
                        <input
                            type="text"
                            value={formData.opponent}
                            onChange={(e) => handleChange('opponent', e.target.value)}
                            placeholder="np. Basket Koszalin"
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Data i godzina *</label>
                        <input
                            type="datetime-local"
                            value={formData.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Lokalizacja</label>
                        <input
                            type="text"
                            value="KOSiR Koszalin"
                            disabled
                            className="w-full p-3 bg-bkpk-surface-tint-1 border border-bkpk-border-strong rounded-lg text-bkpk-text-muted text-sm cursor-not-allowed"
                        />
                    </div>

                    <div className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-bkpk-border-strong"></div>
                        <span className="text-xs font-bold text-bkpk-text-muted uppercase tracking-wider">Wynik (opcjonalnie)</span>
                        <div className="flex-1 h-px bg-bkpk-border-strong"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                        <div>
                            <label className={labelClass}>Nasze punkty</label>
                            <input
                                type="number"
                                value={formData.scoreUs}
                                onChange={(e) => handleChange('scoreUs', e.target.value)}
                                placeholder="0"
                                min="0"
                                className={inputClass}
                            />
                        </div>

                        <div className="hidden md:block pb-3 text-2xl font-bold text-bkpk-text-muted">-</div>

                        <div>
                            <label className={labelClass}>Przeciwnik</label>
                            <input
                                type="number"
                                value={formData.scoreThem}
                                onChange={(e) => handleChange('scoreThem', e.target.value)}
                                placeholder="0"
                                min="0"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button
                            type="button"
                            className="flex-1 px-6 py-3 bg-bkpk-surface-tint-2 text-bkpk-text-primary rounded-lg text-sm font-semibold hover:bg-bkpk-surface-tint-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bkpk-btn-primary rounded-lg text-sm font-semibold transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            disabled={loading}
                        >
                            {loading ? 'Dodawanie...' : 'Dodaj Mecz'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
