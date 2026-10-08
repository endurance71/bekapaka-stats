import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, send } from '../../lib/api';
import { keys } from '../../lib/queries';
import type { AnyCopy, Item, Publication } from '../../lib/publications';

export function usePublication(id: string) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: keys.publication(id),
    queryFn: () => api<Publication>(`/publications/${id}`),
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const apply = useCallback(
    (view: Publication) => {
      client.setQueryData(keys.publication(id), view);
      void client.invalidateQueries({ queryKey: keys.publications });
    },
    [client, id],
  );
  const reload = useCallback(() => client.invalidateQueries({ queryKey: keys.publication(id) }), [client, id]);
  return { ...query, apply, reload };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Local copy of a channel variant with serialised autosave. The server trims and validates;
// the draft is not replaced by its own echo, only by changes made elsewhere (template, AI, agent).
export function useItemDraft(
  publicationId: string,
  item: Item,
  apply: (view: Publication) => void,
  onError: (message: string) => void,
) {
  const [draft, setDraft] = useState<AnyCopy>(item.copy);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const revision = useRef(item.revision);
  const dirtyRef = useRef(false);
  const inflight = useRef<Promise<unknown> | null>(null);

  useEffect(() => {
    if (item.revision === revision.current) return;
    revision.current = item.revision;
    if (!dirtyRef.current) setDraft(item.copy);
  }, [item.revision, item.copy]);

  const change = useCallback((patch: Partial<AnyCopy>) => {
    dirtyRef.current = true;
    setDirty(true);
    setDraft((d) => ({ ...d, ...patch }) as AnyCopy);
  }, []);

  const save = useCallback(async () => {
    if (inflight.current) await inflight.current.catch(() => undefined);
    if (!dirtyRef.current) return;
    const sent = draftRef.current;
    setSaving(true);
    const request = send<Publication>(
      `/publications/${publicationId}/items/${item.id}`,
      { expectedRevision: revision.current, copy: sent },
      'PUT',
    );
    inflight.current = request;
    try {
      const view = await request;
      const next = view.items.find((i) => i.id === item.id);
      if (next) revision.current = next.revision;
      if (same(draftRef.current, sent)) {
        dirtyRef.current = false;
        setDirty(false);
      }
      apply(view);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      inflight.current = null;
      setSaving(false);
    }
  }, [publicationId, item.id, apply, onError]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = window.setTimeout(() => void save(), 900);
    return () => window.clearTimeout(timer);
  }, [draft, save]);

  return { draft, change, saving, dirty, flush: save };
}
