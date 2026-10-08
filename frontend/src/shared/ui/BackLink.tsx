import type { MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * Powrót tam, skąd zawodnik przyszedł (historia w aplikacji); przy wejściu z linku / po odświeżeniu — `fallback`.
 * W PWA nie ma przycisku „wstecz” przeglądarki, więc to jedyna droga powrotu.
 */
export default function BackLink({ fallback, label = 'Wróć' }: { fallback: string; label?: string }) {
    const navigate = useNavigate();
    const location = useLocation();
    const hasHistory = location.key !== 'default';
    const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
        if (!hasHistory) return;
        e.preventDefault();
        navigate(-1);
    };
    return (
        <Link to={fallback} onClick={onClick} className="group inline-flex items-center gap-3 min-h-[44px] text-bkpk-text-secondary hover:text-bkpk-text-primary transition-colors">
            <div className="w-8 h-8 border border-bkpk-border-strong flex items-center justify-center group-hover:border-bkpk-text-primary transition-colors">
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="label-caps text-xs">{label}</span>
        </Link>
    );
}
