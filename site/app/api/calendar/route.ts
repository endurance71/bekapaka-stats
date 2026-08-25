import { NextResponse, type NextRequest } from 'next/server'
import {
  buildIcsDocument,
  parseCalendarPayloadFromSearchParams,
  ICS_FILENAME
} from '../../../lib/calendar-ics'

export const dynamic = 'force-dynamic'

function icsResponse(ics: string, request: NextRequest): NextResponse {
  const ua = request.headers.get('user-agent') || ''
  const isIos = /iP(hone|ad|od)/i.test(ua)
  const disposition = isIos ? 'inline' : 'attachment'

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `${disposition}; filename="${ICS_FILENAME}"`,
      'Cache-Control': 'public, max-age=60',
      'X-Content-Type-Options': 'nosniff'
    }
  })
}

export async function GET(request: NextRequest) {
  const payload = parseCalendarPayloadFromSearchParams(request.nextUrl.searchParams)
  if (!payload) {
    return NextResponse.json({ error: 'Nieprawidłowe zapytanie' }, { status: 400 })
  }

  const ics = buildIcsDocument(payload)
  if (!ics) {
    return NextResponse.json({ error: 'Nie można utworzyć wpisu kalendarza' }, { status: 422 })
  }

  return icsResponse(ics, request)
}
