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
            className={`flex flex-col items-center justify-center p-12 bg-bkpk-surface-tint-2 border-2 border-dashed border-bkpk-border-strong rounded-3xl text-center gap-6 ${className}`}
        >
            <div className="relative">
                <div className="w-16 h-16 bg-bkpk-primary/10 rounded-full flex items-center justify-center">
                    <Database className="w-8 h-8 text-bkpk-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-bkpk-warning rounded-full flex items-center justify-center shadow-bkpk-glow">
                    <AlertCircle className="w-4 h-4 text-white" />
                </div>
            </div>

            <div className="max-w-md space-y-2">
                <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit uppercase tracking-tight">
                    {title}
                </h3>
                <p className="text-bkpk-text-muted text-sm leading-relaxed">
                    {message}
                </p>
            </div>

            <BkpkButton
                variant="primary"
                onClick={() => navigate('/administration')}
                className="group"
            >
                <RefreshCw className="w-4 h-4 mr-2 group-hover:animate-spin-slow" />
                Przejdź do Administracji
            </BkpkButton>
        </motion.div>
    );
}
