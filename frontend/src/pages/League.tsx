import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeagueTableModern from '../features/league/LeagueTableModern';
import LeagueSchedule from '../features/league/LeagueScheduleModern';
import TopScorersModern from '../features/league/TopScorersModern';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { Target } from 'lucide-react';
import { TrophyIcon as Trophy, CalendarIcon as Calendar } from '../shared/ui/BrandIcon';
import { cn } from '../shared/lib/utils';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';

type Tab = 'table' | 'schedule' | 'scorers';

export default function League() {
    const [activeTab, setActiveTab] = useState<Tab>('table');
    const { seasonId, selectedSeason } = useSeasonPreferenceContext();

    const tabs = [
        { id: 'table' as Tab, label: 'Tabela', icon: Trophy },
        { id: 'schedule' as Tab, label: 'Terminarz', icon: Calendar },
        { id: 'scorers' as Tab, label: 'Liderzy', icon: Target },
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

            {/* Zakładki — jak `.tabs` na bekapaka.pl: wersaliki, 3 px czerwone podkreślenie aktywnej */}
            <div className="flex overflow-x-auto no-scrollbar max-w-full gap-6 sm:gap-8 border-b border-bkpk-border-subtle">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative inline-flex items-center gap-2 min-h-[48px] shrink-0 whitespace-nowrap label-caps text-[13px] sm:text-sm transition-colors duration-200",
                                "after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-bkpk-primary after:origin-left after:transition-transform after:duration-200",
                                isActive
                                    ? "text-bkpk-text-primary after:scale-x-100"
                                    : "text-bkpk-text-muted hover:text-bkpk-text-primary after:scale-x-0"
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[600px]"
                >
                    {activeTab === 'table' && <LeagueTableModern seasonId={seasonId} />}
                    {activeTab === 'schedule' && (
                        <div className="border-t border-bkpk-border-subtle bg-bkpk-bg">
                            <LeagueSchedule seasonId={seasonId} />
                        </div>
                    )}
                    {activeTab === 'scorers' && <TopScorersModern seasonId={seasonId} />}
                </motion.div>
            </AnimatePresence>
        </PageContainer>
    );
}
