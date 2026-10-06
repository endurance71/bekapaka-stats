import { PreviewBanner } from '../../components/public/layout/PreviewBanner'

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PreviewBanner />
      {children}
    </>
  )
}
