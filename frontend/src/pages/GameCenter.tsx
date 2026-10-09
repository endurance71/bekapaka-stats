import GamesList from '../features/games/GamesList';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import LoadError from '../shared/ui/LoadError';
import RefreshChip from '../shared/ui/RefreshChip';
import { useCachedJSON } from '../hooks/useCachedJSON';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus';

export default function GameCenter() {
  const { seasonId } = useSeasonPreferenceContext();
  // Pamięć między stronami: po powrocie z meczu lista jest od razu, świeże dane dociągają się w tle
  const { data, loading, error, reload, refreshing, updatedAt } = useCachedJSON<any[]>(
    `/api/games${seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : ''}`
  );
  const games = (data || []).filter((g) => g !== null && g !== undefined);
  useRefetchOnFocus(() => void reload());

  return (
    <div className="bg-bkpk-bg">
      <PageContainer width="narrow" className="max-w-[1200px]">
        <PageHeader
          kicker="Sezon"
          title="Mecze"
          description="Wyniki, statystyki zawodników i przebieg meczów z oficjalnej strony KALK"
          actions={<RefreshChip updatedAt={updatedAt} refreshing={refreshing} onRefresh={() => void reload()} />}
        />

        {/* Content Section */}
        <section>
          {error && !loading ? (
            <LoadError title="Nie udało się wczytać meczów" error={error} onRetry={() => void reload()} />
          ) : (
            <GamesList games={games} loading={loading} />
          )}
        </section>
      </PageContainer>
    </div>
  );
}
