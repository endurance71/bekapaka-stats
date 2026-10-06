import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAllNewsPosts, getNewsPostsState } from '../lib/data/cms'
import { serializeJsonLd } from '../lib/json-ld'
import { buildIcsDocument, highlightToCalendarPayload } from '../lib/calendar-ics'
import { isLocalMediaPreview } from '../lib/data/media-review'
function post(index: number) { return { id: index, title: `Wpis ${index}`, slug: `wpis-${index}`, content: 'Treść', publishedAt: '2026-10-01T12:00:00Z', coverImage: {url:'/uploads/a.jpg',width:1200,height:800} } }
afterEach(() => {vi.unstubAllGlobals();vi.unstubAllEnvs()})
describe('Published CMS reads and cache isolation',()=> {
 it('walks pagination beyond the first hundred records', async()=> {
  const fetchMock=vi.fn(async (url:string)=>new Response(JSON.stringify({data:url.includes('media-records') ? [] : url.includes('pagination[start]=100') ? [post(100)] : Array.from({length:100},(_,index)=>post(index))})))
  vi.stubGlobal('fetch',fetchMock); const items=await getAllNewsPosts();expect(items).toHaveLength(101);expect(items.some(item=>item.slug==='wpis-100')).toBe(true)
 })
 it('reads drafts without caching and hides unreviewed covers in published mode',async()=> {
  const fetchMock=vi.fn(async(url:string)=>new Response(JSON.stringify({data:url.includes('media-records') ? [] : [post(1)]})))
  vi.stubGlobal('fetch',fetchMock)
  const publicState=await getNewsPostsState();expect(publicState.data[0].coverImageUrl).toBeUndefined()
  await getNewsPostsState(20,{includeDrafts:true})
  const draftCall=fetchMock.mock.calls.find(call=>call[0].includes('status=draft')) as unknown as [string,{cache:string}]
  expect(draftCall[1].cache).toBe('no-store')
 })
 it('reflects publication/unpublication in the CMS index',async()=> {
  let published=true
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify({data:url.includes('media-records') || !published ? [] : [post(1)]}))))
  expect(await getAllNewsPosts()).toHaveLength(1);published=false;expect(await getAllNewsPosts()).toHaveLength(0)
 })
 it('enables image preview only for an explicit loopback origin',()=> {
  vi.stubEnv('SITE_MEDIA_PREVIEW','1');vi.stubEnv('SITE_BASE_URL','https://bekapaka.pl');expect(isLocalMediaPreview()).toBe(false)
  vi.stubEnv('SITE_BASE_URL','http://127.0.0.1:3100');expect(isLocalMediaPreview()).toBe(true)
 })
})
describe('Structured data and Warsaw calendar',()=> {
 it('escapes script delimiters while keeping the JSON value intact',()=> { const value={headline:'</script><img src=x>'};const json=serializeJsonLd(value);expect(json).not.toContain('<');expect(JSON.parse(json)).toEqual(value) })
 it.each([['2030-01-01T18:00:00+01:00','20300101T170000Z'],['2030-07-01T18:00:00+02:00','20300701T160000Z']])('preserves Warsaw date %s in UTC', (date,expected)=> {
  const payload=highlightToCalendarPayload({source:'kalk',at:date,game:{id:'42',date,opponent:'Rywal',venue:'KOSiR Koszalin'}})!
  const ics=buildIcsDocument(payload);expect(ics).toContain(`DTSTART:${expected}`);expect(ics).toContain('X-WR-TIMEZONE:Europe/Warsaw');expect(ics).toContain('LOCATION:KOSiR Koszalin')
 })
})
