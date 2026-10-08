import { createContext, useContext } from 'react';
import type { NewPublicationPrefill } from '../features/publications/NewPublicationModal';

export type Shell = {
  openNew: () => void;
  openNewPublication: (prefill?: NewPublicationPrefill) => void;
  setError: (message: string) => void;
};
export const ShellContext = createContext<Shell>({
  openNew: () => {},
  openNewPublication: () => {},
  setError: () => {},
});
export const useShell = () => useContext(ShellContext);
