import { DESIGN_VERSION, projectTemplateVersion } from '../../lib/contracts';
import type { Project } from '../../lib/types';

// Key-order independent fingerprint of a payload. The server stores payloads as JSONB,
// which does not keep key order, so plain JSON.stringify can report a false difference.
export function payloadKey(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  );
}

export type SyncState = {
  latest: Project;
  server: { payload: Project; templateVersion: string };
  // payloadKey of the last payload the server accepted in this session.
  accepted: string | null;
};

// Decides whether autosave has to PUT the project.
// A payload the server already accepted is never sent again: every PUT creates an immutable
// revision, so re-sending identical content only piles up duplicates. This also covers a stale
// design key: when the server and this bundle compute different template versions (different
// engine builds), one re-save lets the server recompute the key; more cannot change anything.
export function needsSave({ latest, server, accepted }: SyncState): boolean {
  const key = payloadKey(latest);
  if (key === accepted) return false;
  if (key !== payloadKey(server.payload)) return true;
  return latest.designVersion === DESIGN_VERSION && server.templateVersion !== projectTemplateVersion(latest);
}

// True when the server kept a template version this bundle does not compute for the same payload.
export function engineMismatch(view: { payload: Project; templateVersion: string }): boolean {
  return view.payload.designVersion === DESIGN_VERSION && view.templateVersion !== projectTemplateVersion(view.payload);
}
