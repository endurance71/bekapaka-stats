import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

const ALLOWED_PREFIXES = ['/aktualnosci/', '/dokumenty/', '/mecze/']

function isSafePreviewPath(url: string): boolean {
  if (!url.startsWith('/') || url.startsWith('//')) return false
  if (url.includes('\\') || url.includes('://')) return false
  return ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const url = searchParams.get('url') || ''
  const status = searchParams.get('status')
  const previewSecret = process.env.PREVIEW_SECRET || ''

  if (!previewSecret || secret !== previewSecret) {
    return new Response('Invalid token', { status: 401 })
  }

  if (!isSafePreviewPath(url)) {
    return new Response('Invalid preview path', { status: 400 })
  }

  const draft = await draftMode()
  if (status === 'published') {
    draft.disable()
  } else {
    draft.enable()
  }

  redirect(url)
}
