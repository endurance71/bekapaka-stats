import { useMemo } from 'react';
import { CardGrid } from '../../shared/ui/PageLayout';
import { useNavigate } from 'react-router-dom';
import { useCachedJSON } from '../../hooks/useCachedJSON';
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
    const navigate = useNavigate();
    const { seasonId } = useSeasonPreferenceContext();
    const q = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
    const rosterQ = useCachedJSON<Player[]>(`/api/roster${q}`);
    const players = useMemo(
        () => (rosterQ.data ?? []).map((p) => normalizePlayerIdentity(p)).sort((a, b) => (a.number || 999) - (b.number || 999)),
        [rosterQ.data],
    );
    const loading = rosterQ.loading;
    const error = Boolean(rosterQ.error) && !rosterQ.data;

    // Karty ~220 px: na telefonie zawsze 2 w rzędzie, na szerokim ekranie tyle, ile się zmieści
    const gridProps = { min: 'min(220px, calc((100% - 24px) / 2))', mode: 'fill' } as const;

    if (loading) {
        return (
            <CardGrid {...gridProps}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="aspect-[4/5] bg-bkpk-surface border border-bkpk-border-subtle animate-pulse" />
                ))}
            </CardGrid>
        );
    }

    if (error) {
        return <LoadError title="Nie udało się wczytać składu" onRetry={() => void rosterQ.reload()} />;
    }

    if (players.length === 0) {
        return (
            <div className="py-24 text-center bg-bkpk-surface border border-dashed border-bkpk-border-strong">
                <p className="font-display text-2xl uppercase text-bkpk-text-muted">Brak zawodników w składzie.</p>
            </div>
        );
    }

    return (
        <CardGrid {...gridProps}>
            {players.map((player) => (
                <PlayerCard key={player.id} {...player} photoUrl={resolvePlayerImage(player)} isStarter={player.starter} onClick={(id) => navigate(`/players/${id}`)} />
            ))}
        </CardGrid>
    );
}
