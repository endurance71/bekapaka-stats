import { describe, expect, it } from 'vitest';
import { plural } from './plural';

describe('Polish plural', () => {
  it.each([
    [1, '1 kompozycja'],
    [2, '2 kompozycje'],
    [4, '4 kompozycje'],
    [5, '5 kompozycji'],
    [12, '12 kompozycji'],
    [22, '22 kompozycje'],
    [0, '0 kompozycji'],
  ])('%i', (n, expected) => {
    expect(plural(n, 'kompozycja', 'kompozycje', 'kompozycji')).toBe(expected);
  });
});
