import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getAllNewsPosts, getAllEvents } from '../../../lib/data/cms'
import { getGameByIdState } from '../../../lib/data/backend'
export const runtime = 'nodejs'
export const revalidate = 60
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const type = params.get('type'),
    id = params.get('id') || ''
  let title = 'BeKaPaKa Bobolice',
    meta = 'Koszykówka · Bobolice'
  if (type === 'news') {
    const item = (await getAllNewsPosts()).find((item) => item.slug === id)
    if (!item) return new Response('Nie znaleziono', { status: 404 })
    title = item.title
    meta = 'Aktualności'
  }
  if (type === 'event') {
    const item = (await getAllEvents()).find((item) => item.slug === id)
    if (!item) return new Response('Nie znaleziono', { status: 404 })
    title = item.title
    meta = item.startAt
  }
  if (type === 'match') {
    const item = (await getGameByIdState(id)).data
    if (!item) return new Response('Nie znaleziono', { status: 404 })
    title = `BeKaPaKa — ${item.opponent}`
    meta =
      item.scoreUs != null && item.scoreThem != null
        ? `${item.scoreUs}:${item.scoreThem} · ${item.status}`
        : item.date
  }
  const [font, mark] = await Promise.all([
    readFile(path.join(process.cwd(), 'app/fonts/BarlowCondensed-ExtraBold.ttf')),
    readFile(path.join(process.cwd(), 'public/favicon-512.png'))
  ])
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        background: '#0B0B0B',
        color: '#F7F6F2',
        padding: 56,
        borderTop: '12px solid #D9142F',
        fontFamily: 'Barlow Condensed'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <img
          src={`data:image/png;base64,${mark.toString('base64')}`}
          width={140}
          height={140}
          alt=""
        />
        <span style={{ fontSize: 40, color: '#F4A816' }}>BEKAPAKA BOBOLICE</span>
      </div>
      <div style={{ display: 'flex', fontSize: 76, lineHeight: 1.05 }}>{title}</div>
      <div style={{ display: 'flex', fontSize: 32 }}>{meta} · bekapaka.pl</div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: 'Barlow Condensed', data: font, weight: 800 }] }
  )
}
