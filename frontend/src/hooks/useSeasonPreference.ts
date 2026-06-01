import { useCallback, useEffect, useState } from 'react';
import { fetchJSON, putJSON } from '../lib/api';

export interface KalkSeasonOption {
  id: string;
  slug: string;
  label: string;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

const storageKey = (playerId: string) => `bkpk-season-${playerId}`;

export function useSeasonPreference(playerId: string | undefined) {
  const [seasons, setSeasons] = useState<KalkSeasonOption[]>([]);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchJSON<KalkSeasonOption[]>('/api/seasons');
        if (cancelled) return;
        setSeasons(list);
        const active = list.find((s) => s.isActive) ?? list[0];
        const stored = playerId ? localStorage.getItem(storageKey(playerId)) : null;
        const initial = stored && list.some((s) => s.id === stored) ? stored : active?.id ?? null;
        setSeasonId(initial);
      } catch (e) {
        console.error('seasons load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const handleSeasonChange = useCallback(
    async (nextId: string) => {
      setSeasonId(nextId);
      if (playerId) {
        localStorage.setItem(storageKey(playerId), nextId);
        try {
          await putJSON(`/api/players/${playerId}/season`, { seasonId: nextId });
        } catch (e) {
          console.warn('Nie zapisano preferencji sezonu na serwerze (możliwy brak logowania)', e);
        }
      }
    },
    [playerId]
  );

  const selectedSeason = seasons.find((s) => s.id === seasonId) ?? null;

  return {
    seasons,
    seasonId,
    selectedSeason,
    loading,
    setSeasonId: handleSeasonChange
  };
}
