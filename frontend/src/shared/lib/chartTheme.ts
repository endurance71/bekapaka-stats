import type { CSSProperties } from 'react';

/**
 * Wspólny motyw wykresów (recharts) — Digital 2.0.
 * BeKaPaKa = czerwień marki, rywal/średnia = kamień, złoto tylko dla rekordu/lidera.
 * Kolor nigdy nie jest jedyną informacją: serie mają nazwy (legenda/tooltip) i różne style linii.
 */
export const chartColors = {
    /** Seria BeKaPaKa */
    team: 'var(--c-red-500)',
    /** Rywal, liga, średnia */
    opponent: 'var(--c-stone-200)',
    /** Druga seria drużyny (np. tempo) */
    secondary: 'var(--c-stone-400)',
    /** Rekord / lider / wyróżnienie */
    highlight: 'var(--c-gold-500)',
    positive: 'var(--c-green-400)',
    negative: 'var(--c-red-300)',
    grid: 'var(--c-ink-600)',
    axis: 'var(--c-stone-400)',
    cursor: 'rgb(247 246 242 / 0.04)',
} as const;

/** Paleta kategoryczna (serie skumulowane, segmenty) — kolejność stała. */
export const chartCategorical = [
    'var(--c-red-500)',
    'var(--c-stone-200)',
    'var(--c-gold-500)',
    'var(--c-green-400)',
    'var(--c-red-300)',
    'var(--c-stone-600)',
] as const;

export const chartAxisProps = {
    stroke: chartColors.axis,
    fontSize: 11,
    tickLine: false,
    axisLine: false,
} as const;

export const chartGridProps = {
    stroke: chartColors.grid,
    strokeDasharray: '2 4',
    vertical: false,
} as const;

export const chartTooltipStyle: CSSProperties = {
    backgroundColor: 'var(--c-ink-700)',
    border: '1px solid var(--c-ink-500)',
    borderTop: '2px solid var(--c-red-500)',
    borderRadius: 0,
    fontFamily: 'var(--font-text)',
    fontSize: '13px',
    color: 'var(--c-white)',
};

export const chartTooltipItemStyle: CSSProperties = {
    color: 'var(--c-white)',
    fontWeight: 600,
};

export const chartTooltipLabelStyle: CSSProperties = {
    color: 'var(--c-stone-400)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '11px',
};
