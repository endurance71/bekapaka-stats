import { createContext, useContext } from 'react';

export type Shell = { openNew: () => void; setError: (message: string) => void };
export const ShellContext = createContext<Shell>({ openNew: () => {}, setError: () => {} });
export const useShell = () => useContext(ShellContext);
