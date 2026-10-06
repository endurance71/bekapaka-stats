/** A missing statistic is different from a recorded zero. */
export type Stat = number | null | undefined
export const knownStat = (value: Stat): value is number => typeof value === 'number' && Number.isFinite(value)
export const displayStat = (value: Stat) => knownStat(value) ? String(value) : '—'
export function addStats(a: Stat, b: Stat): number | undefined {
  return knownStat(a) && knownStat(b) ? a + b : undefined
}
export function completeSum(values: Stat[]): number | undefined {
  return values.length && values.every(knownStat) ? values.reduce<number>((sum, value) => sum + value, 0) : undefined
}
export function shotLabel(made: Stat, attempted: Stat): string {
  return knownStat(made) && knownStat(attempted) ? `${made}/${attempted}` : '—'
}
export function shotPercentage(made: Stat, attempted: Stat): number | undefined {
  return knownStat(made) && knownStat(attempted) && attempted > 0 ? made / attempted * 100 : undefined
}
export function percentageLabel(made: Stat, attempted: Stat): string {
  const value = shotPercentage(made, attempted)
  return value == null ? '—' : `${Math.round(value * 10) / 10}%`
}
export function totalMinutes(values: Array<string | undefined>): string {
  const seconds = values.map(value => {
    if (!value || !/^\d+(?::[0-5]\d)?$/.test(value)) return undefined
    const [minutes, seconds = '0'] = value.split(':')
    return Number(minutes) * 60 + Number(seconds)
  })
  const total = completeSum(seconds)
  return total == null ? '—' : `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
