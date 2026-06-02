import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getRecentGamesState, getSiteMetadataBase } from '../../lib/data'
import { MatchesList } from './MatchesList'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Mecze | BeKaPaKa Bobolice',
  description: 'Terminarz spotkań, wyniki meczów oraz taktyczne analizy AI drużyny BeKaPaKa Bobolice.'
}

export default async function MatchesPage() {
  const gamesState = await getRecentGamesState(100)
  const games = gamesState.data

  return (
    <EditorialListingTemplate
      title='Terminarz i wyniki'
      description='Przeglądaj harmonogram nadchodzących spotkań oraz pełne statystyki i analizy AI z rozegranych meczów.'
      hasItems={games.length > 0}
      emptyTitle={gamesState.status === 'error' ? 'Błąd pobierania meczów' : 'Brak meczów'}
      emptyDescription={
        gamesState.status === 'error'
          ? 'Sprawdź połączenie z bazą danych i endpoint /api/games.'
          : 'Terminarz i wyniki pojawią się automatycznie po dodaniu danych.'
      }
    >
      <MatchesList games={games} />
    </EditorialListingTemplate>
  )
}
