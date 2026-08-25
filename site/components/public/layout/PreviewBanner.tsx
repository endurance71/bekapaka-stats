import { draftMode } from 'next/headers'
import Link from 'next/link'

export async function PreviewBanner() {
  try {
    const { isEnabled } = await draftMode()
    if (!isEnabled) return null
  } catch {
    return null
  }

  return (
    <div className='preview-banner' role='status'>
      <span>Podgląd roboczy — ten wpis nie jest jeszcze publiczny.</span>
      <Link href='/api/preview/disable'>Zamknij podgląd</Link>
    </div>
  )
}
