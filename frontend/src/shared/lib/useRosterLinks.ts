import { useEffect, useState } from 'react';
import { fetchJSON } from '../../lib/api';

type RosterRow = { id: string; kalkSlug?: string | null };

let cache: Promise<Map<string, string>> | null = null;

/** slug KALK → ID zawodnika w składzie (link do profilu). Jedno pobranie `/api/roster` na sesję. */
export function loadRosterLinks(): Promise<Map<string, string>> {
    cache ??= fetchJSON<RosterRow[]>('/api/roster')
        .then((rows) => new Map((rows || []).filter((r) => r.kalkSlug).map((r) => [r.kalkSlug as string, r.id])))
        .catch(() => {
            cache = null;
            return new Map<string, string>();
        });
    return cache;
}

export function useRosterLinks(): Map<string, string> {
    const [links, setLinks] = useState<Map<string, string>>(new Map());
    useEffect(() => {
        let active = true;
        loadRosterLinks().then((m) => active && setLinks(m));
        return () => {
            active = false;
        };
    }, []);
    return links;
}
