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
        <div className="bg-bkpk-bg px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 lg:min-h-[100dvh]">
            <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-10">
                {/* Header Section (PageHeader renderuje własny <header>) */}
                <div className="flex flex-col gap-2">
                    {header}
                </div>

                {/* Hero Row - 3 Column Grid */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                >
                    {hero}
                </motion.section>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* <div>, nie <main> — Shell ma już jeden <main> na stronę */}
                    <div className="lg:col-span-8 space-y-8">
                        {main}
                    </div>

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
