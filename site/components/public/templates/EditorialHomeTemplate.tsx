import type { EventItem, HomepageSection, NewsPost, RosterPlayer, SponsorItem, TeamStanding } from '../../../lib/data'
import {
  BentoGrid,
  EventsTile,
  HeroSection,
  HomepageCmsSectionsTile,
  NewsTile,
  RosterTile,
  SponsorsTile,
  StandingTile
} from '../../public-site'
import { SponsorsStrip } from '../sponsors/SponsorsStrip'

export function EditorialHomeTemplate({
  events,
  homepageSections,
  news,
  roster,
  sponsors,
  ourPosition
}: {
  events: EventItem[]
  homepageSections: HomepageSection[]
  news: NewsPost[]
  roster: RosterPlayer[]
  sponsors: SponsorItem[]
  ourPosition?: TeamStanding
}) {
  return (
    <>
      <BentoGrid>
        <HeroSection teamStanding={ourPosition} />
        <StandingTile teamStanding={ourPosition} />
        <EventsTile events={events.slice(0, 4)} />
        <NewsTile news={news.slice(0, 4)} />
        <RosterTile roster={roster} />
        <SponsorsTile sponsors={sponsors.slice(0, 8)} />
        <HomepageCmsSectionsTile sections={homepageSections} />
      </BentoGrid>
      <SponsorsStrip sponsors={sponsors} />
    </>
  )
}
