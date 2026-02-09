import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeagueTableModern from '../features/league/LeagueTableModern';
import LeagueSchedule from '../features/league/LeagueScheduleModern';
import TopScorersModern from '../features/league/TopScorersModern';
import { Trophy, Calendar, Target, Activity } from 'lucide-react';
import { cn } from '../shared/lib/utils';

type Tab = 'table' | 'schedule' | 'scorers';

export default function League() {
    const [activeTab, setActiveTab] = useState<Tab>('table');

    const tabs = [
        { id: 'table' as Tab, label: 'Tabela', icon: Trophy, color: 'text-bkpk-warning' },
        { id: 'schedule' as Tab, label: 'Terminarz', icon: Calendar, color: 'text-bkpk-primary' },
        { id: 'scorers' as Tab, label: 'Liderzy', icon: Target, color: 'text-bkpk-success' },
    ];

    return (
        <div className="min-h-screen bg-bkpk-bg p-4 md:p-8 lg:p-12">
            <div className="max-w-[1400px] mx-auto space-y-12">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-bkpk-primary font-bold uppercase tracking-[0.2em] text-xs"
                        >
                            <Activity className="w-4 h-4" />
                            <span>Koszalińska Amatorska Liga Koszykówki</span>
                        </motion.div>
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
                            Oficjalna tabela i terminarz rozgrywek w sezonie 2025/26.
                        </motion.p>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 p-1.5 bg-bkpk-glass border border-bkpk-glass-border rounded-2xl w-fit">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all duration-300 font-bold text-sm uppercase tracking-wider",
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
                        {activeTab === 'table' && <LeagueTableModern />}
                        {activeTab === 'schedule' && (
                            <div className="bg-bkpk-glass border border-bkpk-glass-border rounded-bkpk-lg p-1 overflow-hidden">
                                <LeagueSchedule />
                            </div>
                        )}
                        {activeTab === 'scorers' && <TopScorersModern />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
