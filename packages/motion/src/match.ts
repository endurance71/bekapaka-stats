import { useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import metrics from './font-metrics.json';

/** Dane meczu dla wzorów. Wszystko poza podstawą pochodzi z faktów publikacji Studio - nic nie dopisujemy. */
export type Score = { us: number; them: number };
/** G: ujęcie z treningu - klip z public/footage/<dir>, od sekundy `from`, odcinki z tempem (1 = na żywo, 0,4 = zwolnienie). */
export type TrainingShot = {
  clip: string; from: number; segs: { rate: number; len: number }[];
  label?: string; title?: string; title2?: string; red?: boolean;
  /** Pieczątka na klatce `hit`; `hit` = klatka wsadu (błysk i wstrząs). */
  stamp?: string; hit?: number;
};
export type MatchProps = {
  /** Katalog public/generated/<posterId> z grafiką Studio (npm run prepare-match). */
  posterId: string;
  opponent: string;
  opponentShort?: string;
  /** ISO z przesunięciem strefy, np. 2026-11-07T16:50:00+01:00. */
  kickoff: string;
  venue: string;
  entry?: string;
  /** Np. „9. KOLEJKA KALK”. */
  round?: string;
  source?: string;
  /** A: podpis nad „WRACAMY” (np. „PO 3 TYGODNIACH”); bez niego hak to „GRAMY”. */
  comeback?: string;
  /** A: trzy wiersze puenty; ostatni na czerwono. */
  headline?: [string, string, string];
  /** A i B: mecze z tym rywalem, wynik BeKaPaKa pierwszy. */
  h2h?: { label?: string; results: (Score & { date: string })[] };
  /** B: dwa wiersze po przekreślonych wynikach. */
  rematch?: [string, string];
  /** C: sezon w liczbach. */
  season?: {
    label: string;
    scores: Score[];
    leader?: { firstName: string; lastName: string; perGame: number };
    unbeaten?: { group: string; count: number; withUs: boolean };
  };
  /** G: rolka z treningu przed meczem (napisy tylko z faktów publikacji). */
  training?: { dir: string; shots: TrainingShot[] };
  /** D: podpis tablicy; domyślnie „PLAN NA <DZIEŃ>”. */
  boardLabel?: string;
};

// ---------- daty po polsku (strefa z ISO meczu, nie z komputera) ----------
const DAYS = ['NIEDZIELA', 'PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA'];
const DAYS_ACC = ['NIEDZIELĘ', 'PONIEDZIAŁEK', 'WTOREK', 'ŚRODĘ', 'CZWARTEK', 'PIĄTEK', 'SOBOTĘ'];
const pad = (n: number) => String(n).padStart(2, '0');

export function when(kickoff: string) {
  const m = kickoff.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) throw new Error(`Zła data meczu: ${kickoff}`);
  const [, y, mo, d, h, mi] = m.map(Number);
  const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return {
    day: DAYS[dow],
    dayAcc: DAYS_ACC[dow],
    dm: `${pad(d)}.${pad(mo)}`,
    dmy: `${pad(d)}.${pad(mo)}.${y}`,
    time: `${pad(h)}:${pad(mi)}`,
  };
}

/** Odmiana liczebnika: 1 mecz, 2 mecze, 5 meczów. */
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return `${n} ${one}`;
  const t = n % 10, h = n % 100;
  return `${n} ${t >= 2 && t <= 4 && (h < 12 || h > 14) ? few : many}`;
}

export const record = (scores: Score[]) => ({
  games: scores.length,
  wins: scores.filter((s) => s.us > s.them).length,
  losses: scores.filter((s) => s.us < s.them).length,
  pointsFor: scores.reduce((a, s) => a + s.us, 0),
  pointsAgainst: scores.reduce((a, s) => a + s.them, 0),
});

// ---------- dopasowanie tekstu do szerokości (metryki fontów marki) ----------
type Role = keyof typeof metrics;
export function textWidth(text: string, size: number, role: Role = 'display', tracking = 0) {
  const table = metrics[role] as Record<string, number>;
  const chars = [...text];
  return chars.reduce((a, ch) => a + (table[ch] ?? 0.55) * size, 0) + tracking * Math.max(0, chars.length - 1);
}
/** Największy rozmiar ≤ size, przy którym tekst mieści się w maxWidth (skos -9° liczony jako zapas). */
export function fitSize(text: string, size: number, maxWidth: number, role: Role = 'display', trackingEm = 0) {
  const w = textWidth(text, size, role, size * trackingEm) + (role === 'display' ? size * 0.16 : 0);
  return w <= maxWidth ? size : Math.floor((size * maxWidth) / w);
}

// ---------- części grafiki Studio ----------
export type Parts = {
  defs: string; materialFile: string; materialTint: string; seams: string; ribbon: string; date: string;
  crest: string; rival: string; vs: string; chevrons: string[]; nameUs: string; nameThem: string;
  panelFill: string; panelLine: string; time: string; venue: string; entry: string; stripes: string[]; foot: string;
};
const cache = new Map<string, Promise<Parts>>();
export function useParts(posterId: string): Parts | null {
  const [parts, setParts] = useState<Parts | null>(null);
  const [handle] = useState(() => delayRender(`parts ${posterId}`));
  useEffect(() => {
    if (!cache.has(posterId)) {
      cache.set(posterId, fetch(staticFile(`generated/${posterId}/parts.json`)).then((r) => {
        if (!r.ok) throw new Error(`Brak public/generated/${posterId} - uruchom npm run prepare-match`);
        return r.json();
      }));
    }
    cache.get(posterId)!.then((p) => { setParts(p); continueRender(handle); }).catch(cancelRender);
  }, [posterId, handle]);
  return parts;
}
export const generated = (posterId: string, file: string) => staticFile(`generated/${posterId}/${file}`);
