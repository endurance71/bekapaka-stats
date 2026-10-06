import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

interface PlayByPlayEvent {
  time: string
  side: 'home' | 'away' | 'neutral'
  player?: string | null
  action: string
  score?: string | null
}

interface PlayByPlayPeriod {
  title: string
  events: PlayByPlayEvent[]
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cleanId = id.replace(/^kalk-/, '')

  // 1. Check local static file cache if available
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', `pbp-${cleanId}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    return NextResponse.json(parsed, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    })
  } catch {
    // If local file not found, try live KALK
  }

  // 2. Fetch live from KALK
  try {
    const kalkUrl = `https://www.kalk-koszalin.com/mecz/${cleanId}/akcja-po-akcji`
    const res = await fetch(kalkUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (BeKaPaKa Stats Scraper)'
      },
      next: { revalidate: 3600 }
    })

    if (!res.ok) {
      return NextResponse.json({ periods: [], error: 'Nie znaleziono przebiegu akcja po akcji w KALK' }, { status: 404 })
    }

    const html = await res.text()

    // Fallback lightweight regex parsing if cheerio/bs4 not in Next.js bundle
    // Matches period chunks
    const periodRegex = /<div class="game-play-period">([\s\S]*?)(?=(?:<div class="game-play-period">|<\/section>|$))/g
    const eventRegex = /<div class="game-play-event\s*([^"]*)">([\s\S]*?)<\/div>\s*<\/div>/g

    const periods: PlayByPlayPeriod[] = []
    let pMatch: RegExpExecArray | null

    while ((pMatch = periodRegex.exec(html)) !== null) {
      const pChunk = pMatch[1]
      const titleMatch = pChunk.match(/<h[23][^>]*>(.*?)<\/h[23]>/)
      const title = titleMatch ? titleMatch[1].trim() : 'Kwarta'

      const events: PlayByPlayEvent[] = []
      let evMatch: RegExpExecArray | null

      while ((evMatch = eventRegex.exec(pChunk)) !== null) {
        const cls = evMatch[1]
        const evBody = evMatch[2]

        const side: 'home' | 'away' | 'neutral' = cls.includes('is-home')
          ? 'home'
          : cls.includes('is-away')
            ? 'away'
            : 'neutral'

        const timeMatch = evBody.match(/<time>([^<]+)<\/time>/)
        const time = timeMatch ? timeMatch[1].trim() : ''

        const playerMatch = evBody.match(/<strong>([^<]+)<\/strong>/)
        const player = playerMatch ? playerMatch[1].trim() : null

        const actionMatch = evBody.match(/<span>([^<]+)<\/span>/)
        const action = actionMatch ? actionMatch[1].trim() : ''

        let score: string | null = null
        const scoreMatch = evBody.match(/<div[^>]*class="play-running-score"[^>]*>([\s\S]*?)<\/div>/)
        if (scoreMatch) {
          const bTags = [...scoreMatch[1].matchAll(/<b[^>]*>([^<]+)<\/b>/g)].map(m => m[1].trim())
          if (bTags.length >= 2) {
            score = `${bTags[0]}:${bTags[1]}`
          }
        }

        if (action || player) {
          events.push({
            time,
            side,
            player,
            action,
            score
          })
        }
      }

      if (events.length > 0) {
        periods.push({ title, events })
      }
    }

    return NextResponse.json(periods)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Błąd pobierania akcja po akcji'
    return NextResponse.json({ periods: [], error: errorMsg }, { status: 500 })
  }
}
