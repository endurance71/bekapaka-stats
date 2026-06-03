import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseMatchHtml,
  parseCoAtt,
  parseQuartersFromRaw,
  enrichKalkTeamStats,
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

  it('parseQuartersFromRaw parses KALK quarter line', () => {
    const q = parseQuartersFromRaw('(15:18; 17:18; 23:11; 7:15;)');
    expect(q).toHaveLength(4);
    expect(q[0]).toEqual({ label: 'Q1', home: 15, away: 18 });
    expect(q[3]).toEqual({ label: 'Q4', home: 7, away: 15 });
  });

  it('parseMatchHtml extracts quarters from fixture', () => {
    const html = fs.readFileSync(fixturePath, 'utf8');
    const parsed = parseMatchHtml(html);
    expect(parsed.boxScore.meta?.quartersRaw).toBeTruthy();
    expect(parsed.boxScore.meta?.quarters?.length).toBeGreaterThanOrEqual(4);
  });

  it('enrichKalkTeamStats fills fourFactors from players', () => {
    const html = fs.readFileSync(fixturePath, 'utf8');
    const parsed = parseMatchHtml(html);
    const team = parsed.boxScore.teams.find((t) => t.isBekapaka);
    const opp = parsed.boxScore.teams.find((t) => !t.isBekapaka);
    const enriched = enrichKalkTeamStats(
      { name: team.name, players: team.players, pts: team.pts, fourFactors: team.fourFactors },
      opp.pts
    );
    expect(enriched.fourFactors.fga).toBeGreaterThan(0);
    expect(enriched.fourFactors.drb).toBeDefined();
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
    expect(view.quarters?.length).toBeGreaterThanOrEqual(4);
    expect(view.hasBoxScore).toBe(true);
  });
});
