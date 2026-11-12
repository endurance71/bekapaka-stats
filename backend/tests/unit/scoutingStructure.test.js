import { describe, expect, it } from 'vitest';
import { scoutingStructureIssues } from '../../ai/scoutingMarkdown.js';

const full = () => ({
  summary: 'Podsumowanie rywala.',
  offense: 'Atak rywala.',
  defense: 'Obrona rywala.',
  verdict: 'KLUCZ: zastawiać Dolika.\n- punkt',
  personnel: { keyPlayers: 'Dolik 15 zbiórek.', threats: 'Nagórski za 3.', matchups: 'Sosiński na Dolika.', bench: 'Ławka 13,3 pkt.' },
  lockerRoom: ['a', 'b', 'c', 'd', 'e']
});

describe('struktura raportu scoutingowego (wynik agenta MCP)', () => {
  it('kompletny raport przechodzi — jako obiekt i jako tekst JSON', () => {
    expect(scoutingStructureIssues(full())).toEqual([]);
    expect(scoutingStructureIssues(JSON.stringify(full()))).toEqual([]);
  });

  it('brak personnel.bench (przypadek z GMVT 12.11) jest odrzucany', () => {
    const r = full();
    delete r.personnel.bench;
    expect(scoutingStructureIssues(r)).toEqual(['brak pola personnel.bench']);
  });

  it('wychwytuje puste sekcje, zły werdykt, złą szatnię i niepoprawny JSON', () => {
    const r = { ...full(), offense: '  ', verdict: 'Klucz bez prefiksu', lockerRoom: ['a', ''] };
    delete r.personnel;
    expect(scoutingStructureIssues(r)).toEqual([
      'brak pola offense',
      'verdict musi zaczynać się od „KLUCZ:”',
      'brak obiektu personnel',
      'lockerRoom musi mieć 3–5 niepustych punktów'
    ]);
    expect(scoutingStructureIssues('to nie jest JSON')).toEqual(['wynik nie jest poprawnym JSON']);
  });
});
