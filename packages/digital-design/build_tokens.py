"""tokens.json → dist/tokens.css (zmienne CSS + motywy + typografia), dist/tailwind.preset.cjs, dist/tokens.flat.json."""
import json
from pathlib import Path
H = Path(__file__).resolve().parent; T = json.loads((H/'tokens.json').read_text()); D = H/'dist'; D.mkdir(exist_ok=True)
P = {k: v['value'] for k, v in T['palette'].items()}; L = T['layout']; BP = L['breakpoints']
css = ['/* BeKaPaKa Digital 2.0 — wygenerowane z tokens.json (build_tokens.py). Nie edytować ręcznie. */', ':root {']
css += [f'  --c-{k}: {v};' for k, v in P.items()]
css += [f'  --space-{k}: {v}px;' for k, v in T['space'].items()]
css += [f"  --container-max: {L['container-max']}px;", f"  --reading-max: {L['reading-max']}px;", f"  --wide-max: {L['wide-max']}px;"]
css += [f"  --font-display: {T['font']['display']};", f"  --font-text: {T['font']['text']};"]
css += [f'  --radius-{k}: {v}px;' for k, v in T['radius'].items() if not k.startswith('_')]
css += [f'  --control-h-{k}: {v}px;' for k, v in T['control'].items() if not k.startswith('_')]
css += [f'  --bw-{k}: {v}px;' for k, v in T['border'].items()]   # szerokości obramowań (kolory: --border, --border-strong w motywach)
css += [f'  --shadow-{k}: {v};' for k, v in T['shadow'].items()]
css += [f'  --dur-{k}: {v}ms;' for k, v in T['motion']['duration'].items()]
css += [f'  --ease-{k}: {v};' for k, v in T['motion']['easing'].items()]
c = T['cut']; css += [f"  --cut-top: {c['top_em']}em;", f"  --cut-bottom: {c['bottom_em']}em;", f"  --cut-skew: -{c['skew_deg']}deg;", f"  --blade: {T['angle']['blade']}deg;"]
# grid mobile domyślnie
g = L['grid']
def gridvars(k): return [f"  --cols: {g[k]['cols']};", f"  --gutter: {g[k]['gutter']}px;", f"  --margin: {g[k]['margin']}px;", f"  --section-pad: {L['section-pad'].get(k, L['section-pad']['desktop'] if k in ('laptop','desktop') else 56)}px;", f"  --header-h: {L['header-h']['mobile' if k in ('mobile','tablet') else 'desktop']}px;"]
css += gridvars('mobile')
# typografia mobile
for role, (dz, mb, lh, tr, fam, w, up, cut) in {k: v for k, v in T['type'].items() if not k.startswith('_')}.items():
    css += [f'  --fs-{role}: {mb}px;', f'  --lh-{role}: {lh};', f'  --tr-{role}: {tr}em;']
css.append('}')
for k in ('tablet', 'laptop', 'desktop'):
    css.append(f"@media (min-width: {BP[k]}px) {{ :root {{"); css += gridvars(k)
    if k in ('laptop', 'desktop'):
        for role, v in {k2: v2 for k2, v2 in T['type'].items() if not k2.startswith('_')}.items():
            dz, mb = v[0], v[1]; size = dz if k == 'desktop' else round(mb + (dz-mb)*.7)
            css.append(f'  --fs-{role}: {size}px;')
    css.append('} }')
# motywy
for th, m in T['themes'].items():
    sel = {'plyta': ':root, [data-theme="plyta"]', 'papier': '[data-theme="papier"]', 'stroj-b': '[data-kit="B"]'}[th]
    css.append(sel + ' {'); css += [f'  --{k}: var(--c-{v});' for k, v in m.items() if not k.startswith('_')]
    css.append('  color: var(--text-primary); background-color: var(--bg-primary);' if th != 'stroj-b' else '  background-color: var(--bg-primary);'); css.append('}')
# klasy typografii
css.append('/* role typograficzne */')
for role, (dz, mb, lh, tr, fam, w, up, cut) in {k: v for k, v in T['type'].items() if not k.startswith('_')}.items():
    fv = 'var(--font-display)' if fam == 'display' else 'var(--font-text)'
    css.append(f".t-{role} {{ font-family: {fv}; font-weight: {w}; font-size: var(--fs-{role}); line-height: var(--lh-{role}); letter-spacing: var(--tr-{role});"
               + (' text-transform: uppercase;' if up else '') + (' font-style: normal;') + ' }')
(D/'tokens.css').write_text('\n'.join(css) + '\n')
# Tailwind preset
tw = {'theme': {'screens': {k: f'{v}px' for k, v in BP.items() if v},
      'extend': {'colors': {k.replace('-', ''): v for k, v in P.items()} | {sem: f'var(--{sem})' for sem in T['themes']['plyta'] if not sem.startswith('_')},
                 'spacing': {k: f'{v}px' for k, v in T['space'].items()},
                 'fontFamily': {'display': T['font']['display'].replace('"', '').split(', '), 'text': T['font']['text'].replace('"', '').split(', ')},
                 'fontSize': {r: [f'var(--fs-{r})', {'lineHeight': f'var(--lh-{r})', 'letterSpacing': f'var(--tr-{r})'}] for r in T['type'] if not r.startswith('_')},
                 'maxWidth': {'container': f"{L['container-max']}px", 'reading': f"{L['reading-max']}px"},
                 'borderRadius': {k: f'{v}px' for k, v in T['radius'].items() if not k.startswith('_')}, 'minHeight': {f'control-{k}': f'{v}px' for k, v in T['control'].items() if not k.startswith('_')},
                 'transitionDuration': {k: f'{v}ms' for k, v in T['motion']['duration'].items()},
                 'transitionTimingFunction': T['motion']['easing']}}}
(D/'tailwind.preset.cjs').write_text('/* BeKaPaKa Digital 2.0 — preset Tailwind (wygenerowany). Użycie: presets: [require("./tailwind.preset.cjs")] */\nmodule.exports = ' + json.dumps(tw, indent=2, ensure_ascii=False) + ';\n')
scale = {r: {'desktop': v[0], 'laptop': round(v[1] + (v[0]-v[1])*.7), 'mobile': v[1], 'lh': v[2], 'tracking': v[3]} for r, v in T['type'].items() if not r.startswith('_')}
(D/'type-scale.json').write_text(json.dumps(scale, indent=1))
flat = {f'color.{k}': v for k, v in P.items()} | {f'space.{k}': v for k, v in T['space'].items()}
(D/'tokens.flat.json').write_text(json.dumps(flat, indent=1, ensure_ascii=False))
print('ok: tokens', len(css), 'linii css')
