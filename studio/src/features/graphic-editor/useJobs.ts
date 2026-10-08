import { useCallback, useEffect, useState } from 'react';
import { api, message, query, send } from '../../lib/api';
import type { Job } from '../../lib/types';

const active = (job: Job | null) => !!job && ['queued', 'running'].includes(job.status);

export type Preview = { job: Job; format: string };

// Server-rendered preview of one format. A completed preview of each selected format
// for the current revision counts as "seen" before the owner may confirm the revision.
export function usePreview(
  projectId: string,
  revision: number,
  format: string,
  readonly: boolean,
  onError: (message: string) => void,
) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [seen, setSeen] = useState<Record<string, number>>({});

  const queue = useCallback(
    () => send<Job>(`/projects/${projectId}/jobs`, { kind: 'preview', format }).then((job) => ({ job, format })),
    [projectId, format],
  );

  useEffect(() => {
    let live = true;
    setPreview((p) => (p?.format === format ? p : null));
    if (readonly) {
      // Archived projects cannot queue renders; show the newest stored preview instead.
      api<Job | null>(`/projects/${projectId}/preview?${query({ format })}`)
        .then((job) => live && setPreview(job ? { job, format } : null))
        .catch((err) => live && onError(message(err)));
      return () => {
        live = false;
      };
    }
    const timer = window.setTimeout(() => {
      queue()
        .then((p) => live && setPreview(p))
        .catch((err) => live && onError(message(err)));
    }, 600);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [projectId, revision, format, readonly, queue, onError]);

  useEffect(() => {
    if (!preview) return;
    if (preview.job.status === 'completed') {
      setSeen((s) =>
        s[preview.format] === preview.job.revision ? s : { ...s, [preview.format]: preview.job.revision },
      );
      return;
    }
    if (!active(preview.job)) return;
    const timer = window.setTimeout(() => {
      api<Job>(`/jobs/${preview.job.id}`)
        .then((job) => setPreview((p) => (p?.job.id === job.id ? { ...p, job } : p)))
        .catch((err) => onError(message(err)));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [preview, onError]);

  return {
    preview: preview?.format === format ? preview.job : null,
    refresh: () => queue().then(setPreview),
    seenAt: (f: string, rev: number) => seen[f] === rev,
  };
}

// Export and AI jobs: poll until settled, then hand the final job to the caller once.
export function useJob(onSettled: (job: Job) => void, onError: (message: string) => void) {
  const [job, setJob] = useState<Job | null>(null);
  useEffect(() => {
    if (!job || !active(job)) return;
    const timer = window.setTimeout(() => {
      api<Job>(`/jobs/${job.id}`)
        .then((next) => {
          setJob(next);
          if (!active(next)) onSettled(next);
        })
        .catch((err) => onError(message(err)));
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [job, onSettled, onError]);
  return [job, setJob] as const;
}
