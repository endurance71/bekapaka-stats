"""Audyt mobilny strony publicznej BeKaPaKa: iPhone 390×844, ekran 2×, dotyk.

Uruchomienie (serwer dev, preview albo produkcja):
    uv run --with playwright python site/scripts/qa-mobile.py https://bekapaka.pl [--shots KATALOG]

Dla każdej trasy i otwartego menu sprawdza:
  - kontrast tekstu względem faktycznego tła (WCAG AA: 4,5 : 1, duży tekst 3 : 1),
  - tekst mniejszy niż 14 px,
  - pola dotyku niższe niż 44 px (linki w treści akapitów są wyjątkiem),
  - zdjęcia: uszkodzone, pobrane w za małej rozdzielczości (zły `sizes`), zniekształcone, bez atrybutu alt,
  - przewijanie w bok i błędy konsoli.
Z `--shots` zapisuje zrzuty kolejnych ekranów każdej strony (przegląd wizualny).
Kod wyjścia 1, jeśli są uwagi.
"""

import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
BASE = ARGS[0] if ARGS else 'http://127.0.0.1:3200'
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
ROUTES = [
    ('home', '/'), ('mecze', '/mecze'), ('mecze-wyniki', '/mecze?widok=wyniki'),
    ('mecz-zapowiedz', '/mecze/kalk-4144'), ('mecz-wynik', '/mecze/kalk-4124'), ('mecz-akcje', '/mecze/kalk-4124?widok=akcje'),
    ('tabela', '/tabela'), ('sklad', '/sklad'),
    ('profil', '/sklad/32b52081-2a59-4319-90df-6ebc91e8a210'), ('profil-1-mecz', '/sklad/123622e8-ddd8-40d4-986c-acd4ca39e85e'),
    ('aktualnosci', '/aktualnosci'),
    ('artykul', '/aktualnosci/3-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026'),
    ('artykul-plakat', '/aktualnosci/iii-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026'),
    ('sponsorzy', '/sponsorzy'), ('klub', '/klub'), ('dokumenty', '/dokumenty'), ('404', '/nie-ma-takiej-strony'),
]
# Pliki źródłowe o znanej, zbyt małej rozdzielczości — do podmiany na większe (nie są błędem `sizes`).
SMALL_SOURCES = ['player-24.webp']

AUDIT = r"""(smallSources) => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05 && !e.closest('.sr-only,.visually-hidden,[aria-hidden=true]') };
  const label = (e) => { const t = (e.innerText || e.getAttribute('aria-label') || e.alt || '').trim().replace(/\s+/g, ' ').slice(0, 40); return `${e.tagName.toLowerCase()}${typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : ''} "${t}"` };
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 } };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) };
  const background = (el) => { const stack = []; for (let p = el; p; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.backgroundImage && cs.backgroundImage !== 'none' && !cs.backgroundImage.includes('gradient')) return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 0.99) break } } let base = { r: 255, g: 255, b: 255 }; for (let i = stack.length - 1; i >= 0; i--) { const c = stack[i]; base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) } } return base };
  const issues = []; const seen = new Set(); const add = (k) => { if (!seen.has(k)) { seen.add(k); issues.push(k) } };
  if (document.documentElement.scrollWidth > innerWidth + 1) add(`page-scroll ${document.documentElement.scrollWidth}`);
  document.querySelectorAll('body *').forEach((e) => {
    if (!vis(e)) return;
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) return;
    const cs = getComputedStyle(e); const fs = parseFloat(cs.fontSize);
    if (fs < 14) add(`small-text ${fs}px ${label(e)}`);
    const fg = parse(cs.color); const bg = background(e);
    if (!fg || !bg || (cs.webkitTextFillColor || '').includes('rgba(0, 0, 0, 0)')) return;
    const mix = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
    const L1 = lum(mix), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) add(`contrast ${ratio.toFixed(2)} ${Math.round(fs)}px ${label(e)}`);
  });
  document.querySelectorAll('a, button, select, input, summary, [role=tab]').forEach((e) => {
    if (!vis(e)) return; const r = e.getBoundingClientRect(); if (r.width <= 2) return;
    const inline = e.tagName === 'A' && getComputedStyle(e).display === 'inline' && e.closest('p, li, dd, figcaption, td');
    if (!inline && r.height < 43.5) add(`tap-target ${Math.round(r.width)}x${Math.round(r.height)} ${label(e)}`);
  });
  document.querySelectorAll('img').forEach((img) => {
    if (!vis(img)) return; const r = img.getBoundingClientRect(); const cs = getComputedStyle(img); const src = decodeURIComponent(img.currentSrc || img.src);
    if (!img.hasAttribute('alt')) add(`image-no-alt ${src.split('/').pop().slice(0, 40)}`);
    if (img.complete && img.naturalWidth === 0) { add(`image-broken ${src.split('/').pop().slice(0, 40)}`); return }
    if (!img.naturalWidth) return;
    if (cs.objectFit === 'fill') { const nr = img.naturalWidth / img.naturalHeight, rr = r.width / r.height; if (Math.abs(nr - rr) / rr > 0.03) add(`image-distorted ${src.split('/').pop().slice(0, 40)}`) }
    if (!/\.svg/.test(src) && r.width > 80 && img.naturalWidth < r.width * 0.95 && !smallSources.some((n) => src.includes(n))) add(`image-undersized ${Math.round(img.naturalWidth)}<${Math.round(r.width)} ${src.split('/').pop().slice(0, 40)}`);
  });
  return { issues, height: document.documentElement.scrollHeight };
}"""


async def screenshots(page, folder):
    os.makedirs(folder, exist_ok=True)
    height = await page.evaluate('document.documentElement.scrollHeight')
    for index, y in enumerate(range(0, height, 844 - 120)):
        await page.evaluate(f'window.scrollTo(0, {y})')
        await page.wait_for_timeout(300)
        await page.screenshot(path=f'{folder}/{index:02d}.png')


async def main() -> int:
    total = 0
    report = {}
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome', headless=True)
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
        page = await context.new_page()
        errors: list[str] = []
        page.on('console', lambda m: errors.append(m.text[:140]) if m.type == 'error' else None)
        for name, route in ROUTES + [('menu', '/')]:
            errors.clear()
            await page.goto(BASE + route, wait_until='networkidle', timeout=90000)
            height = await page.evaluate('document.documentElement.scrollHeight')
            for y in range(0, height, 700):  # wczytanie zdjęć leniwych
                await page.evaluate(f'window.scrollTo(0, {y})')
                await page.wait_for_timeout(100)
            await page.evaluate('window.scrollTo(0, 0)')
            await page.wait_for_timeout(600)
            if name == 'menu':
                await page.click('button[aria-label="Otwórz menu nawigacji"]')
                await page.wait_for_timeout(700)
            result = await page.evaluate(AUDIT, SMALL_SOURCES)
            issues = result['issues'] + [f'console {e}' for e in errors if '404' not in e]
            report[name] = issues
            total += len(issues)
            print(f"{'OK ' if not issues else 'ERR'} {name:<16} {route}  ({result['height']} px)")
            for issue in issues:
                print(f'      - {issue}')
            if SHOTS:
                if name == 'menu':
                    os.makedirs(f'{SHOTS}/menu', exist_ok=True)
                    await page.screenshot(path=f'{SHOTS}/menu/00.png')
                else:
                    await screenshots(page, f'{SHOTS}/{name}')
        await browser.close()
    if SHOTS:
        with open(f'{SHOTS}/report.json', 'w') as handle:
            json.dump(report, handle, ensure_ascii=False, indent=1)
    print(json.dumps({'issues': total}))
    return 1 if total else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
