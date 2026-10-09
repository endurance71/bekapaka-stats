import { useSearchParams } from 'react-router-dom';
import LeagueTableModern from '../features/league/LeagueTableModern';
import LeagueSchedule from '../features/league/LeagueScheduleModern';
import TopScorersModern from '../features/league/TopScorersModern';
import AllTimeTableModern from '../features/league/AllTimeTableModern';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { Target, History } from 'lucide-react';
import { TrophyIcon as Trophy, CalendarIcon as Calendar } from '../shared/ui/BrandIcon';
import PageTabs from '../shared/ui/PageTabs';
import { MainAside } from '../shared/ui/PageLayout';
import NextRoundCard, { useNextRound } from '../features/league/NextRoundCard';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';

type Tab = 'table' | 'schedule' | 'scorers' | 'alltime';

export default function League() {
    // Zakładka w adresie (?widok=terminarz…) — link do konkretnej zakładki
    const [params, setParams] = useSearchParams();
    const TAB_PARAM: Record<Tab, string> = { table: 'tabela', schedule: 'terminarz', scorers: 'liderzy', alltime: 'wszech-czasow' };
    const fromParam = (Object.keys(TAB_PARAM) as Tab[]).find((t) => TAB_PARAM[t] === params.get('widok'));
    const activeTab: Tab = fromParam ?? 'table';
    const setActiveTab = (t: Tab) => setParams(t === 'table' ? {} : { widok: TAB_PARAM[t] }, { replace: true });
    const { seasonId, selectedSeason } = useSeasonPreferenceContext();
    // Tabela + najbliższa kolejka obok (szeroki ekran); terminarz z tej samej pamięci danych co zakładka
    const nextRoundData = useNextRound(seasonId);

    const tabs = [
        { id: 'table' as Tab, label: 'Tabela', icon: Trophy },
        { id: 'schedule' as Tab, label: 'Terminarz', icon: Calendar },
        { id: 'scorers' as Tab, label: 'Liderzy', icon: Target },
        { id: 'alltime' as Tab, label: 'Wszech czasów', icon: History },
    ];

    return (
        <PageContainer>
            <PageHeader
                title={<>Liga KALK <span className="text-bkpk-primary">Dywizja II</span></>}
                description={
                    selectedSeason
                        ? `Oficjalna tabela i terminarz — ${selectedSeason.label}.`
                        : 'Oficjalna tabela i terminarz rozgrywek.'
                }
            />

            <PageTabs tabs={tabs} active={activeTab} onChange={setActiveTab} label="Sekcje ligi" />

            {/* Content Area */}
            {/* Zakładka od razu, bez animacji wyjścia/wejścia */}
            <div className="min-h-[600px]">
                    {activeTab === 'table' &&
                        (nextRoundData ? (
                            <MainAside aside={<NextRoundCard round={nextRoundData} />} asideFrom="7xl">
                                <LeagueTableModern seasonId={seasonId} />
                            </MainAside>
                        ) : (
                            <LeagueTableModern seasonId={seasonId} />
                        ))}
                    {activeTab === 'schedule' && <LeagueSchedule seasonId={seasonId} />}
                    {activeTab === 'scorers' && <TopScorersModern seasonId={seasonId} />}
                    {activeTab === 'alltime' && <AllTimeTableModern />}
            </div>
        </PageContainer>
    );
}
