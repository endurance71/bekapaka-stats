"""Rozwiązywanie nazw zawodników z akcja-po-akcji (pełne imię i nazwisko, numer) na slugi."""

from __future__ import annotations

from typing import Iterable, Optional

from .common import fold, slugify


class NameResolver:
    """Dopasowuje nazwy w obrębie jednej strony meczu (`home`/`away`).

    Źródła (od najpewniejszego): numer z box score, pełne nazwy znane z katalogu zawodników /
    liderów / MVP, skrót „D. Olearczyk” z box score, samo nazwisko, prefiks sluga.
    """

    def __init__(self, box_teams: dict[str, list[dict]], known_full_names: Iterable[tuple[str, str]] = ()):
        # box_teams: {'home': [row...], 'away': [row...]}; row ma slug, name, number
        self.rows = {side: [r for r in rows if r.get('slug')] for side, rows in box_teams.items()}
        self.side_of_slug = {r['slug']: side for side, rows in self.rows.items() for r in rows}
        self.number_of_slug = {r['slug']: r.get('number') for rows in self.rows.values() for r in rows}
        self.full: dict[str, set[str]] = {}
        for name, slug in known_full_names:
            if name and slug:
                self.full.setdefault(fold(name), set()).add(slug)
        self.learned: dict[tuple[str, str], str] = {}

    def number(self, slug: Optional[str]) -> Optional[int]:
        return self.number_of_slug.get(slug) if slug else None

    def _unique(self, slugs: Iterable[str]) -> Optional[str]:
        found = set(slugs)
        return found.pop() if len(found) == 1 else None

    def resolve(self, side: Optional[str], name: Optional[str], number: Optional[int] = None) -> Optional[str]:
        if not name or side not in self.rows:
            return None
        key = fold(name)
        rows = self.rows[side]
        slug = None
        if number is not None:
            slug = self._unique(r['slug'] for r in rows if r.get('number') == number)
        if slug is None and (side, key) in self.learned:
            return self.learned[(side, key)]
        if slug is None:
            slug = self._unique(s for s in self.full.get(key, ()) if self.side_of_slug.get(s, side) == side)
        tokens = key.split(' ')
        if slug is None and len(tokens) >= 2:
            first, rest = tokens[0], ' '.join(tokens[1:])
            slug = self._unique(r['slug'] for r in rows if fold(r['name']) == f'{first[0]} {rest}')
            if slug is None:
                # Imię dwuczłonowe / nazwisko złożone: porównaj samo nazwisko (ostatni człon).
                slug = self._unique(r['slug'] for r in rows
                                    if fold(r['name']).split(' ')[-1] == tokens[-1]
                                    and fold(r['name'])[:1] == first[:1])
            if slug is None:
                slug = self._unique(r['slug'] for r in rows if fold(r['name']).split(' ')[-1] == tokens[-1])
        if slug is None:
            prefix = slugify(name)
            slug = self._unique(r['slug'] for r in rows if r['slug'] == prefix or r['slug'].startswith(prefix + '-'))
        if slug is not None:
            self.learned[(side, key)] = slug
        return slug
