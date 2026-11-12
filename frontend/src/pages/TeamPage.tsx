import { useSearchParams } from 'react-router-dom';
import { Film } from 'lucide-react';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import { JerseyIcon } from '../shared/ui/BrandIcon';
import RosterGrid from '../components/players/RosterGrid';
import PlaybookSection from '../components/tactics/PlaybookSection';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import PageTabs from '../shared/ui/PageTabs';
import { PLAYS_ENABLED } from '../shared/lib/featureFlags';

const TABS = [
    { id: 'sklad', label: 'Skład', icon: JerseyIcon },
    { id: 'zagrywki', label: 'Zagrywki', icon: Film },
] as const;
type TabId = (typeof TABS)[number]['id'];

/**
 * „Drużyna”: skład (karty zawodników) i zagrywki (tablica). Zakładka w adresie: `?widok=zagrywki`.
 * Zagrywki tylko przy VITE_PLAYS_ENABLED=true — bez flagi strona pokazuje sam skład, bez zakładek.
 */
export default function TeamPage() {
    const [params, setParams] = useSearchParams();
    const tab: TabId = PLAYS_ENABLED && params.get('widok') === 'zagrywki' ? 'zagrywki' : 'sklad';
    const { selectedSeason } = useSeasonPreferenceContext();

    return (
        <PageContainer>
            <PageHeader
                kicker="Drużyna"
                title="BeKaPaKa Bobolice"
                description={tab === 'sklad'
                    ? `Kadra${selectedSeason ? ` — ${selectedSeason.label}` : ''}. Wybierz zawodnika, aby zobaczyć jego statystyki.`
                    : 'Zagrywki drużyny na animowanej tablicy.'}
            />
            {PLAYS_ENABLED ? (
                <PageTabs
                    tabs={TABS}
                    active={tab}
                    onChange={(id) => setParams(id === 'sklad' ? {} : { widok: id }, { replace: true })}
                    label="Drużyna"
                />
            ) : null}
            {tab === 'sklad' ? <RosterGrid /> : <PlaybookSection />}
        </PageContainer>
    );
}
