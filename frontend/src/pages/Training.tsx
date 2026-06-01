import { useEffect, useState, useMemo } from 'react';
import { fetchJSON, postJSON, putJSON } from '../lib/api';
import { cn } from '../shared/lib/utils';
import { Loader2, Plus, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import Modal from '../components/Modal';

interface TrainingSession {
    id: string;
    date: string;
    description?: string;
    attendance?: string[];
}

interface Player {
    id: string;
    name: string;
    number?: number;
}

export default function Training() {
    const [trainings, setTrainings] = useState<TrainingSession[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTrainingDate, setNewTrainingDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        Promise.all([
            fetchJSON<TrainingSession[]>('/api/trainings'),
            fetchJSON<Player[]>('/api/players')
        ]).then(([tData, pData]) => {
            setTrainings(tData || []);
            setPlayers(pData || []);
            if (tData?.length > 0) setSelectedTrainingId(tData[0].id);
        }).finally(() => setLoading(false));
    }, []);

    const selectedTraining = useMemo(() =>
        trainings.find(t => t.id === selectedTrainingId),
        [trainings, selectedTrainingId]);

    const handleToggleAttendance = async (playerId: string) => {
        if (!selectedTraining) return;

        const currentAttendance = selectedTraining.attendance || [];
        const nextAttendance = currentAttendance.includes(playerId)
            ? currentAttendance.filter((id: string) => id !== playerId)
            : [...currentAttendance, playerId];

        try {
            const updated = await putJSON<TrainingSession>(`/api/trainings/${selectedTraining.id}`, {
                ...selectedTraining,
                attendance: nextAttendance
            });
            setTrainings(prev => prev.map(t => t.id === updated.id ? updated : t));
        } catch (error) {
            console.error('Błąd aktualizacji obecności:', error);
        }
    };

    const handleCreateTraining = async () => {
        try {
            const created = await postJSON<TrainingSession>('/api/trainings', {
                date: new Date(newTrainingDate).toISOString(),
                description: 'Trening zespołowy',
                attendance: []
            });
            setTrainings(prev => [created, ...prev]);
            setSelectedTrainingId(created.id);
            setIsCreating(false);
        } catch (error) {
            console.error('Błąd tworzenia treningu:', error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full text-bkpk-text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Ładowanie danych...</span>
        </div>
    );

    return (
        <div className="p-3 sm:p-6 flex flex-col gap-4 sm:gap-6 h-auto lg:h-[calc(100vh-80px)] max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-bkpk-text-primary font-outfit">Centrum Treningowe</h1>
                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-bkpk-primary text-white rounded-lg font-semibold hover:bg-bkpk-primary-hover transition-colors shadow-lg shadow-bkpk-primary/20 text-sm"
                    onClick={() => setIsCreating(true)}
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Nowy Trening
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 lg:overflow-hidden">
                <aside className="w-full lg:w-64 flex flex-col gap-3 lg:gap-4 border-b lg:border-b-0 lg:border-r border-bkpk-border-strong pb-3 lg:pb-0 pr-0 lg:pr-6 lg:overflow-y-auto">
                    <h3 className="text-xs font-bold text-bkpk-text-muted uppercase tracking-wider">Lista Treningów</h3>
                    <div className="flex flex-row lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-2 lg:pb-0 w-full">
                        {trainings.map(t => (
                            <div
                                key={t.id}
                                className={cn(
                                    "p-3 lg:p-4 rounded-xl cursor-pointer transition-all border flex flex-col gap-0.5 lg:gap-1 flex-shrink-0 w-28 lg:w-full text-center lg:text-left",
                                    selectedTrainingId === t.id
                                        ? "bg-bkpk-surface-tint-4 border-bkpk-primary shadow-md"
                                        : "bg-bkpk-surface-tint-1 border-transparent hover:bg-bkpk-surface-tint-3 hover:border-bkpk-border-subtle"
                                )}
                                onClick={() => setSelectedTrainingId(t.id)}
                            >
                                <span className="font-semibold text-sm sm:text-base text-bkpk-text-primary">
                                    {new Date(t.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="text-[10px] sm:text-xs text-bkpk-text-muted capitalize">
                                    {new Date(t.date).toLocaleDateString('pl-PL', { weekday: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 lg:overflow-y-auto">
                    {selectedTraining ? (
                        <div className="bg-bkpk-surface border border-bkpk-border-strong rounded-2xl p-4 sm:p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-bkpk-border-strong gap-2">
                                <h2 className="text-lg sm:text-2xl font-bold text-bkpk-text-primary font-outfit">
                                    {new Date(selectedTraining.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="px-2.5 py-1 bg-bkpk-primary/10 text-bkpk-primary rounded-full font-bold text-[10px] sm:text-sm border border-bkpk-primary/20 whitespace-nowrap">
                                    Obecność: {selectedTraining.attendance?.length || 0} / {players.length}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                                {players.map(player => {
                                    const isPresent = selectedTraining.attendance?.includes(player.id);
                                    return (
                                        <div
                                            key={player.id}
                                            className={cn(
                                                "p-3 sm:p-5 rounded-xl text-center cursor-pointer transition-all border flex flex-col items-center gap-2 sm:gap-3",
                                                isPresent
                                                    ? "bg-bkpk-success/5 border-bkpk-success/30 hover:bg-bkpk-success/10"
                                                    : "bg-bkpk-surface-tint-1 border-bkpk-border-subtle hover:bg-bkpk-surface-tint-3 hover:-translate-y-1 hover:shadow-lg"
                                            )}
                                            onClick={() => handleToggleAttendance(player.id)}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors",
                                                isPresent ? "bg-bkpk-success text-white shadow-lg shadow-bkpk-success/20" : "bg-bkpk-surface-tint-3 text-bkpk-text-secondary"
                                            )}>
                                                {player.number || '#'}
                                            </div>
                                            <div className="font-semibold text-bkpk-text-primary text-sm line-clamp-1 w-full">{player.name}</div>
                                            <div className={cn("text-xs font-medium flex items-center gap-1.5", isPresent ? "text-bkpk-success" : "text-bkpk-text-muted")}>
                                                {isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                {isPresent ? 'Obecny' : 'Nieobecny'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-bkpk-text-muted p-12 border-2 border-dashed border-bkpk-border-strong rounded-2xl bg-bkpk-surface-tint-1/50">
                            <Calendar className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Wybierz trening z listy lub dodaj nowy</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Create training modal — now using shared Modal component */}
            <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="Dodaj nowy trening" maxWidth="max-w-md">
                <input
                    type="date"
                    value={newTrainingDate}
                    onChange={e => setNewTrainingDate(e.target.value)}
                    className="w-full p-3 bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-lg text-bkpk-text-primary mb-6 focus:outline-none focus:border-bkpk-primary focus:bg-bkpk-surface-tint-3 transition-colors"
                />
                <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 bg-bkpk-surface-tint-2 text-bkpk-text-primary rounded-lg font-semibold hover:bg-bkpk-surface-tint-3 transition-colors"
                        onClick={() => setIsCreating(false)}
                    >
                        Anuluj
                    </button>
                    <button
                        className="px-4 py-2 bg-bkpk-primary text-white rounded-lg font-semibold hover:bg-bkpk-primary-hover transition-colors"
                        onClick={handleCreateTraining}
                    >
                        Utwórz
                    </button>
                </div>
            </Modal>
        </div>
    );
}
