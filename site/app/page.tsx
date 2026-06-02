import {
  BentoGrid,
  DocumentsTile,
  EventsTile,
  HeroSection,
  HomepageCmsSectionsTile,
  NewsTile,
  RosterTile,
  SponsorsStrip,
  SponsorsTile,
  StandingTile
} from '../components/public-site'
import { getPublicSiteData } from '../lib/data'

export default async function HomePage() {
  const { documents, events, homepageSections, news, ourPosition, roster, sponsors } = await getPublicSiteData()
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: 'BeKaPaKa Bobolice',
    sport: 'Basketball',
    url: 'https://bekapaka.pl'
  }

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <BentoGrid>
        <HeroSection teamStanding={ourPosition} />
        <StandingTile teamStanding={ourPosition} />
        <EventsTile events={events.slice(0, 4)} />
        <NewsTile news={news.slice(0, 4)} />
        <RosterTile roster={roster} />
        <SponsorsTile sponsors={sponsors.slice(0, 8)} />
        <DocumentsTile documents={documents} />
        <HomepageCmsSectionsTile sections={homepageSections} />
      </BentoGrid>
      <SponsorsStrip sponsors={sponsors} />
    </>
  )
}
