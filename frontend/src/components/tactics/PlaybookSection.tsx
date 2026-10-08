import { useCallback, useEffect, useRef, useState } from 'react';
import { Film, Sparkles } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton from '../../shared/ui/BkpkButton';
import BasketballCourtCanvas from './BasketballCourtCanvas';
import PlaybookList, { type PlayItem } from './PlaybookList';
import AiPlayGeneratorModal from './AiPlayGeneratorModal';
import { fetchJSON } from '../../lib/api';
import { useIsAdmin } from '../../context/AuthContext';
import LoadError from '../../shared/ui/LoadError';

/** Drużyna → „Zagrywki”: animowana tablica i lista zagrywek (generator AI tylko dla trenera). */
export default function PlaybookSection() {
    const [plays, setPlays] = useState<PlayItem[]>([]);
    const [selectedPlay, setSelectedPlay] = useState<PlayItem | null>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const canManage = useIsAdmin();
    const boardRef = useRef<HTMLDivElement>(null);
    const [loadError, setLoadError] = useState<unknown>(null);

    const loadPlays = useCallback(async () => {
        setLoadError(null);
        try {
            const data = await fetchJSON<PlayItem[]>('/api/tactics/plays');
            setPlays(data || []);
            setSelectedPlay((current) => current ?? data?.[0] ?? null);
        } catch (err) {
            console.error('Error fetching plays:', err);
            setLoadError(err);
        }
    }, []);

    useEffect(() => {
        loadPlays();
    }, [loadPlays]);

    const handleSelectPlay = (play: PlayItem) => {
        setSelectedPlay(play);
        boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (loadError && plays.length === 0) {
        return <LoadError title="Nie udało się wczytać zagrywek" error={loadError} onRetry={() => void loadPlays()} />;
    }

    return (
        <div className="space-y-8">
            <div ref={boardRef} className="space-y-4">
                {selectedPlay ? (
                    <BasketballCourtCanvas
                        initialData={selectedPlay.diagramData}
                        playName={selectedPlay.name}
                        category={selectedPlay.category}
                        targetDefense={selectedPlay.targetDefense || undefined}
                    />
                ) : (
                    <BkpkCard variant="glass" className="text-center py-16">
                        <Film className="w-12 h-12 text-bkpk-text-muted mx-auto mb-3" aria-hidden />
                        <h3 className="text-[20px] text-bkpk-text-primary mb-2">Wybierz zagrywkę z listy poniżej</h3>
                        <p className="text-[14px] text-bkpk-text-muted max-w-md mx-auto">Zagrywka pokaże się na tablicy jako animacja ruchu zawodników.</p>
                    </BkpkCard>
                )}
            </div>

            <div className="space-y-4 pt-6 border-t border-bkpk-border-subtle">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[22px] sm:text-[24px] leading-tight text-bkpk-text-primary">
                            Zagrywki (<span className="font-display tabular-nums">{plays.length}</span>)
                        </h3>
                        <p className="text-[14px] text-bkpk-text-muted">
                            {canManage ? 'Wybierz zagrywkę albo wygeneruj nowy wariant z pomocą AI.' : 'Wybierz zagrywkę, aby zobaczyć ją na tablicy.'}
                        </p>
                    </div>
                    {canManage && (
                        <BkpkButton variant="primary" size="sm" onClick={() => setIsAiModalOpen(true)}>
                            <Sparkles className="w-4 h-4 mr-1.5" aria-hidden />
                            Nowa zagrywka (AI)
                        </BkpkButton>
                    )}
                </div>

                <PlaybookList
                    plays={plays}
                    selectedPlayId={selectedPlay?.id}
                    onSelectPlay={handleSelectPlay}
                    onPlayDeleted={(id) => {
                        setPlays((prev) => prev.filter((p) => p.id !== id));
                        setSelectedPlay((current) => (current?.id === id ? null : current));
                    }}
                    onPlayUpdated={(updated) => setPlays((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
                    canManage={canManage}
                />
            </div>

            {canManage && (
                <AiPlayGeneratorModal
                    isOpen={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    onPlayGenerated={(generatedPlay) => {
                        setPlays((prev) => [generatedPlay, ...prev]);
                        handleSelectPlay(generatedPlay);
                    }}
                />
            )}
        </div>
    );
}
