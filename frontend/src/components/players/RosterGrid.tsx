import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchJSON } from '../../lib/api';
import PlayerCard from '../../shared/ui/PlayerCard';
import { resolvePlayerImage } from '../../shared/lib/playerUtils';
import { useSeasonPreferenceContext } from '../../context/SeasonPreferenceContext';
import { normalizePlayerIdentity } from '../../shared/lib/playerIdentity';
import LoadError from '../../shared/ui/LoadError';

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string | null;
    data?: any;
    kalkPlayer?: { raw?: { photo_url?: string | null } | null } | null;
    number: number;
    position: string;
    starter: boolean;
    ppg: number;
    rpg: number;
    apg: number;
    gamesPlayed?: number | null;
}

/** Drużyna → „Skład”: karty zawodników jak na bekapaka.pl (sezon z menu). */
export default function RosterGrid() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    const { seasonId } = useSeasonPreferenceContext();

    const fetchRoster = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const q = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
            const data = await fetchJSON<Player[]>(`/api/roster${q}`);
            setPlayers(data.map((p) => normalizePlayerIdentity(p)).sort((a, b) => (a.number || 999) - (b.number || 999)));
        } catch (err) {
            console.error('Error fetching roster:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [seasonId]);

    useEffect(() => {
        fetchRoster();
    }, [fetchRoster]);

    const grid = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10';

    if (loading) {
        return (
            <div className={grid}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="aspect-[4/5] bg-bkpk-surface border border-bkpk-border-subtle animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return <LoadError title="Nie udało się wczytać składu" onRetry={fetchRoster} />;
    }

    if (players.length === 0) {
        return (
            <div className="py-24 text-center bg-bkpk-surface border border-dashed border-bkpk-border-strong">
                <p className="font-display text-2xl uppercase text-bkpk-text-muted">Brak zawodników w składzie.</p>
            </div>
        );
    }

    return (
        <div className={grid}>
            {players.map((player, idx) => (
                <motion.div key={player.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(idx, 12) * 0.04, duration: 0.3 }}>
                    <PlayerCard {...player} photoUrl={resolvePlayerImage(player)} isStarter={player.starter} onClick={(id) => navigate(`/players/${id}`)} />
                </motion.div>
            ))}
        </div>
    );
}
