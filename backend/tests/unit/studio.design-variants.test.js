import { describe, it, expect } from 'vitest';
import { familyVariants, variantsFor, legacyVariant, projectVariant, MAX_VARIANTS } from '../../studio/design-variants.js';
import { postTypes, postType, designKey, projectTemplateVersion, designFormats } from '../../studio/post-types.js';
import { newPostProject, projectSchema } from '../../studio/contracts.js';
import { compositionKey, compositionName, pickVariant, signatureOf, varietyWarnings } from '../../studio/publications/variety.js';

describe('layout variants catalogue', () => {
  it('has ten numbered layouts per match family, each in a style the family offers', () => {
    for (const family of ['announcement', 'result']) {
      const list = familyVariants[family];
      expect(list.map((v) => v.n)).toEqual(Array.from({ length: MAX_VARIANTS }, (_, i) => i + 1));
      const styles = new Set(postTypes.filter((t) => t.family === family).flatMap((t) => t.styles));
      for (const v of list) expect(styles.has(v.style)).toBe(true);
      expect(new Set(list.map((v) => v.name)).size).toBe(list.length);
    }
  });

  it('keeps one legacy layout per style of every post type (the composition from before variants)', () => {
    for (const type of postTypes)
      for (const style of type.styles) expect(legacyVariant(type, style), `${type.id}/${style}`).toMatchObject({ style, legacy: true });
  });

  it('offers the jersey only on match day', () => {
    expect(variantsFor(postType('matchday')).some((v) => v.style === 'jersey')).toBe(true);
    expect(variantsFor(postType('preview')).some((v) => v.style === 'jersey')).toBe(false);
    expect(variantsFor(postType('preview'))).toHaveLength(9);
    expect(variantsFor(postType('final'))).toHaveLength(10);
  });
});

describe('designVariant in projects and design keys', () => {
  it('leaves legacy projects and their keys exactly as before variants', () => {
    const plain = newPostProject('final', 'sport');
    expect(plain).not.toHaveProperty('designVariant');
    expect(newPostProject('final', null, 1)).toEqual(plain);
    expect(designKey(plain, 'feed')).not.toMatch(/layout-/);
    expect(projectVariant(postType('final'), plain)).toMatchObject({ n: 1, legacy: true });
  });

  it('stores a new layout, takes its style and separates its design key', () => {
    const p = newPostProject('final', 'sport', 9);
    expect(p).toMatchObject({ designVariant: 9, visualStyle: 'poster' });
    expect(projectTemplateVersion(p)).toMatch(/:layout-9$/);
    expect(designKey(p, 'feed').split(':')[3]).toBe('feed');
    expect(designKey(p, 'feed')).not.toBe(designKey({ ...p, designVariant: 4, visualStyle: 'sport' }, 'feed'));
    expect(p.formats.every((f) => designFormats(postType('final'), 'poster').includes(f))).toBe(true);
  });

  it('rejects a layout of another style or an unknown number', () => {
    const p = newPostProject('preview', null, 5);
    expect(() => projectSchema.parse({ ...p, visualStyle: 'editorial' })).toThrow(/Wariant układu/);
    expect(() => projectSchema.parse({ ...p, designVariant: 11 })).toThrow();
    expect(() => newPostProject('preview', null, 3)).toThrow(/Nieznany wariant/);
  });
});

describe('layout rotation and feed variety', () => {
  const sig = (postTypeId, n) => signatureOf(newPostProject(postTypeId, null, n));

  it('names only new layouts in the signature, so legacy repetition rules are unchanged', () => {
    expect(sig('final', 1)).not.toHaveProperty('designVariant');
    expect(compositionKey(sig('final', 1))).toBe('final:sport');
    expect(compositionKey(sig('final', 5))).toBe('final:sport:5');
    expect(compositionName(sig('final', 5))).toContain('Pas wyniku');
  });

  it('does not warn about the previous post when only the style matches and the layout differs', () => {
    const previous = { signature: sig('final', 1), publishedAt: '2026-10-17T16:00:00.000Z' };
    expect(varietyWarnings({ signature: sig('final', 5), plannedAt: '2026-10-18T16:00:00.000Z' }, [previous])).toEqual([]);
    expect(varietyWarnings({ signature: sig('final', 1), plannedAt: '2026-10-18T16:00:00.000Z' }, [previous])[0].rule).toBe('previous');
  });

  it('starts with the legacy layout and then takes the least recently used one of the family', () => {
    const type = postType('preview');
    expect(pickVariant(type, undefined, []).n).toBe(1);
    const history = [sig('matchday', 1), sig('preview', 4), sig('final', 5)];
    const next = pickVariant(type, undefined, history);
    expect([1, 4]).not.toContain(next.n);
    expect(next.n).toBe(2);
  });

  it('rotates only within a fixed style and skips layouts that need a photo or the jersey', () => {
    const final = postType('final');
    expect(pickVariant(final, 'poster', [sig('final', 3)]).n).toBe(9);
    expect(pickVariant(final, 'poster', [sig('final', 9), sig('final', 3)]).n).toBe(3);
    const styles = new Set(Array.from({ length: 12 }, (_, i) => i).reduce((h) => [signatureOf(newPostProject('final', null, pickVariant(final, undefined, h).n)), ...h], []).map((s) => s.visualStyle));
    expect(styles.has('photo')).toBe(false);
    expect(pickVariant(postType('matchday'), undefined, []).style).not.toBe('jersey');
  });
});
