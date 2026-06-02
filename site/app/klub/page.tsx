import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { MailIcon, MonitorIcon } from '../../components/public/shared/PublicIcons'
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
      <div className='stack-list' style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <article className='content-card' style={{ padding: 'var(--space-5)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2rem', color: 'var(--bkp-gold)', marginBottom: 'var(--space-3)' }}>Kim jesteśmy?</h2>
          <p style={{ lineHeight: '1.7', marginBottom: 'var(--space-4)' }}>
            <strong>Bobolicki Klub Przyjaciół Koszykówki „Bekapaka”</strong> to stowarzyszenie zrzeszające pasjonatów i amatorów koszykówki z Bobolic oraz okolicznych miejscowości. Nasza drużyna regularnie reprezentuje miasto i gminę Bobolice w prestiżowych rozgrywkach <strong>Koszalińskiej Ligi Amatorskiej Koszykówki (KALK)</strong>, rywalizując na parkietach ZOS i KOSiR Koszalin.
          </p>
          <p style={{ lineHeight: '1.7' }}>
            Nie ograniczamy się jednak tylko do samej rywalizacji sportowej. Naszą nadrzędną ideą jest popularyzacja aktywnego trybu życia, integracja lokalnej społeczności oraz budowanie silnego, sportowego charakteru wśród dzieci, młodzieży i dorosłych.
          </p>
        </article>

        <article className='content-card' style={{ padding: 'var(--space-5)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2rem', color: 'var(--bkp-gold)', marginBottom: 'var(--space-3)' }}>Inicjatywy społeczne i Turnieje</h2>
          <p style={{ lineHeight: '1.7', marginBottom: 'var(--space-4)' }}>
            Jako stowarzyszenie chętnie angażujemy się w organizację lokalnych wydarzeń i projektów społecznych. Jesteśmy dumni z realizacji turniejów promujących sport w naszym subregionie.
          </p>
          <p style={{ lineHeight: '1.7' }}>
            Flagowym przykładem naszych działań jest współorganizacja <strong>Turnieju Koszykówki Społecznika</strong> (m.in. o Puchar Proboszcza), który odbywa się dzięki dofinansowaniu z Programu „Społecznik”. Wydarzenia te gromadzą rzesze kibiców, zawodników oraz całe rodziny, pokazując, jak wielką siłę ma wspólna pasja do sportu.
          </p>
        </article>

        <article className='content-card' style={{ padding: 'var(--space-5)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2rem', color: 'var(--bkp-gold)', marginBottom: 'var(--space-3)' }}>Nasza misja i wartości</h2>
          <ul style={{ lineHeight: '1.7', paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <li><strong>Pasja i zaangażowanie:</strong> Każdy trening i mecz to dla nas okazja do rozwoju i dawania z siebie 100%.</li>
            <li><strong>Wspólnota i integracja:</strong> Łączymy pokolenia bobolickich koszykarzy i kibiców.</li>
            <li><strong>Promocja zdrowia:</strong> Zachęcamy młodzież do wyboru aktywnej drogi życia i sportowej rywalizacji w duchu Fair Play.</li>
            <li><strong>Reprezentowanie regionu:</strong> Z dumą nosimy barwy klubu i promujemy gminę Bobolice na arenie regionalnej.</li>
          </ul>
        </article>

        <article className='content-card' style={{ padding: 'var(--space-5)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2rem', color: 'var(--bkp-gold)', marginBottom: 'var(--space-3)' }}>Kontakt</h2>
          <p style={{ lineHeight: '1.7', marginBottom: 'var(--space-2)' }}>
            Chcesz do nas dołożyć cegiełkę, wesprzeć klub lub nawiązać współpracę sponsorską? Skontaktuj się z nami:
          </p>
          <p className='club-contact-line' style={{ marginBottom: 'var(--space-1)' }}>
            <MailIcon size={18} />
            <span>
              Email:{' '}
              <a href='mailto:kontakt@bekapaka.pl' style={{ color: 'var(--bkp-gold)', textDecoration: 'none', fontWeight: '600' }}>
                kontakt@bekapaka.pl
              </a>
            </span>
          </p>
          <p className='club-contact-line'>
            <MonitorIcon size={18} />
            <span>
              Panel administracyjny drużyny:{' '}
              <a href='https://panel.bekapaka.pl' target='_blank' rel='noreferrer' style={{ color: 'var(--bkp-gold)', textDecoration: 'none', fontWeight: '600' }}>
                panel.bekapaka.pl
              </a>
            </span>
          </p>
        </article>
      </div>
    </EditorialListingTemplate>
  )
}
