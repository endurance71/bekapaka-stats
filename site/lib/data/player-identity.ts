/** Known identities and official jersey numbers from the approved brand roster. */
const identities: ReadonlyArray<readonly [string, string, string?]> = [
  ["Jędrzej", "Bortnik", "2"],
  ["Paweł", "Samusionek", "3"],
  ["Pablo", "Iriarte", "4"],
  ["Patryk", "Szczęśniak", "7"],
  ["Marcin", "Trawiński"],
  ["Mirosław", "Malina", "11"],
  ["Tomasz", "Kaszubowski", "12"],
  ["Jakub", "Gołębiowski", "15"],
  ["Przemysław", "Klimek", "16"],
  ["Robert", "Kulik", "21"],
  ["Emil", "Kłos", "23"],
  ["Damian", "Motyliński", "24"],
  ["Alan", "Niwiński", "27"],
  ["Dawid", "Olearczyk", "1"],
  ["Łukasz", "Gośniak", "34"],
  ["Filip", "Karpiński", "69"],
  ["Filip", "Kawecki", "77"],
  ["Łukasz", "Mras", "13"],
  ["Maciej", "Tymiński", "29"],
  ["Piotr", "Sosiński", "8"]
]

export function normalizePlayerIdentity<T extends { firstName: string; lastName: string; number?: string; kalkPlayer?: unknown }>(player: T): T {
  const firstName = player.firstName
  const lastName = player.lastName

  // Check if names are reversed
  const knownReversed = identities.find(([first, last]) => first === lastName && last === firstName)
  if (knownReversed) {
    return { ...player, firstName: knownReversed[0], lastName: knownReversed[1] }
  }

  const source = player.kalkPlayer
  if (source && typeof source === 'object' && 'id' in source && 'name' in source &&
      typeof source.id === 'string' && /^\d{4}-\d{4}__(?!zawodnik)/.test(source.id) &&
      source.name === `${lastName} ${firstName}`) {
    return { ...player, firstName: lastName, lastName: firstName }
  }

  return player
}

export function resolvePlayerJerseyNumber(player: { firstName: string; lastName: string; number?: string }): string | undefined {
  if (player.number && player.number.trim() !== '' && player.number.trim() !== '-') {
    return player.number
  }
  const match = identities.find(([first, last]) =>
    first.toLowerCase() === player.firstName.toLowerCase() &&
    last.toLowerCase() === player.lastName.toLowerCase()
  )
  return match?.[2]
}
