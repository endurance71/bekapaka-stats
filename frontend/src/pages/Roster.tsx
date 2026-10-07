import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../lib/api';
import { motion } from 'framer-motion';
import PlayerCard from '../shared/ui/PlayerCard';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import { resolvePlayerPhoto } from '../shared/lib/playerUtils';

import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
  data?: any;
  kalkPlayer?: {
    raw?: {
      photo_url?: string | null;
    } | null;
  } | null;
  number: number;
  position: string;
  starter: boolean;
  ppg: number;
  rpg: number;
  apg: number;
}

export default function Roster() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { seasonId } = useSeasonPreferenceContext();

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const q = seasonId ? `&seasonId=${encodeURIComponent(seasonId)}` : '';
      const data = await fetchJSON<Player[]>(`/api/roster?t=${Date.now()}${q}`);
      setPlayers(data.sort((a, b) => a.number - b.number));
    } catch (error) {
      console.error('Error fetching roster:', error);
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  return (
    <div className="bg-bkpk-bg">
      <PageContainer>
        <PageHeader
          kicker="Personalia Drużyny"
          title="Skład"
          description="Poznaj kadrę BeKaPaKa Bobolice na sezon 2025/26. Szczegółowe statystyki i profile zawodników."
        />

        {/* Roster Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[3/4] bg-bkpk-surface border border-bkpk-border-subtle animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {players.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
              >
                <PlayerCard
                  {...player}
                  photoUrl={resolvePlayerPhoto(player)}
                  isStarter={player.starter}
                  onClick={(id) => navigate(`/players/${id}`)}
                />
              </motion.div>
            ))}

            {players.length === 0 && (
              <div className="col-span-full py-24 text-center bg-bkpk-surface border border-dashed border-bkpk-border-strong">
                <p className="font-display text-2xl uppercase text-bkpk-text-muted">Brak zawodników w składzie.</p>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
