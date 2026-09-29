import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { MailIcon } from '../../components/public/shared/PublicIcons'
import { FsmmSupportSection } from '../../components/public/support/FsmmSupportSection'
import { getSiteMetadataBase } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Klub | BeKaPaKa Bobolice',
  description: 'Historia, misja, wartości oraz informacje o stowarzyszeniu Bobolicki Klub Przyjaciół Koszykówki „Bekapaka”.'
}

export default function ClubPage() {
  return (
    <EditorialListingTemplate
      title='O klubie'
      description='Poznaj historię i działalność Bobolickiego Klubu Przyjaciół Koszykówki „Bekapaka”.'
      hasItems
      emptyTitle=''
      emptyDescription=''
    >
      <div className='club-page__stack'>
        <article className='club-page__card'>
          <h2>Kim jesteśmy?</h2>
          <p className='club-page__paragraph club-page__paragraph--spaced'>
            <strong>Bobolicki Klub Przyjaciół Koszykówki „Bekapaka”</strong> to stowarzyszenie zrzeszające pasjonatów i amatorów koszykówki z Bobolic oraz okolicznych miejscowości. Nasza drużyna regularnie reprezentuje miasto i gminę Bobolice w prestiżowych rozgrywkach <strong>Koszalińskiej Ligi Amatorskiej Koszykówki (KALK)</strong>, rywalizując na parkietach ZOS i KOSiR Koszalin.
          </p>
          <p className='club-page__paragraph'>
            Nie ograniczamy się jednak tylko do samej rywalizacji sportowej. Naszą nadrzędną ideą jest popularyzacja aktywnego trybu życia, integracja lokalnej społeczności oraz budowanie silnego, sportowego charakteru wśród dzieci, młodzieży i dorosłych.
          </p>
        </article>

        <article className='club-page__card'>
          <h2>Inicjatywy społeczne i Turnieje</h2>
          <p className='club-page__paragraph club-page__paragraph--spaced'>
            Jako stowarzyszenie chętnie angażujemy się w organizację lokalnych wydarzeń i projektów społecznych. Jesteśmy dumni z realizacji turniejów promujących sport w naszym subregionie.
          </p>
          <p className='club-page__paragraph'>
            Flagowym przykładem naszych działań jest współorganizacja <strong>Turnieju Koszykówki Społecznika</strong> (m.in. o Puchar Proboszcza), który odbywa się dzięki dofinansowaniu z Programu „Społecznik”. Wydarzenia te gromadzą rzesze kibiców, zawodników oraz całe rodziny, pokazując, jak wielką siłę ma wspólna pasja do sportu.
          </p>
        </article>

        <article className='club-page__card'>
          <h2>Nasza misja i wartości</h2>
          <ul className='club-page__values'>
            <li><strong>Pasja i zaangażowanie:</strong> Każdy trening i mecz to dla nas okazja do rozwoju i dawania z siebie 100%.</li>
            <li><strong>Wspólnota i integracja:</strong> Łączymy pokolenia bobolickich koszykarzy i kibiców.</li>
            <li><strong>Promocja zdrowia:</strong> Zachęcamy młodzież do wyboru aktywnej drogi życia i sportowej rywalizacji w duchu Fair Play.</li>
            <li><strong>Reprezentowanie regionu:</strong> Z dumą nosimy barwy klubu i promujemy gminę Bobolice na arenie regionalnej.</li>
          </ul>
        </article>

        <FsmmSupportSection variant='page' />

        <article className='club-page__card'>
          <h2>Kontakt</h2>
          <p className='club-page__paragraph club-page__paragraph--compact'>
            Chcesz do nas dołożyć cegiełkę, wesprzeć klub lub nawiązać współpracę sponsorską? Skontaktuj się z nami:
          </p>
          <p className='club-contact-line club-page__contact'>
            <MailIcon size={18} />
            <span>
              Email:{' '}
              <a href='mailto:kontakt@damianmotylinski.pl'>
                kontakt@damianmotylinski.pl
              </a>
            </span>
          </p>
        </article>
      </div>
    </EditorialListingTemplate>
  )
}
