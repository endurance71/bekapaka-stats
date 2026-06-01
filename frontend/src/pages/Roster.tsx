import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../lib/api';
import { motion } from 'framer-motion';
import PlayerCard from '../shared/ui/PlayerCard';
import { useNavigate } from 'react-router-dom';
import { Users, Filter, Search } from 'lucide-react';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  kalkPlayer?: {
    raw?: {
      photo_url?: string | null;
    };
  };
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
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJSON<Player[]>(`/api/roster?t=${Date.now()}`);
      setPlayers(data.sort((a, b) => a.number - b.number));
    } catch (error) {
      console.error('Error fetching roster:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const filteredPlayers = players.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.number.toString().includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-bkpk-bg p-3 sm:p-4 md:p-8 lg:p-12">
      <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-12">

        {/* Header & Controls */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-8">
          <div className="space-y-1.5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-bkpk-primary font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Personalia Drużyny</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl md:text-5xl font-black font-outfit text-bkpk-text-primary tracking-tight"
            >
              Skład
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-bkpk-text-muted text-sm sm:text-lg max-w-xl"
            >
              Poznaj kadrę BeKaPaKa Bobolice na sezon 2025/26. Szczegółowe statystyki i profile zawodników.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bkpk-text-muted group-focus-within:text-bkpk-primary transition-colors" />
              <input
                type="text"
                placeholder="Szukaj zawodnika..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2 sm:py-3 bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl text-bkpk-text-primary placeholder:text-bkpk-text-muted outline-none focus:border-bkpk-primary focus:bg-bkpk-surface-tint-4 transition-all font-medium text-sm"
              />
            </div>
            <button className="p-2.5 sm:p-3.5 bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-4 transition-all">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </motion.div>
        </header>

        {/* Roster Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[3/4] bg-bkpk-surface-tint-2 animate-pulse rounded-bkpk-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
            {filteredPlayers.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
              >
                <PlayerCard
                  {...player}
                  photoUrl={player.kalkPlayer?.raw?.photo_url || null}
                  isStarter={player.starter}
                  onClick={(id) => navigate(`/players/${id}`)}
                />
              </motion.div>
            ))}

            {filteredPlayers.length === 0 && (
              <div className="col-span-full py-24 text-center bg-bkpk-surface-tint-2 border border-dashed border-bkpk-border-strong rounded-bkpk-lg">
                <p className="text-bkpk-text-muted font-medium text-lg italic">Nie znaleziono zawodników o podanych kryteriach.</p>
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
