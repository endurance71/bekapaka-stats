import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const enable = vi.fn()
const disable = vi.fn()

vi.mock('next/headers', () => ({
  draftMode: vi.fn(async () => ({ enable, disable })),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`) }),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

import { GET as preview } from '../app/api/preview/route'
import { GET as revalidateGet, POST as revalidatePost } from '../app/api/revalidate/route'
import { revalidatePath, revalidateTag } from 'next/cache'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.PREVIEW_SECRET = 'preview-test-secret'
  process.env.SITE_REVALIDATE_SECRET = 'revalidate-test-secret'
})

describe('CMS preview', () => {
  it('rejects an invalid secret', async () => {
    const response = await preview(new Request('http://localhost/api/preview?secret=wrong&url=%2Faktualnosci%2Ftest'))
    expect(response.status).toBe(401)
    expect(enable).not.toHaveBeenCalled()
  })

  it.each(['/\n/evil.example', '//evil.example', '/mecze/..\\evil.example', 'https://evil.example'])('rejects unsafe path %s', async (path) => {
    const request = new Request(`http://localhost/api/preview?secret=preview-test-secret&url=${encodeURIComponent(path)}`)
    expect((await preview(request)).status).toBe(400)
    expect(enable).not.toHaveBeenCalled()
  })

  it('enables a valid draft and redirects locally', async () => {
    const request = new Request('http://localhost/api/preview?secret=preview-test-secret&url=%2Faktualnosci%2Ftest')
    await expect(preview(request)).rejects.toThrow('redirect:/aktualnosci/test')
    expect(enable).toHaveBeenCalledOnce()
  })
})

describe('CMS revalidation', () => {
  it('rejects requests without the dedicated secret', async () => {
    const request = new NextRequest('http://localhost/api/revalidate?secret=wrong')
    expect((await revalidateGet(request)).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('accepts the webhook header and invalidates public CMS cache', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      headers: { 'x-revalidate-secret': 'revalidate-test-secret' },
    })
    expect((await revalidatePost(request)).status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith('cms-media', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('backend-games', { expire: 0 })
    expect(revalidatePath).toHaveBeenCalledWith('/aktualnosci/[slug]', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml')
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })
})
