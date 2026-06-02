import {
  DocumentsSection,
  EventsSection,
  HeroSection,
  HomepageCmsSections,
  NewsSection,
  RosterPreview,
  SponsorsSection
} from '../components/public-site'
import { getPublicSiteData } from '../lib/data'

export default async function HomePage() {
  const { documents, events, homepageSections, news, ourPosition, roster, sponsors } = await getPublicSiteData()

  return (
    <>
      <HeroSection teamStanding={ourPosition} />
      <HomepageCmsSections sections={homepageSections} />
      <NewsSection news={news.slice(0, 3)} />
      <EventsSection events={events.slice(0, 4)} />
      <RosterPreview roster={roster} />
      <SponsorsSection sponsors={sponsors.slice(0, 8)} />
      <DocumentsSection documents={documents} />
    </>
  )
}
