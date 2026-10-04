import { projectTemplateVersion, isCurrentDesign } from './post-types.js';
import { materialCompatible } from './material-context.js';
import { assetIds, BRAND_VERSION } from './contracts.js';
export function validateProject(project, { assets = [], partners = [], template, approved = false } = {}) {
  const errors = []; const add = (field, message) => errors.push({ field, message });
  if (!isCurrentDesign(project)) add('designVersion', 'Przenieś projekt do bieżącej kompozycji; historyczny układ nie ma potwierdzonej zgodności z brandbookiem');
  const d = project.content; const f = project.family;
  const required = (field, label) => { if (!d[field]?.trim()) add(field, `Uzupełnij: ${label}`); };
  if ((['announcement', 'result', 'lineup', 'tournament', 'report', 'schedule'].includes(f) || (f==='club' && ['birthday','training','anniversary','invitation'].includes(project.variant)))) {
    if (!(f === 'schedule' && project.variant !== 'schedule')) {
      required('date', 'data i godzina');
      if (d.date && (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?(Z|[+-]\d\d:\d\d)$/.test(d.date) || !Number.isFinite(Date.parse(d.date)))) add('date', 'Wybierz datę z godziną i strefą czasową');
    }
  }
  if (['announcement', 'result', 'lineup'].includes(f)) required('opponent', 'rywal');
  if (['announcement', 'result', 'tournament'].includes(f)) required('venue', 'miejsce');
  if (project.visualStyle==='jersey') {required('lastName','nazwisko na koszulce');required('number','numer na koszulce');}
  if (f === 'result' && (d.scoreUs == null || d.scoreThem == null)) add('scoreUs', 'Podaj oba wyniki');
  if (f === 'result' && project.variant === 'final' && d.scoreUs === d.scoreThem && d.scoreUs != null) add('scoreUs', 'Końcowy wynik meczu koszykówki nie może być remisem');
  if (f === 'result' && project.variant !== 'final') required('phase', 'kwarta lub stan meczu');
  if (f === 'announcement' && project.variant === 'postponed') required('originalDate', 'poprzedni termin');
  if (d.kit === 'B' && !d.kitBConfirmed) add('kitBConfirmed', 'Potwierdź kontekst stroju B');
  if (f === 'lineup') {
    if (!d.lineup.length || (project.variant === 'five' && d.lineup.length !== 5)) add('lineup', 'Pierwsza piątka wymaga dokładnie 5 osób; pełny skład co najmniej jednej');
    if (!d.lineupConfirmed) add('lineupConfirmed', 'Potwierdź skład na ten mecz');
    if (d.lineup.some(p => !p.lastName || !p.number)) add('lineup', 'Każdy zawodnik wymaga nazwiska i numeru');
    if (new Set(d.lineup.map(p => p.number)).size !== d.lineup.length) add('lineup', 'Numery w składzie muszą być unikalne');
  }
  if (new Set(d.statistics.map(s => s.label)).size !== d.statistics.length) add('statistics', 'Etykiety statystyk nie mogą się powtarzać');
  if (f === 'player') { required('firstName', 'imię'); required('lastName', 'nazwisko'); required('number', 'numer'); if (project.variant === 'mvp' && !d.mvpConfirmed) add('mvpConfirmed', 'Potwierdź wybór MVP'); }
  if (f === 'tournament') {
    if (project.variant==='program') required('body','program turnieju');
    if (d.edition == null) add('edition', 'Podaj rzeczywistą edycję turnieju');
    if (project.variant !== 'program' && (d.teams == null || d.days == null)) add('teams', 'Podaj rzeczywistą liczbę drużyn i dni');
  }
  if (['tournament', 'report', 'schedule'].includes(f)) required('title', 'nagłówek');
  if (f === 'schedule') {
    if (project.variant === 'schedule' && !d.schedule.length) add('schedule', 'Dodaj daty do terminarza');
    if (project.variant !== 'schedule') required('body', 'treść');
    if (d.schedule.some(r => !r.opponent || !Number.isFinite(Date.parse(r.date)))) add('schedule', 'Uzupełnij datę i rywala każdej pozycji');
  }
  if (f === 'report' && project.variant === 'carousel' && (d.slides.length !== 4 || d.slides.some(s => !s.title || !s.assetId || !s.altText))) add('slides', 'Karuzela wymaga 4 slajdów z tytułem, zdjęciem i tekstem alternatywnym');
  if ((['result', 'player'].includes(f) && !project.postType && project.layout === 'photo') || (f === 'report' && !project.postType && project.variant !== 'carousel')) if (!d.photoAssetId) add('photoAssetId', 'Wybierz zdjęcie lub wariant typograficzny');
  if (f === 'partners' && !d.partnerIds.length) add('partnerIds', 'Wybierz partnerów');
  if (f === 'partners' && project.variant === 'spotlight' && d.partnerIds.length !== 1) add('partnerIds', 'Prezentacja partnera wymaga jednej pozycji');
  if (project.postType) {
    if(f==='partners' && project.variant==='thanks') required('body','treść podziękowania');
    if ((project.visualStyle === 'photo' || f==='report') && !(f === 'report' && project.variant === 'carousel') && !d.photoAssetId) add('photoAssetId','Kompozycja fotograficzna wymaga zdjęcia; wybierz zdjęcie lub inną kompozycję');
    if (['club','statistics'].includes(f)) required('title','nagłówek');
    if (f==='club') { if(project.variant==='birthday'){required('firstName','imię jubilata');required('lastName','nazwisko jubilata');} required('body','treść publikacji'); if (project.variant==='quote') required('attribution','autor cytatu'); if (['birthday','training','anniversary','invitation'].includes(project.variant)) required('date','data wydarzenia'); if (['training','invitation'].includes(project.variant)) required('venue','miejsce'); }
    if (f==='statistics' && (!(d.tableRows?.length) || d.tableRows.some(r=>!r.label.trim()||!r.value.trim()))) add('tableRows','Uzupełnij wszystkie etykiety i wartości; brak danych nie oznacza zera');
    if (f==='statistics' && ['team','player','leaders','round'].includes(project.variant) && d.statScope!=='match') add('statScope','Ten typ dotyczy konkretnego meczu');
    if (f==='statistics' && ['standings','season'].includes(project.variant) && d.statScope!=='season') add('statScope','Podsumowanie sezonu wymaga kontekstu sezonowego');
  }
  for (const id of assetIds(d)) {
    const a = assets.find(a => a.id === id);
    if (!a || a.status !== 'approved' || !['granted', 'not_required'].includes(a.consent)) add('assets', 'Wybrany materiał wymaga zatwierdzenia i dopuszczenia do publikacji');
    if (a?.provenance && a.kind !== 'background') add('assets', 'Ilustracje AI mogą być używane wyłącznie jako tło');
    if (id === d.backgroundAssetId && a && !materialCompatible(project,a)) add('backgroundAssetId','Materiał nie pasuje do powierzchni szablonu lub palety stroju. Wybierz materiał marki albo zgodne tło');
    if (id === d.backgroundAssetId && a?.kind !== 'background') add('backgroundAssetId', 'Wybierz zatwierdzone tło');
    if (id !== d.backgroundAssetId && a && !['photo', 'portrait', 'cutout'].includes(a.kind)) add('photoAssetId', 'Pole zdjęcia wymaga prawdziwej fotografii lub wycięcia');
  }
  for (const id of d.partnerIds) {
    const p = partners.find(p => p.id === id);
    if (!p || p.status !== 'approved') add('partnerIds', 'Każdy partner wymaga sprawdzenia aktualności');
    if (p?.assetId && !assets.some(a => a.id === p.assetId && a.status === 'approved' && ['granted', 'not_required'].includes(a.consent))) add('partnerIds', 'Logo partnera nie jest dopuszczone do publikacji');
  }
  if (!template || template.status !== 'approved' || template.brandVersion !== BRAND_VERSION || template.version !== projectTemplateVersion(project)) add('template', 'Zatwierdź bieżącą wersję szablonu po ocenie podglądu');
  required('altText', 'tekst alternatywny');
  if (!approved) add('approval', 'Potwierdź dane i wygląd tej rewizji');
  const collect = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(collect) : [];
  const strings = [project.name, ...collect(d)];
  if (strings.some(s => /\b(demo|placeholder|lorem ipsum|testowy|do uzupełnienia|dane przykładowe)\b/i.test(s))) add('content', 'Usuń dane demonstracyjne i placeholdery');
  if (strings.some(s => /\[RYWAL\]|za 15 minut|po 3\. kwarcie/i.test(s))) add('content', 'Usuń niepotwierdzony komunikat źródłowego szablonu');
  return { valid: !errors.length, errors, brandVersion: BRAND_VERSION };
}
