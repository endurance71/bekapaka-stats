/**
 * Znane tożsamości i numery z zatwierdzonego składu marki — te same co na bekapaka.pl
 * (`site/lib/data/player-identity.ts`). Część wierszy składu ma zamienione imię i nazwisko
 * (stara strona KALK: „Nazwisko Imię”) — poprawiamy tylko przy wyświetlaniu, bez zmian w bazie.
 */
const identities: ReadonlyArray<readonly [string, string, number?]> = [
    ['Jędrzej', 'Bortnik', 2],
    ['Paweł', 'Samusionek', 3],
    ['Pablo', 'Iriarte', 4],
    ['Patryk', 'Szczęśniak', 7],
    ['Marcin', 'Trawiński'],
    ['Mirosław', 'Malina', 11],
    ['Tomasz', 'Kaszubowski', 12],
    ['Jakub', 'Gołębiowski', 15],
    ['Przemysław', 'Klimek', 16],
    ['Robert', 'Kulik', 21],
    ['Emil', 'Kłos', 23],
    ['Damian', 'Motyliński', 24],
    ['Alan', 'Niwiński', 27],
    ['Dawid', 'Olearczyk', 1],
    ['Łukasz', 'Gośniak', 34],
    ['Filip', 'Karpiński', 69],
    ['Łukasz', 'Mras', 13],
    ['Maciej', 'Tymiński', 29],
    ['Piotr', 'Sosiński', 8],
];

const same = (a?: string | null, b?: string | null) => (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();

interface IdentityLike {
    firstName?: string | null;
    lastName?: string | null;
    number?: number | string | null;
}

/** Imię i nazwisko w poprawnej kolejności (znane tożsamości); reszta pól bez zmian. */
export function normalizePlayerIdentity<T extends IdentityLike>(player: T): T;
export function normalizePlayerIdentity<T extends IdentityLike>(player: T | null | undefined): T | null | undefined;
export function normalizePlayerIdentity<T extends IdentityLike>(player: T | null | undefined): T | null | undefined {
    if (!player) return player;
    const reversed = identities.find(([first, last]) => same(first, player.lastName) && same(last, player.firstName));
    return reversed ? { ...player, firstName: reversed[0], lastName: reversed[1] } : player;
}

/** Numer z danych, a gdy brak — z zatwierdzonego składu marki. */
export function resolvePlayerJerseyNumber(player: IdentityLike): number | null {
    const raw = typeof player.number === 'string' ? Number(player.number) : player.number;
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
    const { firstName, lastName } = normalizePlayerIdentity(player);
    return identities.find(([first, last]) => same(first, firstName) && same(last, lastName))?.[2] ?? null;
}
