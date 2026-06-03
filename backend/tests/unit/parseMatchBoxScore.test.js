import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseMatchHtml,
  parseCoAtt,
  boxScoreToLeagueDetails,
  isBekapakaTeamName,
  gameViewFromKalkMatch
} from '../../kalk/parseMatchBoxScore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '../fixtures/kalk-match-4601.html');

describe('parseMatchBoxScore', () => {
  it('parseCoAtt splits made/att', () => {
    expect(parseCoAtt('8 / 12')).toEqual({ made: 8, att: 12 });
    expect(parseCoAtt('2/7')).toEqual({ made: 2, att: 7 });
  });

  it('parses KALK match HTML fixture with two teams and box score', () => {
    const html = fs.readFileSync(fixturePath, 'utf8');
    const parsed = parseMatchHtml(html);

    expect(parsed.matchId).toBe('4601');
    expect(parsed.boxScore.teams).toHaveLength(2);
    expect(parsed.scoreHome).toBe(77);
    expect(parsed.scoreAway).toBe(72);

    const bekapaka = parsed.boxScore.teams.find((t) => t.isBekapaka);
    expect(bekapaka?.name).toContain('BeKaPaKa');
    expect(bekapaka?.pts ?? bekapaka?.fourFactors?.pts).toBe(72);
    expect(bekapaka.players.length).toBeGreaterThan(5);

    const kaszubowski = bekapaka.players.find((p) => p.name.includes('Kaszubowski'));
    expect(kaszubowski?.pts).toBe(21);

    const details = boxScoreToLeagueDetails(parsed.boxScore);
    expect(details.teams).toHaveLength(2);
    expect(details.teams[0].fourFactors?.pts).toBeGreaterThan(0);
  });

  it('isBekapakaTeamName detects our team', () => {
    expect(isBekapakaTeamName('BeKaPaKa BOBOLICE')).toBe(true);
    expect(isBekapakaTeamName('PIWIARNIA BUMERANG')).toBe(false);
  });

  it('gameViewFromKalkMatch builds panel-compatible game object', () => {
    const html = fs.readFileSync(fixturePath, 'utf8');
    const parsed = parseMatchHtml(html);
    const view = gameViewFromKalkMatch(parsed, 'season-test');

    expect(view.dataSource).toBe('kalk');
    expect(view.result).toBe('L');
    expect(view.scoreUs).toBe(72);
    expect(view.scoreThem).toBe(77);
    expect(view.teamStats).toHaveLength(2);
  });
});
