import { Link } from 'react-router-dom';
import BkpkCard from '../../shared/ui/BkpkCard';
import { FormBadges, StreakBadge } from '../../shared/ui/FormBadges';

export interface TeamStanding {
    position: number | null;
    matches: number;
    wins: number;
    losses: number;
    form: string[];
    streak: string | null;
}

/** Start → „Drużyna w tabeli”: miejsce, bilans W–P, forma i ile meczów zostało. */
export default function TeamStandingCard({ team, teamsInLeague, remainingGames, loading }: {
    team: TeamStanding | null;
    teamsInLeague: number;
    remainingGames: number;
    loading?: boolean;
}) {
    if (loading) return <div className="h-full min-h-[180px] bg-bkpk-surface border border-bkpk-border-subtle animate-pulse" />;
    return (
        <Link to="/league" className="block h-full">
            <BkpkCard variant="glass" hoverEffect className="h-full">
                <span className="kicker text-bkpk-text-primary">Drużyna w tabeli</span>
                {team ? (
                    <>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="font-display text-6xl leading-none tabular-nums text-bkpk-text-primary">{team.position ?? '–'}.</span>
                            <span className="text-sm text-bkpk-text-muted">miejsce{teamsInLeague ? ` z ${teamsInLeague}` : ''}</span>
                        </div>
                        <p className="mt-3 text-sm text-bkpk-text-secondary tabular-nums">
                            Bilans <strong className="text-bkpk-text-primary">{team.wins}–{team.losses}</strong>
                            {remainingGames > 0 ? ` · zostało ${remainingGames} ${remainingGames === 1 ? 'mecz' : remainingGames < 5 ? 'mecze' : 'meczów'}` : ''}
                        </p>
                        {team.form.length > 0 && (
                            <div className="mt-4 flex items-center gap-2">
                                <FormBadges form={team.form} />
                                <StreakBadge streak={team.streak} />
                            </div>
                        )}
                    </>
                ) : (
                    <p className="mt-4 text-sm text-bkpk-text-muted">Tabela pojawi się po pierwszych meczach sezonu.</p>
                )}
            </BkpkCard>
        </Link>
    );
}
