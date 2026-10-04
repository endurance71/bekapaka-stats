import designManifest from './design-manifest.json' with { type: 'json' };
export { designManifest };
// Publication purpose is separate from composition and uniform colours.
export const DESIGN_VERSION = '3.0.0';
export const visualStyles = [
  { id: 'sport', label: 'Sportowy', description: 'Ciemny materiał, duże liczby i mocne znaki.' },
  { id: 'photo', label: 'Fotograficzny', description: 'Prawdziwe zdjęcie i treść w wydzielonych polach.' },
  { id: 'jersey', label: 'Koszulka matchday', description: 'Koszulka z rzeczywistym numerem i nazwiskiem, według wzorca stroju.' },
  { id: 'editorial', label: 'Redakcyjny', description: 'Jasny papier, typografia i uporządkowane sekcje.' },
];
const groups = [
  ['Mecz','announcement',[['preview','standard','Zapowiedź meczu'],['matchday','matchday','Dzień meczu'],['postponed','postponed','Mecz przełożony'],['cancelled','cancelled','Mecz odwołany']]],
  ['Mecz','result',[['final','final','Wynik końcowy'],['halftime','halftime','Wynik w przerwie'],['live','live','Wynik na żywo']]],
  ['Drużyna i zawodnicy','lineup',[['five','five','Pierwsza piątka'],['roster','full','Pełny skład']]],
  ['Drużyna i zawodnicy','player',[['profile','profile','Prezentacja zawodnika'],['new-player','new','Nowy zawodnik'],['mvp','mvp','MVP meczu']]],
  ['Turniej','tournament',[['tournament-preview','announcement','Zapowiedź turnieju'],['tournament-program','program','Program turnieju'],['tournament-summary','summary','Podsumowanie turnieju']]],
  ['Relacje','report',[['report-cover','cover','Okładka relacji'],['photo-post','photo','Post fotograficzny'],['carousel','carousel','Karuzela · 4 slajdy']]],
  ['Partnerzy','partners',[['partner-wall','wall','Partnerzy klubu'],['partner-profile','spotlight','Przedstawienie partnera'],['partner-thanks','thanks','Podziękowanie partnerom']]],
  ['Informacje','schedule',[['schedule','schedule','Terminarz'],['notice','notice','Ogłoszenie'],['news','news','Aktualność']]],
  ['Statystyki','statistics',[['team-stats','team','Statystyki drużyny'],['player-stats','player','Statystyki zawodnika'],['leaders','leaders','Liderzy meczu'],['standings','standings','Tabela ligi'],['round-summary','round','Podsumowanie kolejki'],['season-summary','season','Podsumowanie sezonu']]],
  ['Życie klubu','club',[['birthday','birthday','Urodziny'],['training-preview','training','Zapowiedź treningu'],['training-report','training-report','Relacja z treningu'],['backstage','backstage','Kulisy klubu'],['quote','quote','Cytat'],['anniversary','anniversary','Jubileusz'],['fan-invitation','invitation','Zaproszenie dla kibiców'],['club-statement','statement','Komunikat klubu']]],
];
// Availability is deliberate. Source templates are draft until the owner reviews each native format.
const compositionSpecs = {
  announcement: {styles:['sport','editorial'],source:'rdzen-v6/01a,01b; stroj-b/01',pages:[36,39]},
  result: {styles:['sport','photo'],source:'rdzen-v6/02a,02b; stroj-b/02',pages:[36,39]},
  lineup: {styles:['editorial'],source:'rdzen-v6/03',pages:[38]},
  player: {styles:['photo','sport'],source:'rdzen-v6/04a,04b',pages:[37,39]},
  tournament: {styles:['photo','sport'],source:'rdzen-v6/05',pages:[37]},
  report: {styles:['editorial'],source:'rdzen-v6/06; karuzela',pages:[38]},
  partners: {styles:['editorial'],source:'rdzen-v6/07 + current equal-exposure registry',pages:[38]},
  schedule: {styles:['editorial'],source:'rdzen-v6/08; information extension',pages:[38]},
  statistics: {styles:['editorial'],source:'extension/numerical-tables',pages:[28,30,55]},
  club: {styles:['editorial','photo'],source:'extension/club-information',pages:[28,30,55]},
};
export const postTypes = groups.flatMap(([category,family,items]) => items.map(([id,variant,label]) => ({
  id, family, variant, label, category, version: DESIGN_VERSION, ...compositionSpecs[family],
  formats: ['announcement','result','tournament','schedule'].includes(family) ? ['feed','story','square','landscape'] : ['feed','story'],
  ...(id==='matchday'?{styles:['sport','editorial','jersey']}:{}),
  status:'draft', referenceStatus:'requires_visual_review',
})));
export const postType = id => postTypes.find(t => t.id === id);
export const isCurrentDesign = project => project.designVersion === DESIGN_VERSION;
export const designKey = (project, format) => {
  const version=project.designVersion || '2.0.0';
  const base=`${version}:${project.postType}:${project.visualStyle}${format ? ':'+format : ''}`;
  return version==='3.0.0' ? `${base}:engine-${designManifest.sha256.slice(0,12)}:kit-${project.content?.kit || 'A'}:material-${project.content?.backgroundAssetId || 'brand'}` : base;
};
export const projectTemplateVersion = project => project.postType ? designKey(project) : '1.0.0';
export const rendererVersionFor = project => project.postType ? project.designVersion || '2.0.0' : '1.0.5';
export function migrateDesign(project) {
  const type=postTypes.find(t=>t.id===project.postType || (t.family===project.family && t.variant===project.variant));
  if(!type) throw new Error('Brak kompozycji dla tego projektu');
  return {...project,postType:type.id,visualStyle:type.styles.includes(project.visualStyle)?project.visualStyle:type.styles[0],designVersion:DESIGN_VERSION,formats:project.formats.filter(f=>type.formats.includes(f))};
}

export const designFormats = (type, style) => style==='jersey' ? ['feed','story'] : type.formats;

export function compositionLabel(type,style) {
 const names={announcement:{sport:'Mecz · znaki',editorial:'Typograficzny',jersey:'Koszulka matchday'},result:{sport:'Tablica wyniku',photo:'Zawodnik i wynik'},lineup:{editorial:'Koszulki na papierze'},player:{photo:'Portret · rama / MVP',sport:'Koszulka · bez portretu'},report:{editorial:'Zdjęcie w ramie'},partners:{editorial:'Równa ekspozycja'},schedule:{editorial:'Papier · paski stroju'},statistics:{editorial:'Tabela liczb'},club:{editorial:'Informacja na papierze',photo:'Fotografia i treść'},tournament:{photo:'Hero · fotografia',sport:'Typograficzny · parametry'}};
 return names[type?.family]?.[style] || visualStyles.find(s=>s.id===style)?.label || style;
}
