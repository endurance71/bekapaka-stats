import { describe, expect, it } from 'vitest';
import { assetIds, assetMetadataSchema, BRAND_VERSION, newPostProject, projectSchema } from '../../studio/contracts.js';
import { postType, projectTemplateVersion } from '../../studio/post-types.js';
import { validateProject } from '../../studio/validation.js';
import { fetchKalkLogo, kalkLogoUrl, kalkMediaUrl, opponentLogo, teamKey } from '../../studio/opponent-logos.js';
import { factsSchema } from '../../studio/publications/channels.js';
import { playbooks } from '../../studio/publications/playbooks.js';
import { projectFromFacts } from '../../studio/publications/service.js';

const GMVT = 'https://www.kalk-koszalin.com/storage/media/2026/09/ad002cc1-1bd9-45c8-9784-a17f99cddd23.jpg';
const facts = factsSchema.parse({ kind: 'match', opponent: 'GMVT TEAM', date: '2026-10-18T14:00:00.000Z', venue: 'KOSiR Koszalin', scoreUs: 56, scoreThem: 54 });
const graphic = (family) => playbooks.flatMap((p) => Object.values(p.graphics)).find((g) => postType(g.postType)?.family === family);
const logo = { id: 'logo-1', name: 'GMVT TEAM', kind: 'opponent-logo', status: 'approved', consent: 'not_required' };
const result = () => {
  const p = newPostProject('final');
  Object.assign(p.content, { opponent: 'GMVT TEAM', date: '2026-10-18T16:00:00+02:00', venue: 'KOSiR Koszalin', scoreUs: 56, scoreThem: 54, altText: 'Wynik meczu.', opponentLogoAssetId: 'logo-1' });
  return p;
};
const ctx = (assets) => ({ assets, template: { status: 'approved', brandVersion: BRAND_VERSION, version: projectTemplateVersion(result()) }, approved: true });

describe('Studio opponent logo (brand rule M8)', () => {
  it('matches teams regardless of case, accents and punctuation', () => {
    expect(teamKey('GMVT TEAM')).toBe(teamKey(' gmvt-team '));
    expect(teamKey('Łosie Słupsk')).toBe(teamKey('losie slupsk'));
    expect(teamKey('')).toBe('');
  });

  it('keeps older payloads unchanged and treats the logo as a project asset', () => {
    const p = newPostProject('final');
    expect('opponentLogoAssetId' in p.content).toBe(false);
    expect(projectSchema.parse(result()).content.opponentLogoAssetId).toBe('logo-1');
    expect(assetIds(result().content)).toContain('logo-1');
    expect(assetMetadataSchema.parse({ name: 'GMVT TEAM', kind: 'opponent-logo', origin: 'KALK' }).kind).toBe('opponent-logo');
  });

  it('exports only with an approved logo of the opponent-logo kind', () => {
    expect(validateProject(result(), ctx([logo])).valid).toBe(true);
    expect(validateProject(result(), ctx([{ ...logo, status: 'draft' }])).errors.map((e) => e.field)).toContain('assets');
    expect(validateProject(result(), ctx([{ ...logo, kind: 'photo' }])).errors.map((e) => e.field)).toContain('opponentLogoAssetId');
    expect(validateProject(result(), ctx([{ ...logo, kind: 'logo' }])).errors.map((e) => e.field)).not.toContain('photoAssetId');
  });

  it('fills the logo into match graphics only', () => {
    const board = projectFromFacts(graphic('result'), facts, null, 'GMVT TEAM', [], 'Wynik.', 'logo-1');
    expect(board.content).toMatchObject({ opponent: 'GMVT TEAM', opponentShort: 'GT', opponentLogoAssetId: 'logo-1' });
    expect(projectFromFacts(graphic('announcement'), facts, null, 'GMVT TEAM', [], 'Zapowiedź.', 'logo-1').content.opponentLogoAssetId).toBe('logo-1');
    expect('opponentLogoAssetId' in projectFromFacts(graphic('result'), facts, null, 'GMVT TEAM', [], 'Wynik.').content).toBe(false);
    expect('opponentLogoAssetId' in projectFromFacts(graphic('player'), { ...facts, person: 'Jan Kowalski' }, null, 'MVP', [], 'MVP.', 'logo-1').content).toBe(false);
  });

  it('finds the newest approved library logo of the team', async () => {
    const assets = [{ ...logo, id: 'other', name: 'Pantery' }, { ...logo, id: 'new', name: 'gmvt team' }, logo];
    const db = { studioAsset: { findMany: async ({ where }) => assets.filter((a) => a.kind === where.kind && a.status === where.status) } };
    expect((await opponentLogo(db, 'owner', 'GMVT TEAM')).id).toBe('new');
    expect(await opponentLogo(db, 'owner', 'Młode Wilki')).toBeNull();
  });

  it('reads the KALK logo URL from teams and the league table', async () => {
    const db = {
      kalkTeam: { findMany: async () => [{ name: 'GMVT TEAM', logoUrl: 'https://evil.example/logo.jpg', updatedAt: new Date(2) }] },
      leagueTeam: { findMany: async () => [{ name: 'GMVT TEAM', logoUrl: GMVT, updatedAt: new Date(1) }] },
    };
    expect(await kalkLogoUrl(db, 'gmvt team')).toBe(GMVT);
    expect(await kalkLogoUrl(db, 'Pantery')).toBeNull();
  });

  it('downloads logos only from the KALK media storage', async () => {
    expect(kalkMediaUrl(GMVT)?.hostname).toBe('www.kalk-koszalin.com');
    for (const bad of ['http://www.kalk-koszalin.com/storage/a.jpg', 'https://kalk-koszalin.com.evil.io/storage/a.jpg', 'https://www.kalk-koszalin.com/admin/a.jpg', 'https://u:p@www.kalk-koszalin.com/storage/a.jpg', 'nie-url']) {
      expect(kalkMediaUrl(bad)).toBeNull();
      await expect(fetchKalkLogo(bad, async () => { throw new Error('should not fetch'); })).rejects.toMatchObject({ status: 422 });
    }
    const big = { ok: true, headers: new Map([['content-length', String(6 * 1024 * 1024)]]), arrayBuffer: async () => new ArrayBuffer(0) };
    await expect(fetchKalkLogo(GMVT, async () => big)).rejects.toMatchObject({ status: 413 });
    await expect(fetchKalkLogo(GMVT, async () => ({ ok: false, headers: new Map() }))).rejects.toMatchObject({ status: 502 });
  });
});
