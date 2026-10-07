"""Kontrola layoutu strony publicznej BeKaPaKa (Website 2.x).

Uruchomienie (serwer dev lub preview musi działać):
    uv run --with playwright python site/scripts/qa-layout.py http://127.0.0.1:3200

Sprawdza dla 375 / 768 / 1024 / 1440 / 1920 px:
  - poziomy scroll strony i elementy wychodzące poza rodzica (poza kontenerami overflow:auto/hidden),
  - widoczny tekst mniejszy niż 14 px,
  - kontrolki w jednym rzędzie (.actions, .toolbar) o różnej wysokości lub górnej krawędzi,
  - tabele danych przewijane w poziomie przy szerokości >= 1440 px,
  - liczbę H1 (dokładnie 1) i błędy konsoli,
  - artykuły: wykorzystanie szerokości (≥ 1440), podwójne linie, kolumna boczna na blokach szerokich, okładka na pierwszym ekranie (375),
  - zdjęcia: za mały plik względem szerokości (zły `sizes`), zniekształcone proporcje; pola dotyku < 44 px na telefonie.
Kod wyjścia 1, jeśli są naruszenia.
"""

import asyncio
import json
import sys

from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3200'
WIDTHS = [int(w) for w in sys.argv[2].split(',')] if len(sys.argv) > 2 else [375, 768, 1024, 1440, 1920]
ROUTES = [
    '/',
    '/mecze',
    '/mecze?widok=wyniki',
    '/mecze/kalk-4124',
    '/mecze/kalk-4124?widok=akcje',
    '/mecze/kalk-4144',
    '/tabela',
    '/sklad',
    '/sklad/32b52081-2a59-4319-90df-6ebc91e8a210',
    '/sklad/123622e8-ddd8-40d4-986c-acd4ca39e85e',
    '/aktualnosci',
    '/aktualnosci/3-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026',
    '/aktualnosci/iii-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026',
    '/sponsorzy',
    '/klub',
    '/dokumenty',
]

AUDIT = r"""(w) => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('.sr-only,.visually-hidden,[aria-hidden=true],.visually-hidden-focusable') };
  const name = (e) => (typeof e.className === 'string' && e.className ? e.tagName.toLowerCase() + '.' + e.className.split(' ')[0] : e.tagName.toLowerCase());
  const issues = [];
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push(`page-scroll ${document.documentElement.scrollWidth}>${innerWidth}`);
  const clipped = (e) => { for (let p = e.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (['auto', 'scroll', 'hidden', 'clip'].includes(o)) return true } return false };
  document.querySelectorAll('main *').forEach((e) => {
    if (!vis(e) || ['svg', 'path', 'polygon', 'img'].includes(e.tagName.toLowerCase())) return;
    const o = getComputedStyle(e).overflowX;
    if (['auto', 'scroll'].includes(o)) {
      if (w >= 1440 && e.querySelector('table') && e.scrollWidth > e.clientWidth + 2) issues.push(`table-scroll ${name(e)} ${e.scrollWidth}>${e.clientWidth}`);
      return;
    }
    if (['hidden', 'clip'].includes(o) || clipped(e)) return;
    const r = e.getBoundingClientRect(); const pr = e.parentElement.getBoundingClientRect();
    if (r.right > pr.right + 2 && r.right > innerWidth - 1) issues.push(`overflow ${name(e)} right=${Math.round(r.right)} vw=${innerWidth}`);
  });
  const small = {};
  document.querySelectorAll('header *, main *, footer *').forEach((e) => {
    if (!vis(e)) return;
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) return;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 14) { const k = `${name(e)}@${fs}`; small[k] = (small[k] || 0) + 1 }
  });
  Object.entries(small).forEach(([k, n]) => issues.push(`small-text ${k} x${n}`));
  document.querySelectorAll('.actions, .toolbar').forEach((g) => {
    if (!vis(g)) return;
    const kids = [...g.children].filter(vis);
    const tops = new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top)));
    const hs = new Set(kids.map((k) => Math.round(k.getBoundingClientRect().height)));
    if (getComputedStyle(g).flexDirection !== 'column' && tops.size === 1 && hs.size > 1) issues.push(`uneven-controls ${name(g)} h=${[...hs].join('/')}`);
  });
  if (w >= 1024) {
    document.querySelectorAll('main .segmented, main .btn:not(.btn--block)').forEach((c) => {
      if (!vis(c)) return;
      const pw = c.parentElement.getBoundingClientRect().width;
      const cw = c.getBoundingClientRect().width;
      if (pw > 500 && cw >= pw * 0.8) issues.push(`stretched-control ${name(c)} ${Math.round(cw)}/${Math.round(pw)}`);
    });
    document.querySelectorAll('.prose p, .article-markdown__p').forEach((p) => {
      if (vis(p) && p.getBoundingClientRect().width > 760) issues.push(`text-measure ${name(p)} ${Math.round(p.getBoundingClientRect().width)}`);
    });
    document.querySelectorAll('.pbp-event').forEach((e) => {
      if (vis(e) && e.getBoundingClientRect().height > 64) issues.push(`pbp-event-height ${Math.round(e.getBoundingClientRect().height)}`);
    });
    document.querySelectorAll('.fixture').forEach((row) => {
      if (!vis(row)) return;
      const kids = [...row.children].filter(vis).map((k) => { const r = k.getBoundingClientRect(); return [r.left, r.right] }).sort((a, b) => a[0] - b[0]);
      const rw = row.getBoundingClientRect().width;
      for (let i = 1; i < kids.length; i++) if (kids[i][0] - kids[i - 1][1] > rw * 0.4) issues.push(`sparse-row ${name(row)}`);
    });
  }
  const bgOf = (el) => getComputedStyle(el).backgroundColor;
  const pageBg = (el) => { const t = el.closest('[data-theme]'); return t ? getComputedStyle(t).backgroundColor : getComputedStyle(document.body).backgroundColor };
  document.querySelectorAll('main table').forEach((t) => {
    if (!vis(t)) return;
    const label = name(t) + (t.classList[1] ? '.' + t.classList[1] : '');
    const head = t.querySelector('thead th');
    if (head && bgOf(head) === pageBg(t)) issues.push(`table-head-flat ${label}`);
    const rows = [...t.querySelectorAll('tbody tr')].filter(vis).filter((r) => !r.classList.contains('is-own') && !r.classList.contains('is-bkp'));
    for (let i = 0; i + 1 < rows.length; i++) {
      const a = rows[i].querySelector('td,th'); const b = rows[i + 1].querySelector('td,th');
      const sameParity = [...rows[i].parentElement.children].indexOf(rows[i]) % 2 === [...rows[i + 1].parentElement.children].indexOf(rows[i + 1]) % 2;
      if (!sameParity && a && b && bgOf(a) === bgOf(b)) { issues.push(`table-no-zebra ${label}`); break }
    }
    const foot = t.querySelector('tfoot td, tfoot th');
    const last = rows.length ? rows[rows.length - 1].querySelector('td,th') : null;
    if (foot && vis(foot) && (bgOf(foot) === pageBg(t) || (last && bgOf(foot) === bgOf(last)))) issues.push(`table-foot-flat ${label}`);
    // Pierwszy wiersz nie może leżeć pod (przyklejonym) nagłówkiem tabeli.
    const first = rows[0] && rows[0].querySelector('td,th');
    const head0 = t.querySelector('thead th');
    if (first && head0 && vis(first)) {
      const fr = first.getBoundingClientRect(); const hr = head0.getBoundingClientRect();
      if (fr.top < hr.bottom - 1) issues.push(`table-row-covered ${label}`);
    }
    const low = rows.find((r) => r.getBoundingClientRect().height < 44);
    if (low) issues.push(`table-row-low ${label} ${Math.round(low.getBoundingClientRect().height)}`);
  });
  document.querySelectorAll('main .zebra-list').forEach((l) => {
    const kids = [...l.children].filter(vis);
    if (kids.length >= 3 && bgOf(kids[0]) === bgOf(kids[1]) && bgOf(kids[1]) === bgOf(kids[2])) issues.push(`list-no-zebra ${name(l)}`);
  });
  const body = document.querySelector('.art-body');
  if (body) {
    const shell = document.querySelector('.article-detail__shell').getBoundingClientRect();
    const zones = [...body.children].filter(vis).map((c) => c.getBoundingClientRect());
    const used = Math.max(...zones.map((z) => z.right)) - Math.min(...zones.map((z) => z.left));
    if (w >= 1440 && body.classList.contains('art-body--rail') && used < shell.width * 0.9) issues.push(`article-width ${Math.round(used)}/${Math.round(shell.width)}`);
    document.querySelectorAll('.article-markdown__hr').forEach((hr) => {
      const next = hr.nextElementSibling;
      if (vis(hr) && next && parseFloat(getComputedStyle(next).borderTopWidth) >= 2) issues.push(`double-rule before ${name(next)}`);
    });
    const aside = body.querySelector('.art-aside');
    if (aside && vis(aside) && !body.classList.contains('art-body--rail')) {
      const a = aside.getBoundingClientRect();
      body.querySelectorAll('.article-markdown__breakout').forEach((b) => {
        const r = b.getBoundingClientRect();
        if (vis(b) && r.top < a.bottom && r.bottom > a.top && r.right > a.left && r.left < a.right) issues.push(`aside-overlap ${name(b.firstElementChild || b)}`);
      });
    }
    const cover = document.querySelector('.art-cover');
    if (w < 768 && cover && cover.getBoundingClientRect().top + scrollY > 812) issues.push(`cover-below-fold ${Math.round(cover.getBoundingClientRect().top + scrollY)}`);
  }
  // Zdjęcia: atrybut sizes mniejszy niż faktyczna szerokość (przeglądarka pobiera za mały plik → rozmycie)
  // i zniekształcone proporcje. Wyjątki: pliki źródłowe znanej, zbyt małej rozdzielczości (do podmiany).
  const SMALL_SOURCES = ['player-24.webp'];
  document.querySelectorAll('main img, header img').forEach((img) => {
    if (!vis(img) || !img.complete || !img.naturalWidth) return;
    const r = img.getBoundingClientRect(); const cs = getComputedStyle(img); const src = img.currentSrc || img.src;
    if (/\.svg(\?|$|&)/.test(decodeURIComponent(src))) {
      const nr = img.naturalWidth / img.naturalHeight, rr = r.width / r.height;
      if (cs.objectFit === 'fill' && Math.abs(nr - rr) / rr > 0.03) issues.push(`image-distorted ${src.split('/').pop().slice(0, 40)}`);
      return;
    }
    if (r.width > 80 && img.naturalWidth < r.width * 0.95 && !SMALL_SOURCES.some((name) => decodeURIComponent(src).includes(name)))
      issues.push(`image-undersized ${Math.round(img.naturalWidth)}<${Math.round(r.width)} ${decodeURIComponent(src).split('/').pop().slice(0, 40)}`);
    if (cs.objectFit === 'fill') { const nr = img.naturalWidth / img.naturalHeight, rr = r.width / r.height; if (Math.abs(nr - rr) / rr > 0.03) issues.push(`image-distorted ${src.split('/').pop().slice(0, 40)}`) }
  });
  // Pola dotyku na telefonie: wysokość ≥ 44 px (linki w treści akapitów są wyjątkiem).
  if (w < 768) {
    document.querySelectorAll('a, button, select, input, summary, [role=tab]').forEach((e) => {
      if (!vis(e)) return; const r = e.getBoundingClientRect();
      if (r.width <= 2) return;
      const inline = e.tagName === 'A' && getComputedStyle(e).display === 'inline' && e.closest('p, li, dd, figcaption, td');
      if (!inline && r.height < 43.5) issues.push(`tap-target ${Math.round(r.width)}x${Math.round(r.height)} ${name(e)} "${(e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30)}"`);
    });
  }
  const captions = {};
  document.querySelectorAll('figcaption').forEach((f) => { if (!vis(f)) return; const t = f.textContent.trim(); if (t) captions[t] = (captions[t] || 0) + 1 });
  Object.entries(captions).forEach(([t, n]) => { if (n > 3) issues.push(`repeated-caption x${n} "${t.slice(0, 40)}"`) });
  const h1 = document.querySelectorAll('h1').length;
  if (h1 !== 1) issues.push(`h1-count ${h1}`);
  return [...new Set(issues)];
}"""


async def main() -> int:
    total = 0
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome', headless=True)
        for width in WIDTHS:
            context = await browser.new_context(viewport={'width': width, 'height': 1000}, is_mobile=width < 768, has_touch=width < 768)
            page = await context.new_page()
            errors: list[str] = []
            page.on('console', lambda m: errors.append(m.text[:160]) if m.type == 'error' else None)
            page.on('pageerror', lambda e: errors.append(str(e)[:160]))
            for route in ROUTES:
                errors.clear()
                await page.goto(BASE + route, wait_until='networkidle', timeout=90000)
                await page.wait_for_timeout(400)
                issues = await page.evaluate(AUDIT, width)
                issues += [f'console {e}' for e in errors if '404' not in e]
                total += len(issues)
                status = 'OK ' if not issues else 'ERR'
                print(f'{status} {width:>4} {route}')
                for issue in issues:
                    print(f'      - {issue}')
            await context.close()
        await browser.close()
    print(json.dumps({'violations': total}))
    return 1 if total else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
