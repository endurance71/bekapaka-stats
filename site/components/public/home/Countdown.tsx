'use client'
import { useEffect, useState } from 'react'
export function Countdown({ date }: { date: string }) {
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Date.parse(date) - Date.now()))
    tick(); const timer = setInterval(tick, 60000); return () => clearInterval(timer)
  }, [date])
  if (remaining === null) return <p className="match-countdown" aria-hidden="true">Do meczu: —</p>
  if (!Number.isFinite(remaining) || remaining === 0) return <p className="match-countdown">Czekamy na aktualizację terminu</p>
  return <p className="match-countdown">Do meczu: <strong>{Math.floor(remaining / 86400000)} dni {Math.floor(remaining % 86400000 / 3600000)} godz.</strong></p>
}
