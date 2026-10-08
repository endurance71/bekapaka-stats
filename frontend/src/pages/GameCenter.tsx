import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../lib/api';
import GamesList from '../features/games/GamesList';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import LoadError from '../shared/ui/LoadError';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus';

export default function GameCenter() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const { seasonId } = useSeasonPreferenceContext();

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
      const data = await fetchJSON<any[]>(`/api/games${q}`);
      setGames((data || []).filter(g => g !== null && g !== undefined));
    } catch (err) {
      console.error('Błąd podczas pobierania meczów:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);
  useRefetchOnFocus(() => void fetchGames());

  return (
    <div className="bg-bkpk-bg">
      <PageContainer width="narrow" className="max-w-[1200px]">
        <PageHeader
          kicker="Sezon"
          title="Mecze"
          description="Wyniki, statystyki zawodników i przebieg meczów z oficjalnej strony KALK"
        />

        {/* Content Section */}
        <section>
          {error && !loading ? (
            <LoadError title="Nie udało się wczytać meczów" error={error} onRetry={fetchGames} />
          ) : (
            <GamesList games={games} loading={loading} />
          )}
        </section>
      </PageContainer>
    </div>
  );
}
