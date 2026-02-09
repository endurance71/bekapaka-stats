import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
    header: ReactNode;
    hero: ReactNode;
    main: ReactNode;
    sidebar?: ReactNode;
}

export default function DashboardLayout({ header, hero, main, sidebar }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-bkpk-bg p-4 md:p-8 lg:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header Section */}
                <header className="flex flex-col gap-2">
                    {header}
                </header>

                {/* Hero Row - 3 Column Grid */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {hero}
                </motion.section>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <main className="lg:col-span-8 space-y-8">
                        {main}
                    </main>

                    {sidebar && (
                        <aside className="lg:col-span-4 space-y-8">
                            {sidebar}
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
}
