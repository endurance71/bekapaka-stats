import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { postJSON } from '../lib/api';

/** Ścieżka do zliczenia: adres strony + zakładka (`?widok=`), bez pozostałych parametrów. */
export function pageViewPath(pathname: string, search: string): string {
  const view = new URLSearchParams(search).get('widok');
  return view ? `${pathname}?widok=${encodeURIComponent(view)}` : pathname;
}

/**
 * Odsłony stron panelu do analityki w Administracji (dane tylko w naszej bazie).
 * Jedna odsłona na zmianę strony lub zakładki; błąd wysyłki nie przeszkadza w korzystaniu z panelu.
 */
export function usePageViewTracking() {
  const { pathname, search } = useLocation();
  const path = pageViewPath(pathname, search);
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (lastSent.current === path) return;
    lastSent.current = path;
    postJSON('/api/activity/view', { path }).catch(() => {});
  }, [path]);
}
