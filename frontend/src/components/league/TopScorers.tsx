import { useEffect, useState } from 'react';
import { fetchJSON } from '../../lib/api';
import styles from './LeagueTable.module.css'; // Reusing table styles

type Scorer = {
    id: string;
    name: string;
    team: string;
    pointsTotal: number;
    pointsAverage: number;
    matchesPlayed: number;
};

export default function TopScorers() {
    const [scorers, setScorers] = useState<Scorer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJSON<Scorer[]>('/api/league/scorers?limit=20')
            .then(data => setScorers(data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Ładowanie rankingu...</div>;

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Zawodnik</th>
                        <th>Drużyna</th>
                        <th>Mecze</th>
                        <th>Suma Pkt</th>
                        <th>Średnia</th>
                    </tr>
                </thead>
                <tbody>
                    {scorers.map((player, index) => (
                        <tr key={player.id} className={player.team?.toLowerCase().includes('bekapaka') ? styles.highlight : ''}>
                            <td>{index + 1}</td>
                            <td className={styles.teamName}>{player.name}</td>
                            <td>{player.team}</td>
                            <td>{player.matchesPlayed}</td>
                            <td>{player.pointsTotal}</td>
                            <td className={styles.points}>{player.pointsAverage?.toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
