import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface DashboardCardProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
}

export default function DashboardCard({ title, icon, children, className }: DashboardCardProps) {
    return (
        <div className={clsx(
            "bg-bkpk-surface-elevated rounded-bkpk-md p-5 shadow-sm transition-all duration-200",
            "hover:-translate-y-0.5 hover:shadow-md",
            className
        )}>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-bkpk-border-strong">
                {icon && <span className="text-2xl flex items-center justify-center">{icon}</span>}
                <h2 className="m-0 text-lg font-semibold text-bkpk-text-primary font-outfit">{title}</h2>
            </div>
            <div className="text-bkpk-text-secondary">
                {children}
            </div>
        </div>
    );
}
