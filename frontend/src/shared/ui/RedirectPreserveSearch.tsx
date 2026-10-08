import { Navigate, useLocation } from 'react-router-dom';

/**
 * Przekierowanie starej ścieżki na nową z zachowaniem `?query` (np. `/scouting?opponent=…` → `/rywal?opponent=…`).
 * `extra` dokłada parametry, gdy nie ma ich w adresie (np. `widok=zagrywki`).
 */
export default function RedirectPreserveSearch({ to, extra }: { to: string; extra?: Record<string, string> }) {
    const { search, hash } = useLocation();
    const params = new URLSearchParams(search);
    for (const [k, v] of Object.entries(extra ?? {})) if (!params.has(k)) params.set(k, v);
    const qs = params.toString();
    return <Navigate to={`${to}${qs ? `?${qs}` : ''}${hash}`} replace />;
}
