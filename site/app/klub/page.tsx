import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getSiteMetadataBase } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Klub | BeKaPaKa Bobolice',
  description: 'Misja, wartosci i kontakt do druzyny BeKaPaKa Bobolice.'
}

export default function ClubPage() {
  return (
    <EditorialListingTemplate
      title='Klub'
      description='BeKaPaKa Bobolice to amatorska druzyna koszykowki budujaca lokalna spolecznosc i sportowy charakter.'
      hasItems
      emptyTitle=''
      emptyDescription=''
    >
      <div className='stack-list'>
        <article className='content-card'>
          <h2>Nasza misja</h2>
          <p>Rozwijamy koszykowke w regionie, laczymy pokolenia i promujemy zdrowa rywalizacje.</p>
        </article>
        <article className='content-card'>
          <h2>Kontakt</h2>
          <p>Email: <a href='mailto:kontakt@bekapaka.pl'>kontakt@bekapaka.pl</a></p>
          <p>Panel druzyny: <a href='https://panel.bekapaka.pl'>panel.bekapaka.pl</a></p>
        </article>
      </div>
    </EditorialListingTemplate>
  )
}
