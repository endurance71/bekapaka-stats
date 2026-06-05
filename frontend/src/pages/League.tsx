import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeagueTableModern from '../features/league/LeagueTableModern';
import LeagueSchedule from '../features/league/LeagueScheduleModern';
import TopScorersModern from '../features/league/TopScorersModern';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { Trophy, Calendar, Target } from 'lucide-react';
import { cn } from '../shared/lib/utils';

type Tab = 'table' | 'schedule' | 'scorers';

export default function League() {
    const [activeTab, setActiveTab] = useState<Tab>('table');
    const { seasonId, selectedSeason } = useSeasonPreferenceContext();

    const tabs = [
        { id: 'table' as Tab, label: 'Tabela', icon: Trophy, color: 'text-bkpk-warning' },
        { id: 'schedule' as Tab, label: 'Terminarz', icon: Calendar, color: 'text-bkpk-primary' },
        { id: 'scorers' as Tab, label: 'Liderzy', icon: Target, color: 'text-bkpk-success' },
    ];

    return (
        <div className="bg-bkpk-bg p-4 md:p-8 lg:p-12">
            <div className="max-w-[1400px] mx-auto space-y-12">

                {/* Header Section */}
                <header className="space-y-2">
                    <div className="space-y-2">
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-black font-outfit text-bkpk-text-primary tracking-tight"
                        >
                            Liga KALK <span className="text-bkpk-primary">Dywizja II</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-bkpk-text-muted text-lg max-w-xl"
                        >
                            {selectedSeason
                                ? `Oficjalna tabela i terminarz — ${selectedSeason.label}.`
                                : 'Oficjalna tabela i terminarz rozgrywek.'}
                        </motion.p>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex overflow-x-auto no-scrollbar max-w-full justify-start sm:justify-start gap-2 p-1 bg-bkpk-glass border border-bkpk-glass-border rounded-xl w-full sm:w-fit shrink-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-bold text-xs sm:text-sm uppercase tracking-wider shrink-0",
                                    isActive
                                        ? "bg-bkpk-surface-tint-4 text-bkpk-text-primary shadow-bkpk-glow"
                                        : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? tab.color : "")} />
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
                            <div className="bg-bkpk-glass border border-bkpk-glass-border rounded-bkpk-lg p-1 overflow-hidden">
                                <LeagueSchedule seasonId={seasonId} />
                            </div>
                        )}
                        {activeTab === 'scorers' && <TopScorersModern seasonId={seasonId} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
