import { useState, useEffect, useSyncExternalStore } from 'react';

/**
 * Efficient mobile detection using matchMedia instead of resize events.
 * Only fires when the breakpoint boundary is actually crossed.
 */
export default function useIsMobile(breakpoint = 768): boolean {
  const query = `(max-width: ${breakpoint - 1}px)`;

  const subscribe = (callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Returns the current Tailwind breakpoint name */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const BREAKPOINTS: [Breakpoint, string][] = [
  ['2xl', '(min-width: 1536px)'],
  ['xl', '(min-width: 1280px)'],
  ['lg', '(min-width: 1024px)'],
  ['md', '(min-width: 768px)'],
  ['sm', '(min-width: 640px)'],
  ['xs', '(max-width: 639px)'],
];

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'xs';
    for (const [name, query] of BREAKPOINTS) {
      if (window.matchMedia(query).matches) return name;
    }
    return 'xs';
  });

  useEffect(() => {
    const mqls = BREAKPOINTS.map(([name, query]) => ({
      name,
      mql: window.matchMedia(query),
    }));

    const handler = () => {
      for (const { name, mql } of mqls) {
        if (mql.matches) { setBp(name); return; }
      }
      setBp('xs');
    };

    mqls.forEach(({ mql }) => mql.addEventListener('change', handler));
    return () => mqls.forEach(({ mql }) => mql.removeEventListener('change', handler));
  }, []);

  return bp;
}
