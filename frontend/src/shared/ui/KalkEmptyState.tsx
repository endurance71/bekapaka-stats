import { Database, AlertCircle, RefreshCw } from 'lucide-react';
import BkpkButton from './BkpkButton';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface KalkEmptyStateProps {
    title?: string;
    message?: string;
    className?: string;
}

export default function KalkEmptyState({
    title = "Brak danych z KALK",
    message = "Dane ligowe, statystyki i terminarz nie zostały jeszcze pobrane. Uruchom import w panelu administracyjnym.",
    className = ""
}: KalkEmptyStateProps) {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-start justify-center p-8 sm:p-12 bg-bkpk-surface border border-bkpk-border-subtle border-l-4 border-l-bkpk-warning gap-6 ${className}`}
        >
            <div className="relative">
                <div className="w-14 h-14 border border-bkpk-border-strong flex items-center justify-center">
                    <Database className="w-7 h-7 text-bkpk-text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-bkpk-warning flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-bkpk-bg" />
                </div>
            </div>

            <div className="max-w-md space-y-2">
                <h3 className="text-2xl text-bkpk-text-primary">
                    {title}
                </h3>
                <p className="text-bkpk-text-muted text-sm leading-relaxed">
                    {message}
                </p>
            </div>

            <BkpkButton
                variant="primary"
                onClick={() => navigate('/admin')}
                className="group"
            >
                <RefreshCw className="w-4 h-4 mr-2 group-hover:animate-spin-slow" />
                Przejdź do Administracji
            </BkpkButton>
        </motion.div>
    );
}
