import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSeasonPreference } from '../hooks/useSeasonPreference';

type SeasonPreferenceValue = ReturnType<typeof useSeasonPreference>;

const SeasonPreferenceContext = createContext<SeasonPreferenceValue | null>(null);

export function SeasonPreferenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const value = useSeasonPreference(user?.id ?? 'app');

  return (
    <SeasonPreferenceContext.Provider value={value}>
      {children}
    </SeasonPreferenceContext.Provider>
  );
}

export function useSeasonPreferenceContext(): SeasonPreferenceValue {
  const ctx = useContext(SeasonPreferenceContext);
  if (!ctx) {
    throw new Error('useSeasonPreferenceContext wymaga SeasonPreferenceProvider');
  }
  return ctx;
}
