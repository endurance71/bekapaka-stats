import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../lib/api';
import GamesList from '../features/games/GamesList';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';

export default function GameCenter() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { seasonId } = useSeasonPreferenceContext();

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const q = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
      const data = await fetchJSON<any[]>(`/api/games${q}`);
      setGames((data || []).filter(g => g !== null && g !== undefined));
    } catch (error) {
      console.error('Błąd podczas pobierania meczów:', error);
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

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
          <GamesList games={games} loading={loading} />
        </section>
      </PageContainer>
    </div>
  );
}
