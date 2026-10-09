/**
 * Druk odprawy przedmeczowej (A4 / PDF), także z aplikacji na iPhonie.
 * W PWA iOS `window.print()` nie działa, a Safari nie ma sesji aplikacji — dlatego panel pobiera krótki
 * podpisany link (15 min), otwiera go w Safari, a serwer zwraca gotową stronę A4 do druku lub zapisu PDF.
 */
import jwt from 'jsonwebtoken';

const SCOPE = 'pregame-print';
export const PRINT_LINK_TTL = '15m';

export function signPrintToken(secret, { seasonId, opponent }) {
  return jwt.sign({ scope: SCOPE, seasonId, opponent }, secret, { expiresIn: PRINT_LINK_TTL });
}

/** @returns {{ seasonId: string, opponent: string } | null} */
export function verifyPrintToken(secret, token) {
  try {
    const payload = jwt.verify(String(token || ''), secret);
    if (payload?.scope !== SCOPE || !payload.opponent || !payload.seasonId) return null;
    return { seasonId: payload.seasonId, opponent: payload.opponent };
  } catch {
    return null;
  }
}

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const asList = (v) => (Array.isArray(v) ? v : []);
const FOCUS = { offense: 'Atak', defense: 'Obrona', transition: 'Kontra', rebounding: 'Zbiórki', mental: 'Nastawienie' };
const NONE = '—';

/**
 * Strona A4 odprawy. Logistyka z terminarza i dnia meczowego ma pierwszeństwo przed zapisem odprawy.
 * @param {{ briefing: any, logistics: { matchDate: Date|null, tipoffTime: string|null, gatheringTime: string|null, kit: string|null }, venue?: string|null, opponent: string }} data
 */
export function renderPregamePrintHtml({ briefing, logistics, venue, opponent }) {
  const date = logistics?.matchDate || (briefing?.matchDate ? new Date(briefing.matchDate) : null);
  const dateText = date ? date.toLocaleDateString('pl-PL', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Warsaw' }) : NONE;
  const tipoff = logistics?.tipoffTime || briefing?.tipoffTime || NONE;
  const gathering = logistics?.gatheringTime || briefing?.gatheringTime || NONE;
  const kit = logistics?.kit || briefing?.jerseyColor || 'trener poda';
  const hall = venue || briefing?.venue || NONE;

  const keys = asList(briefing?.tacticalKeys)
    .map((k) => `<li><span class="tag">${esc(FOCUS[k.focus] ?? 'Taktyka')}</span><strong>${esc(k.title)}</strong><p>${esc(k.description)}</p></li>`)
    .join('');
  const five = asList(briefing?.startingFive)
    .map((p) => `<tr><td class="pos">${esc(p.position)}</td><td><strong>${p.number != null ? `#${esc(p.number)} ` : ''}${esc(p.name)}</strong></td><td>${esc(p.assignment)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Odprawa: BeKaPaKa vs ${esc(opponent)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; font: 14px/1.45 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #111; background: #fff; }
  .sheet { max-width: 186mm; margin: 0 auto; }
  header { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #c8102e; padding-bottom: 10px; }
  header img { width: 48px; height: 48px; }
  h1 { font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: .02em; }
  .kicker { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: #666; }
  .facts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 14px 0; }
  .facts div { border: 1px solid #ddd; padding: 8px; }
  .facts b { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #666; font-weight: 600; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .06em; margin: 18px 0 8px; border-left: 4px solid #c8102e; padding-left: 8px; }
  ol { margin: 0; padding-left: 18px; } li { margin-bottom: 8px; } li p { margin: 2px 0 0; }
  .tag { display: inline-block; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; border: 1px solid #999; padding: 0 4px; margin-right: 6px; }
  table { width: 100%; border-collapse: collapse; } td { border-bottom: 1px solid #e3e3e3; padding: 6px 4px; vertical-align: top; }
  td.pos { width: 72px; color: #c8102e; font-weight: 700; }
  .bench { border: 1px solid #ddd; padding: 8px; }
  .toolbar { margin: 0 auto 12px; max-width: 186mm; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .toolbar button { font: inherit; font-weight: 700; padding: 10px 16px; border: 0; background: #c8102e; color: #fff; text-transform: uppercase; letter-spacing: .06em; }
  .hint { color: #555; font-size: 13px; }
  @media print { .toolbar { display: none; } body { padding: 0; } }
  @media (max-width: 560px) { .facts { grid-template-columns: repeat(2, 1fr); } }
</style>
</head>
<body>
<div class="toolbar">
  <button type="button" id="print">Drukuj / zapisz PDF</button>
  <span class="hint" id="ios-hint" hidden>Na iPhonie: przycisk „Udostępnij” → „Drukuj” albo „Zapisz w Plikach” (PDF).</span>
</div>
<div class="sheet">
  <header>
    <img src="/icon-192.png" alt="">
    <div><div class="kicker">KALK Dywizja II · Odprawa przedmeczowa</div><h1>BeKaPaKa vs ${esc(opponent)}</h1></div>
  </header>
  <div class="facts">
    <div><b>Data</b>${esc(dateText)}</div>
    <div><b>Zbiórka / mecz</b>${esc(gathering)} / ${esc(tipoff)}</div>
    <div><b>Strój</b>${esc(kit)}</div>
    <div><b>Hala</b>${esc(hall)}</div>
  </div>
  ${keys ? `<h2>3 kluczowe założenia</h2><ol>${keys}</ol>` : ''}
  ${five ? `<h2>Pierwsza piątka i zadania</h2><table>${five}</table>` : ''}
  ${briefing?.benchKeys ? `<h2>Rola rezerwowych</h2><div class="bench">${esc(briefing.benchKeys)}</div>` : ''}
  ${!briefing ? '<p>Odprawa na ten mecz nie jest jeszcze gotowa.</p>' : ''}
</div>
<script src="print.js"></script>
</body>
</html>`;
}

/** Skrypt strony druku (osobny plik — CSP panelu blokuje skrypty inline). */
export const PRINT_SCRIPT = `(function () {
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var btn = document.getElementById('print');
  if (btn) btn.addEventListener('click', function () { window.print(); });
  if (ios) { var h = document.getElementById('ios-hint'); if (h) h.hidden = false; }
  else window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 300); });
})();`;

export function printErrorHtml(message) {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Odprawa</title></head><body style="font:16px/1.5 -apple-system,Arial,sans-serif;padding:24px"><p>${esc(message)}</p></body></html>`;
}
