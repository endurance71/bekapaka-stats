import { useEffect, useState } from 'react';
import { fetchJSON } from '../../lib/api';
import styles from './LeagueSchedule.module.css';

type Match = {
    id: string;
    date: string;
    homeTeam: string;
    guestTeam: string;
    scoreHome: number | null;
    scoreAway: number | null;
    isFinished: boolean;
};

export default function LeagueSchedule() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJSON<Match[]>('/api/league/schedule')
            .then(data => setMatches(data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Ładowanie terminarza...</div>;

    return (
        <div className={styles.list}>
            {matches.map((match) => (
                <div key={match.id} className={`${styles.match} ${match.isFinished ? styles.finished : ''}`}>
                    <div className={styles.date}>
                        {new Date(match.date).toLocaleDateString('pl-PL', {
                            weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </div>
                    <div className={styles.teams}>
                        <span className={match.homeTeam.toLowerCase().includes('bekapaka') ? styles.highlight : ''}>
                            {match.homeTeam}
                        </span>
                        <div className={styles.score}>
                            {match.isFinished
                                ? `${match.scoreHome} - ${match.scoreAway}`
                                : 'vs'}
                        </div>
                        <span className={match.guestTeam.toLowerCase().includes('bekapaka') ? styles.highlight : ''}>
                            {match.guestTeam}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
