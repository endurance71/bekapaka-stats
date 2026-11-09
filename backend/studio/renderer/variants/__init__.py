"""Layout variants of publication families (catalogue: backend/studio/design-variants.js).
Variants 1..k are the legacy compositions in render_v3; this package draws the new ones. Every variant keeps the
brand skeleton drawn by render_v3.foundation/foot (material, stripes, wordmark, note) and the QA of Poster.save."""

def layout_for(p):
    n=getattr(p,'design_variant',None)
    if not n:return None
    if p.family=='announcement':
        from . import announcement as m
    elif p.family=='result':
        from . import result as m
    else:return None
    return m.LAYOUTS.get(n)
