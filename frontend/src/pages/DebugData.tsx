
import { useEffect, useState } from 'react';
import { fetchJSON } from '../lib/api';

export default function DebugData() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [table, setTable] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [s, t, p] = await Promise.all([
                    fetchJSON<any[]>('/api/league/schedule'),
                    fetchJSON<any[]>('/api/league/table'),
                    fetchJSON<any[]>('/api/players')
                ]);
                setSchedule(s || []);
                setTable(t || []);
                setPlayers(p || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="p-5 text-bkpk-text-secondary">Ładowanie danych diagnostycznych...</div>;
    if (error) return <div className="p-5 text-bkpk-danger">Błąd: {error}</div>;

    return (
        <div className="p-6 text-bkpk-text-primary space-y-8">
            <header className="space-y-2">
                <h1 className="text-2xl font-bold font-outfit">Diagnostyka Danych</h1>
                <p className="text-bkpk-text-muted">Ta strona wyświetla surowe dane pobrane z API. Jeśli tu są dane, a na Dashboardzie ich nie ma, problem leży w logice wyświetlania Dashboardu.</p>
            </header>

            <section className="space-y-4">
                <h2 className="text-xl font-bold text-bkpk-text-secondary">Terminarz (LeagueMatch) - {schedule.length} rekordów</h2>
                <div className="max-h-[400px] overflow-y-auto border border-bkpk-border-strong rounded-lg bg-bkpk-surface-tint-1">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-bkpk-surface-tint-2 text-bkpk-text-secondary uppercase text-xs tracking-wider sticky top-0">
                                <th className="p-3 font-bold text-left border-b border-bkpk-border-strong">Data</th>
                                <th className="p-3 font-bold text-left border-b border-bkpk-border-strong">Gospodarz</th>
                                <th className="p-3 font-bold text-left border-b border-bkpk-border-strong">Wynik</th>
                                <th className="p-3 font-bold text-left border-b border-bkpk-border-strong">Gość</th>
                                <th className="p-3 font-bold text-left border-b border-bkpk-border-strong">Ukończony?</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bkpk-border-strong">
                            {schedule.map((m) => (
                                <tr key={m.id} className="hover:bg-bkpk-surface-tint-2 transition-colors">
                                    <td className="p-3">{m.date}</td>
                                    <td className="p-3">{m.homeTeam}</td>
                                    <td className="p-3 font-mono">{m.scoreHome} : {m.scoreAway}</td>
                                    <td className="p-3">{m.guestTeam}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${m.isFinished ? 'bg-bkpk-success/20 text-bkpk-success' : 'bg-bkpk-warning/20 text-bkpk-warning'}`}>
                                            {m.isFinished ? 'TAK' : 'NIE'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-bold text-bkpk-text-secondary">Tabela Ligowa (LeagueTeam) - {table.length} rekordów</h2>
                <div className="max-h-[400px] overflow-y-auto border border-bkpk-border-strong rounded-lg bg-bkpk-surface-tint-1">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-bkpk-surface-tint-2 text-bkpk-text-secondary uppercase text-xs tracking-wider sticky top-0">
                                <th className="p-3 font-bold text-left border-b border-bkpk-border-strong">Poz</th>
                                <th className="p-3 font-bold text-left border-b border-bkpk-border-strong">Drużyna</th>
                                <th className="p-3 font-bold text-left border-b border-bkpk-border-strong">Mecze</th>
                                <th className="p-3 font-bold text-left border-b border-bkpk-border-strong">Ostatnia akt.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bkpk-border-strong">
                            {table.map((t) => (
                                <tr key={t.id} className="hover:bg-bkpk-surface-tint-2 transition-colors">
                                    <td className="p-3 font-bold">{t.position}</td>
                                    <td className="p-3 font-semibold text-bkpk-text-primary">{t.teamName}</td>
                                    <td className="p-3">{t.matches}</td>
                                    <td className="p-3 text-bkpk-text-muted text-xs">{t.updatedAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
