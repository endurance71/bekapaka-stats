import { isLocalMediaPreview } from '../../../../lib/data/media-review'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (isLocalMediaPreview()) return NextResponse.json({ ok: true, localPreview: true })
  try {
    const { slug } = await params
    const trimmedSlug = (slug || '').trim()
    if (!trimmedSlug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }

    const cmsBase = process.env.SITE_CMS_API_URL || 'http://localhost:1337'
    const response = await fetch(`${cmsBase}/api/news-posts/${encodeURIComponent(trimmedSlug)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })

    if (!response.ok) {
      return NextResponse.json({ ok: false, status: response.status }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    // Fail gracefully so client tracking never disrupts user experience
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
