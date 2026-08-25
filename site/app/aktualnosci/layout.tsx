import { PreviewBanner } from '../../components/public/layout/PreviewBanner'

export const dynamic = 'force-dynamic'

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PreviewBanner />
      {children}
    </>
  )
}
