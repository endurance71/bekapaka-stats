/**
 * Słownik statystyk panelu: jedna polska nazwa, skrót i wyjaśnienie dla każdej liczby.
 * Używany w nagłówkach tabel, kafelkach, dymkach (`StatLabel`) i na stronie „Słowniczek”.
 * Uwaga: „Str” = straty (piłki), „Strac.” = punkty stracone.
 */

export type StatKey =
    | 'min' | 'pts' | 'reb' | 'oreb' | 'dreb' | 'ast' | 'stl' | 'blk' | 'blkAgainst' | 'tov' | 'pf' | 'pfDrawn'
    | 'eval' | 'plusMinus' | 'fg' | 'two' | 'three' | 'ft' | 'efg' | 'ts'
    | 'games' | 'starter' | 'doubleDouble'
    | 'pointsFor' | 'pointsAgainst' | 'pointDiff' | 'wins' | 'losses' | 'leaguePoints' | 'winPct' | 'form' | 'streak'
    | 'offRtg' | 'defRtg' | 'netRtg' | 'pace' | 'tovPct' | 'orbPct' | 'ftr'
    | 'run' | 'leadChanges' | 'clutch';

export interface StatEntry {
    /** Skrót w nagłówku tabeli */
    short: string;
    /** Skrót średniej na mecz (kafelki) */
    perGame?: string;
    /** Pełna nazwa */
    long: string;
    /** Jedno zdanie wyjaśnienia dla zawodnika */
    hint: string;
    /** Grupa na stronie „Słowniczek” */
    group: 'Mecz' | 'Rzuty' | 'Tabela' | 'Drużyna (dla trenera)' | 'Akcja po akcji';
}

export const STAT: Record<StatKey, StatEntry> = {
    min: { short: 'Min', long: 'Minuty', hint: 'Czas na parkiecie.', group: 'Mecz' },
    pts: { short: 'Pkt', perGame: 'Pkt/m', long: 'Punkty', hint: 'Zdobyte punkty; „/m” = średnio na mecz.', group: 'Mecz' },
    reb: { short: 'Zb', perGame: 'Zb/m', long: 'Zbiórki', hint: 'Zebrane piłki po niecelnym rzucie (w ataku i w obronie).', group: 'Mecz' },
    oreb: { short: 'Zb A', long: 'Zbiórki w ataku', hint: 'Piłka zebrana pod koszem rywala — daje drugą szansę na rzut.', group: 'Mecz' },
    dreb: { short: 'Zb O', long: 'Zbiórki w obronie', hint: 'Piłka zebrana pod własnym koszem — kończy akcję rywala.', group: 'Mecz' },
    ast: { short: 'As', perGame: 'As/m', long: 'Asysty', hint: 'Podanie, po którym kolega od razu zdobył punkty.', group: 'Mecz' },
    stl: { short: 'Prz', perGame: 'Prz/m', long: 'Przechwyty', hint: 'Odebrana piłka rywalowi.', group: 'Mecz' },
    blk: { short: 'Bl', perGame: 'Bl/m', long: 'Bloki', hint: 'Zablokowany rzut rywala.', group: 'Mecz' },
    blkAgainst: { short: 'Bl o', long: 'Bloki otrzymane', hint: 'Twoje rzuty zablokowane przez rywala.', group: 'Mecz' },
    tov: { short: 'Str', perGame: 'Str/m', long: 'Straty', hint: 'Piłka stracona na rzecz rywala (złe podanie, kroki, aut…).', group: 'Mecz' },
    pf: { short: 'F', long: 'Faule', hint: 'Faule popełnione; 5 fauli = koniec gry w meczu.', group: 'Mecz' },
    pfDrawn: { short: 'Fw', long: 'Faule wymuszone', hint: 'Faule, które rywal popełnił na Tobie.', group: 'Mecz' },
    eval: { short: 'Eval', long: 'Eval (ocena meczu KALK)', hint: 'Wszystko, co dobre (punkty, zbiórki, asysty, przechwyty, bloki…), minus pudła, straty i faule. Im wyżej, tym lepszy mecz.', group: 'Mecz' },
    plusMinus: { short: '+/-', long: 'Bilans na parkiecie', hint: 'Punkty drużyny minus punkty rywala, gdy byłeś na parkiecie. KALK nie liczy go w każdym meczu.', group: 'Mecz' },
    fg: { short: 'Z gry', long: 'Rzuty z gry', hint: 'Celne / oddane rzuty za 2 i za 3 razem.', group: 'Rzuty' },
    two: { short: 'Za 2', long: 'Rzuty za 2', hint: 'Celne / oddane rzuty za 2 punkty.', group: 'Rzuty' },
    three: { short: 'Za 3', long: 'Rzuty za 3', hint: 'Celne / oddane rzuty zza linii 6,75 m.', group: 'Rzuty' },
    ft: { short: 'Wolne', long: 'Rzuty wolne', hint: 'Celne / oddane rzuty wolne po faulu.', group: 'Rzuty' },
    efg: { short: 'Skut.', long: 'Skuteczność rzutów (eFG%)', hint: 'Skuteczność z gry, w której trójka liczy się 1,5 raza — bo daje 3 punkty.', group: 'Rzuty' },
    ts: { short: 'Skut. ogólna', long: 'Skuteczność ogólna (TS%)', hint: 'Jak skuteczność rzutów, ale uwzględnia też rzuty wolne.', group: 'Rzuty' },
    games: { short: 'M', long: 'Mecze', hint: 'Liczba rozegranych meczów.', group: 'Mecz' },
    starter: { short: '*', long: 'Pierwsza piątka', hint: 'Zawodnik zaczynał mecz na parkiecie.', group: 'Mecz' },
    doubleDouble: { short: 'Dbl-dbl', long: 'Double-double', hint: 'Mecz z co najmniej 10 w dwóch kategoriach (np. 10 pkt i 10 zb).', group: 'Mecz' },
    pointsFor: { short: 'Zdob.', long: 'Punkty zdobyte', hint: 'Suma punktów drużyny.', group: 'Tabela' },
    pointsAgainst: { short: 'Strac.', long: 'Punkty stracone', hint: 'Suma punktów rywali.', group: 'Tabela' },
    pointDiff: { short: '+/-', long: 'Różnica punktów', hint: 'Zdobyte minus stracone.', group: 'Tabela' },
    wins: { short: 'W', long: 'Wygrane', hint: 'Liczba zwycięstw.', group: 'Tabela' },
    losses: { short: 'P', long: 'Porażki', hint: 'Liczba porażek.', group: 'Tabela' },
    leaguePoints: { short: 'Pkt', long: 'Punkty w tabeli', hint: '2 za zwycięstwo, 1 za porażkę.', group: 'Tabela' },
    winPct: { short: '%W', long: 'Procent wygranych', hint: 'Jaka część meczów zakończyła się zwycięstwem.', group: 'Tabela' },
    form: { short: 'Forma', long: 'Forma', hint: 'Wyniki ostatnich meczów: W = wygrana, P = porażka.', group: 'Tabela' },
    streak: { short: 'Seria', long: 'Seria', hint: 'Ile meczów z rzędu drużyna wygrywa (W) lub przegrywa (P).', group: 'Tabela' },
    offRtg: { short: 'Atak /100', long: 'Atak na 100 akcji', hint: 'Ile punktów zdobywamy średnio na 100 posiadań piłki — porównuje drużyny niezależnie od tempa.', group: 'Drużyna (dla trenera)' },
    defRtg: { short: 'Obrona /100', long: 'Obrona na 100 akcji', hint: 'Ile punktów tracimy na 100 posiadań rywala; im mniej, tym lepiej.', group: 'Drużyna (dla trenera)' },
    netRtg: { short: 'Bilans /100', long: 'Bilans na 100 akcji', hint: 'Atak minus obrona na 100 posiadań; plus = przewaga.', group: 'Drużyna (dla trenera)' },
    pace: { short: 'Tempo', long: 'Tempo gry', hint: 'Szacowana liczba posiadań piłki w meczu (40 min); więcej = szybsza gra.', group: 'Drużyna (dla trenera)' },
    tovPct: { short: 'Straty %', long: 'Procent strat', hint: 'Jaka część akcji kończy się stratą piłki.', group: 'Drużyna (dla trenera)' },
    orbPct: { short: 'Zb A %', long: 'Procent zbiórek w ataku', hint: 'Jaką część niecelnych rzutów drużyna zbiera pod koszem rywala.', group: 'Drużyna (dla trenera)' },
    ftr: { short: 'Wolne %', long: 'Częstość rzutów wolnych', hint: 'Rzuty wolne na 100 rzutów z gry — jak często drużyna wymusza faule.', group: 'Drużyna (dla trenera)' },
    run: { short: 'Seria', long: 'Seria punktowa', hint: 'Punkty zdobyte z rzędu bez odpowiedzi rywala, np. „Seria 10:0”.', group: 'Akcja po akcji' },
    leadChanges: { short: 'Zmiany prow.', long: 'Zmiany prowadzenia', hint: 'Ile razy w meczu prowadzenie przechodziło na drugą drużynę.', group: 'Akcja po akcji' },
    clutch: { short: 'Końcówka', long: 'Końcówka meczu', hint: 'Ostatnie 5 minut 4. kwarty i dogrywki.', group: 'Akcja po akcji' }
};

export const statShort = (k: StatKey) => STAT[k].short;
export const statLong = (k: StatKey) => STAT[k].long;
export const statHint = (k: StatKey) => STAT[k].hint;
export const statPerGame = (k: StatKey) => STAT[k].perGame ?? STAT[k].short;

/** W / P (wygrana / porażka) — jedna konwencja w całym panelu, jak na bekapaka.pl. */
export function resultLetter(result?: string | null): 'W' | 'P' | '–' {
    if (result === 'W' || result === 'Z') return 'W';
    if (result === 'L' || result === 'P') return 'P';
    return '–';
}

export function resultLabel(result?: string | null): string {
    const l = resultLetter(result);
    return l === 'W' ? 'Wygrana' : l === 'P' ? 'Porażka' : '';
}

export const GLOSSARY_GROUPS: StatEntry['group'][] = ['Mecz', 'Rzuty', 'Tabela', 'Akcja po akcji', 'Drużyna (dla trenera)'];
