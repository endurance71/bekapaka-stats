import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

const CMS_TAGS = ['cms', 'cms-news', 'cms-events', 'cms-documents', 'cms-homepage', 'cms-media', 'backend', 'backend-games', 'backend-table', 'backend-roster'] as const

function getProvidedSecret(request: NextRequest): string {
  const fromQuery = request.nextUrl.searchParams.get('secret') || ''
  const fromHeader = request.headers.get('x-revalidate-secret') || ''
  return fromQuery || fromHeader
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.SITE_REVALIDATE_SECRET || process.env.PREVIEW_SECRET || ''
  const provided = getProvidedSecret(request)
  return Boolean(expected) && provided === expected
}

function revalidatePublicCms() {
  for (const tag of CMS_TAGS) {
    revalidateTag(tag, { expire: 0 })
  }
  revalidatePath('/')
  revalidatePath('/aktualnosci')
  for (const path of ['/aktualnosci/[slug]', '/mecze/[slug]', '/sklad/[id]', '/wydarzenia/[slug]', '/dokumenty/[slug]']) revalidatePath(path, 'page')
  for (const path of ['/mecze', '/tabela', '/sklad', '/wydarzenia', '/dokumenty', '/sitemap.xml', '/api/og']) revalidatePath(path)
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new Response('Invalid token', { status: 401 })
  }

  revalidatePublicCms()
  return NextResponse.json({ revalidated: true, now: Date.now() })
}

/** Strapi webhook (POST) and manual curl (GET). */
export async function POST(request: NextRequest) {
  return handle(request)
}

export async function GET(request: NextRequest) {
  return handle(request)
}
