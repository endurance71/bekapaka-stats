import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, message, send } from '../../lib/api';
import { DESIGN_VERSION, projectSchema, projectTemplateVersion } from '../../lib/contracts';
import type { Content, Project, View } from '../../lib/types';

export type SaveState = 'saved' | 'saving' | 'invalid' | 'conflict' | 'failed';
export const saveLabels: Record<SaveState, string> = {
  saved: 'Zapisano',
  saving: 'Zapisywanie…',
  invalid: 'Popraw pola',
  conflict: 'Konflikt edycji',
  failed: 'Nie zapisano',
};
const AUTOSAVE_MS = 1200;
const UNDO_LIMIT = 40;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Owns the editable project, autosave with optimistic revisions and session undo.
// Every save creates an immutable server revision; approvals and exports pin to it.
export function useProjectDraft(initial: View, onError: (message: string) => void) {
  const [view, setView] = useState(initial);
  const [project, setProject] = useState<Project>(() => projectSchema.parse(initial.payload));
  const [saved, setSaved] = useState<SaveState>('saved');
  const [undoStack, setUndoStack] = useState<Project[]>([]);
  const latest = useRef(project);
  const server = useRef(initial);
  const saving = useRef<Promise<View> | null>(null);
  const mounted = useRef(true);
  const readonly = view.status === 'archived';

  const change = useCallback((next: Project) => {
    setUndoStack((u) => [...u.slice(-(UNDO_LIMIT - 1)), latest.current]);
    latest.current = next;
    setProject(next);
  }, []);
  const field = useCallback(
    <K extends keyof Content>(key: K, value: Content[K]) =>
      change({ ...latest.current, content: { ...latest.current.content, [key]: value } }),
    [change],
  );
  function undo() {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack(undoStack.slice(0, -1));
    latest.current = previous;
    setProject(previous);
  }

  const upToDate = () =>
    same(latest.current, server.current.payload) &&
    (latest.current.designVersion !== DESIGN_VERSION ||
      server.current.revision.templateVersion === projectTemplateVersion(latest.current));

  const flush = useCallback(async (): Promise<View> => {
    if (saving.current) {
      await saving.current.catch(() => undefined);
      return flush();
    }
    if (upToDate()) return server.current;
    const parsed = projectSchema.safeParse(latest.current);
    if (!parsed.success) {
      setSaved('invalid');
      throw new Error(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    }
    latest.current = parsed.data;
    setProject(parsed.data);
    setSaved('saving');
    const promise = send<View>(
      `/projects/${initial.id}`,
      { expectedRevision: server.current.currentRevision, project: parsed.data },
      'PUT',
    );
    saving.current = promise;
    try {
      const v = await promise;
      server.current = v;
      if (mounted.current) {
        setView(v);
        setSaved('saved');
      }
    } catch (err) {
      if (mounted.current) {
        setSaved(err instanceof ApiError && err.status === 409 ? 'conflict' : 'failed');
        onError(message(err));
      }
      throw err;
    } finally {
      saving.current = null;
    }
    return upToDate() ? server.current : flush();
  }, [initial.id, onError]);

  // Replace local state with a server view (conflict reload, restore from archive).
  const replace = useCallback((v: View) => {
    server.current = v;
    latest.current = v.payload;
    setProject(v.payload);
    setView(v);
    setSaved('saved');
    setUndoStack([]);
  }, []);

  useEffect(() => {
    mounted.current = true;
    const guard = (e: BeforeUnloadEvent) => {
      if (!same(latest.current, server.current.payload)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => {
      mounted.current = false;
      window.removeEventListener('beforeunload', guard);
    };
  }, []);

  useEffect(() => {
    if (readonly) return;
    const timer = window.setTimeout(() => void flush().catch(() => {}), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [project, readonly, flush]);

  return {
    view,
    setView,
    project,
    saved,
    readonly,
    change,
    field,
    undo,
    canUndo: undoStack.length > 0,
    flush,
    replace,
    dirty: () => !upToDate(),
    currentRevision: () => server.current.currentRevision,
  };
}
