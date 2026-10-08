import { createContext, useContext } from 'react';
import type { Asset, Content, Partner, PostType, Project, SourceItem, Template } from '../../lib/types';

export type EditorContextValue = {
  project: Project;
  d: Content;
  readonly: boolean;
  busy: boolean;
  change: (next: Project) => void;
  field: <K extends keyof Content>(key: K, value: Content[K]) => void;
  setError: (message: string) => void;
  action: (fn: () => Promise<void>) => Promise<void>;
  assets: Asset[];
  partners: Partner[];
  players: SourceItem[];
  publication?: PostType;
  template?: Template;
};

export const EditorContext = createContext<EditorContextValue | null>(null);
export function useEditor() {
  const value = useContext(EditorContext);
  if (!value) throw new Error('useEditor outside GraphicEditor');
  return value;
}
