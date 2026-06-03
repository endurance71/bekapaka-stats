import { useEffect, useState } from 'react';
import { fetchJSON } from '../../lib/api';
import { clsx } from 'clsx';

type Team = {
    name: string;
    matches: number;
    points: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
};

export default function LeagueTable() {
    const [table, setTable] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJSON<Team[]>('/api/league/table')
            .then(data => setTable(data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-4 text-center text-bkpk-text-secondary">Ładowanie tabeli...</div>;

    return (
        <div className="overflow-x-auto rounded-bkpk-md border border-bkpk-border-strong bg-bkpk-surface">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-bkpk-surface-tint-2">
                        <th className="p-3 text-center font-semibold text-bkpk-text-secondary border-b border-bkpk-border-strong">#</th>
                        <th className="p-3 text-left font-semibold text-bkpk-text-secondary border-b border-bkpk-border-strong">Drużyna</th>
                        <th className="p-3 text-center font-semibold text-bkpk-text-secondary border-b border-bkpk-border-strong">Mecze</th>
                        <th className="p-3 text-center font-semibold text-bkpk-text-secondary border-b border-bkpk-border-strong">Pkt</th>
                        <th className="p-3 text-center font-semibold text-bkpk-text-secondary border-b border-bkpk-border-strong">Z</th>
                        <th className="p-3 text-center font-semibold text-bkpk-text-secondary border-b border-bkpk-border-strong">P</th>
                        <th className="p-3 text-center font-semibold text-bkpk-text-secondary border-b border-bkpk-border-strong">Rzucone</th>
                        <th className="p-3 text-center font-semibold text-bkpk-text-secondary border-b border-bkpk-border-strong">Stracone</th>
                        <th className="p-3 text-center font-semibold text-bkpk-text-secondary border-b border-bkpk-border-strong">+/-</th>
                    </tr>
                </thead>
                <tbody>
                    {table.map((team, index) => {
                        const isUs = team.name.toLowerCase().includes('bekapaka');
                        return (
                            <tr
                                key={team.name}
                                className={clsx(
                                    "border-b border-bkpk-border-strong last:border-0 transition-colors hover:bg-bkpk-surface-tint-1",
                                    isUs ? "bg-bkpk-primary/10" : ""
                                )}
                            >
                                <td className="p-3 text-center text-bkpk-text-secondary">{index + 1}</td>
                                <td className={clsx("p-3 text-left font-semibold", isUs ? "text-bkpk-primary" : "text-bkpk-text-primary")}>
                                    {team.name}
                                </td>
                                <td className="p-3 text-center text-bkpk-text-primary">{team.matches}</td>
                                <td className="p-3 text-center font-bold text-bkpk-warning">{team.points}</td>
                                <td className="p-3 text-center text-bkpk-text-primary">{team.wins}</td>
                                <td className="p-3 text-center text-bkpk-text-primary">{team.losses}</td>
                                <td className="p-3 text-center text-bkpk-text-secondary">{team.pointsFor}</td>
                                <td className="p-3 text-center text-bkpk-text-secondary">{team.pointsAgainst}</td>
                                <td className={clsx(
                                    "p-3 text-center font-medium",
                                    (team.pointsFor - team.pointsAgainst) > 0 ? "text-bkpk-success" : "text-bkpk-text-danger"
                                )}>
                                    {team.pointsFor - team.pointsAgainst}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
