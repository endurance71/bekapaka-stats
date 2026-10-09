import { useSearchParams } from 'react-router-dom';
import { Film } from 'lucide-react';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import { JerseyIcon } from '../shared/ui/BrandIcon';
import RosterGrid from '../components/players/RosterGrid';
import PlaybookSection from '../components/tactics/PlaybookSection';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { cn } from '../shared/lib/utils';

const TABS = [
    { id: 'sklad', label: 'Skład', icon: JerseyIcon },
    { id: 'zagrywki', label: 'Zagrywki', icon: Film },
] as const;
type TabId = (typeof TABS)[number]['id'];

/** „Drużyna”: skład (karty zawodników) i zagrywki (tablica). Zakładka w adresie: `?widok=zagrywki`. */
export default function TeamPage() {
    const [params, setParams] = useSearchParams();
    const tab: TabId = params.get('widok') === 'zagrywki' ? 'zagrywki' : 'sklad';
    const { selectedSeason } = useSeasonPreferenceContext();

    return (
        <PageContainer className="max-w-[1440px]">
            <PageHeader
                kicker="Drużyna"
                title="BeKaPaKa Bobolice"
                description={tab === 'sklad'
                    ? `Kadra${selectedSeason ? ` — ${selectedSeason.label}` : ''}. Wybierz zawodnika, aby zobaczyć jego statystyki.`
                    : 'Zagrywki drużyny na animowanej tablicy.'}
            />
            <div className="flex overflow-x-auto no-scrollbar max-w-full gap-6 sm:gap-8 border-b border-bkpk-border-subtle" role="tablist" aria-label="Drużyna">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setParams(t.id === 'sklad' ? {} : { widok: t.id }, { replace: true })}
                            className={cn(
                                'relative inline-flex items-center gap-2 min-h-[48px] shrink-0 whitespace-nowrap label-caps text-[13px] sm:text-sm transition-colors duration-200',
                                'after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-bkpk-primary after:origin-left after:transition-transform after:duration-200',
                                active ? 'text-bkpk-text-primary after:scale-x-100' : 'text-bkpk-text-muted hover:text-bkpk-text-primary after:scale-x-0'
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" aria-hidden />
                            {t.label}
                        </button>
                    );
                })}
            </div>
            {tab === 'sklad' ? <RosterGrid /> : <PlaybookSection />}
        </PageContainer>
    );
}
