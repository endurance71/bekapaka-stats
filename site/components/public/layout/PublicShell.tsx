import { ClubLogo } from '../shared/ClubLogo'
import { MainNav } from './MainNav'
import { SiteFooter } from './SiteFooter'

export function PublicShell({
  children,
  logoUrl
}: {
  children: React.ReactNode
  logoUrl?: string
}) {
  return (
    <>
      <a href='#content' className='skip-link'>
        Przejdz do tresci
      </a>
      <header className='site-header'>
        <div className='container site-header__inner'>
          <ClubLogo logoUrl={logoUrl} />
          <MainNav />
          <button className='ticket-cta' type='button'>Kup bilet</button>
        </div>
      </header>
      <main id='content' className='container'>
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
