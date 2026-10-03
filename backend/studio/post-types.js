// Publication purpose is separate from composition and uniform colours.
export const DESIGN_VERSION = '2.0.0';
export const visualStyles = [
  { id: 'sport', label: 'Sportowy', description: 'Ciemny materiał, duże liczby i mocne znaki.' },
  { id: 'photo', label: 'Fotograficzny', description: 'Prawdziwe zdjęcie i treść w wydzielonych polach.' },
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
export const postTypes = groups.flatMap(([category,family,items]) => items.map(([id,variant,label]) => ({ id, family, variant, label, category, version: DESIGN_VERSION, styles: visualStyles.map(s => s.id), formats: ['announcement','result','tournament','schedule'].includes(family) ? ['feed','story','square','landscape'] : ['feed','story'] })));
export const postType = id => postTypes.find(t => t.id === id);
export const designKey = (project, format) => `${DESIGN_VERSION}:${project.postType}:${project.visualStyle}${format ? ':'+format : ''}`;
export const projectTemplateVersion = project => project.postType ? designKey(project) : '1.0.0';
export const rendererVersionFor = project => project.postType ? '2.0.0' : '1.0.5';
