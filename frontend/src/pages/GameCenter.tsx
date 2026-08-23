import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../lib/api';
import GamesList from '../features/games/GamesList';
import { motion } from 'framer-motion';
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
    <div className="bg-bkpk-bg p-4 md:p-8 lg:p-10">
      <div className="max-w-[1200px] mx-auto space-y-12">
        {/* Header Section */}
        <header className="flex flex-col gap-2">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-bkpk-text-primary font-outfit"
          >
            Mecze
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-bkpk-text-muted text-lg"
          >
            Analiza meczów i box score z oficjalnej strony KALK
          </motion.p>
        </header>

        {/* Content Section */}
        <section>
          <GamesList games={games} loading={loading} />
        </section>
      </div>
    </div>
  );
}
