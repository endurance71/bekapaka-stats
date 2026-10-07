'use client'
import { useEffect, useState } from 'react'

function plural(value: number, one: string, few: string, many: string) {
  if (value === 1) return one
  const lastTwo = value % 100
  const last = value % 10
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few
  return many
}

/** Odliczanie do meczu: dni i godziny, aktualizacja co minutę (bez sekund — ruch obok danych rozprasza). */
export function Countdown({ date }: { date: string }) {
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Date.parse(date) - Date.now()))
    tick()
    const timer = setInterval(tick, 60000)
    return () => clearInterval(timer)
  }, [date])
  if (remaining === null) return <span className="match-countdown">—</span>
  if (!Number.isFinite(remaining) || remaining === 0) return <span className="match-countdown">czekamy na aktualizację</span>
  const days = Math.floor(remaining / 86400000)
  const hours = Math.floor((remaining % 86400000) / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const text =
    days > 0
      ? `${days} ${plural(days, 'dzień', 'dni', 'dni')} ${hours} godz.`
      : hours > 0
        ? `${hours} godz. ${minutes} min`
        : `${minutes} min`
  return <span className="match-countdown">{text}</span>
}
