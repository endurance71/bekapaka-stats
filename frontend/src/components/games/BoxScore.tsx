import styles from './BoxScore.module.css';

interface PlayerStat {
    name: string;
    minutes?: number;
    points?: number;
    rebounds?: number;
    assists?: number;
    steals?: number;
    blocks?: number;
    turnovers?: number;
    fg?: string;  // "9/15"
    threeP?: string;  // "3/7"
    ft?: string;  // "3/4"
}

interface BoxScoreProps {
    playerStats: PlayerStat[];
    loading?: boolean;
}

export default function BoxScore({ playerStats, loading }: BoxScoreProps) {
    if (loading) {
        return (
            <div className={styles.loading}>
                Ładowanie statystyk...
            </div>
        );
    }

    if (!playerStats || playerStats.length === 0) {
        return (
            <div className={styles.empty}>
                <p>Brak szczegółowych statystyk dla tego meczu</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Box Score</h3>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.playerCol}>Zawodnik</th>
                            <th>MIN</th>
                            <th>PTS</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TO</th>
                            <th>FG</th>
                            <th>3P</th>
                            <th>FT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {playerStats.map((player, index) => (
                            <tr key={index}>
                                <td className={styles.playerName}>{player.name}</td>
                                <td>{player.minutes ?? '-'}</td>
                                <td className={styles.highlight}>{player.points ?? '-'}</td>
                                <td>{player.rebounds ?? '-'}</td>
                                <td>{player.assists ?? '-'}</td>
                                <td>{player.steals ?? '-'}</td>
                                <td>{player.blocks ?? '-'}</td>
                                <td>{player.turnovers ?? '-'}</td>
                                <td className={styles.shooting}>{player.fg ?? '-'}</td>
                                <td className={styles.shooting}>{player.threeP ?? '-'}</td>
                                <td className={styles.shooting}>{player.ft ?? '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <strong>MIN</strong> - Minuty
                </div>
                <div className={styles.legendItem}>
                    <strong>PTS</strong> - Punkty
                </div>
                <div className={styles.legendItem}>
                    <strong>REB</strong> - Zbiórki
                </div>
                <div className={styles.legendItem}>
                    <strong>AST</strong> - Asysty
                </div>
                <div className={styles.legendItem}>
                    <strong>STL</strong> - Przechwyty
                </div>
                <div className={styles.legendItem}>
                    <strong>BLK</strong> - Bloki
                </div>
                <div className={styles.legendItem}>
                    <strong>TO</strong> - Straty
                </div>
                <div className={styles.legendItem}>
                    <strong>FG</strong> - Rzuty z gry (celne/wszystkie)
                </div>
                <div className={styles.legendItem}>
                    <strong>3P</strong> - Trójki (celne/wszystkie)
                </div>
                <div className={styles.legendItem}>
                    <strong>FT</strong> - Rzuty wolne (celne/wszystkie)
                </div>
            </div>
        </div>
    );
}
