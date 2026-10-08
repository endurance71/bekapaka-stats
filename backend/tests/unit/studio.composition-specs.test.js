import { describe, expect, it } from 'vitest';
import specs from '../../studio/composition-specs.json' with { type: 'json' };
import { postTypes, designFormats } from '../../studio/post-types.js';

// composition-specs.json is fingerprinted documentation of the release; post-types.js drives runtime availability.
describe('composition specs mirror the runtime catalogue', () => {
  it('lists the same post types', () => {
    expect(specs.map(s => s.id).sort()).toEqual(postTypes.map(p => p.id).sort());
  });
  it.each(postTypes.map(p => [p.id, p]))('%s has the same family, styles and formats', (_id, type) => {
    const spec = specs.find(s => s.id === type.id);
    expect({ family: spec.family, variant: spec.variant, styles: spec.styles }).toEqual({ family: type.family, variant: type.variant, styles: type.styles });
    for (const style of type.styles) expect(spec.compositions.find(c => c.id === `${type.id}/${style}`)?.formats).toEqual(designFormats(type, style));
  });
});
