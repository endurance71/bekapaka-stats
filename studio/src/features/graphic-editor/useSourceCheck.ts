import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { snapshotPath } from '../../lib/sources';
import type { Snapshot, Source } from '../../lib/types';

// Watches the imported source; a changed hash offers a diff, never an automatic overwrite.
export function useSourceCheck(source: Source) {
  const [diff, setDiff] = useState<Snapshot | null>(null);
  const ref = useRef(source);
  ref.current = source;
  // Saving re-parses the project, so the object identity changes on every revision; the identity of the source does not.
  const key = JSON.stringify([source.kind, source.id, source.seasonId, source.subjectId, source.view, source.hash]);

  const check = useCallback(async () => {
    const result = await api<Snapshot>(snapshotPath(ref.current));
    if (result.source.hash === ref.current.hash) return false;
    setDiff(result);
    return true;
  }, []);

  useEffect(() => {
    if (ref.current.kind === 'manual' || !ref.current.id) return;
    let live = true;
    const run = () =>
      api<Snapshot>(snapshotPath(ref.current))
        .then((r) => live && r.source.hash !== ref.current.hash && setDiff(r))
        // Source outage leaves the saved snapshot usable.
        .catch(() => undefined);
    void run();
    const timer = window.setInterval(run, 60_000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [key]);

  return { diff, setDiff, check };
}
