import { compositionLabel, DESIGN_VERSION, designFormats, visualStyles } from '../../lib/contracts';
import type { Project } from '../../lib/types';
import { useEditor } from './editor-context';
import { ImageSelect, Toggle } from './fields';

// Labels of 1.0.0 variants/layouts; only historic projects without a post type use them.
const legacyLabels: Record<string, string> = {
  standard: 'Zapowiedź',
  matchday: 'Dzień meczu',
  postponed: 'Przełożony',
  cancelled: 'Odwołany',
  final: 'Koniec meczu',
  halftime: 'Przerwa',
  live: 'Na żywo',
  five: 'Pierwsza piątka',
  full: 'Pełny skład',
  profile: 'Prezentacja',
  new: 'Nowy zawodnik',
  mvp: 'MVP',
  announcement: 'Zapowiedź',
  program: 'Program',
  summary: 'Podsumowanie',
  cover: 'Okładka',
  photo: 'Fotograficzny',
  carousel: 'Karuzela 4 slajdy',
  wall: 'Zbiorcza plansza',
  spotlight: 'Przedstawienie',
  thanks: 'Podziękowanie',
  schedule: 'Terminarz',
  notice: 'Ogłoszenie',
  news: 'Aktualność',
  marks: 'Znaki drużyn',
  type: 'Typograficzny',
  board: 'Tablica wyniku',
  jerseys: 'Koszulki',
  poster: 'Plakat turnieju',
  editorial: 'Zdjęcie i treść',
  tiles: 'Kafle partnerów',
  paper: 'Papier',
};

export default function CompositionPanel() {
  const { project, d, readonly, change, field, publication, template } = useEditor();
  const current = project.designVersion === DESIGN_VERSION;
  return (
    <details open>
      <summary>Kompozycja</summary>
      <div className="form-group">
        {project.postType ? (
          <div className="editor-compositions">
            {visualStyles
              .filter((style) => !current || publication?.styles.includes(style.id))
              .map((style) => (
                <button
                  key={style.id}
                  disabled={readonly}
                  aria-pressed={project.visualStyle === style.id}
                  onClick={() =>
                    change({
                      ...project,
                      visualStyle: style.id as Project['visualStyle'],
                      formats: project.formats.filter(
                        (f) => !publication || designFormats(publication, style.id).includes(f),
                      ),
                    })
                  }
                >
                  <img src={`/designs/${project.postType}-${style.id}.webp`} alt="" />
                  {compositionLabel(publication, style.id)}
                </button>
              ))}
          </div>
        ) : (
          template && (
            <div className="field-row">
              <label>
                Wariant
                <select
                  value={project.variant}
                  disabled={readonly}
                  onChange={(e) => change({ ...project, variant: e.target.value })}
                >
                  {template.variants.map((v) => (
                    <option key={v} value={v}>
                      {legacyLabels[v] || v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Układ
                <select
                  value={project.layout}
                  disabled={readonly}
                  onChange={(e) => change({ ...project, layout: e.target.value })}
                >
                  {template.layouts.map((v) => (
                    <option key={v} value={v}>
                      {legacyLabels[v] || v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )
        )}
        <label>
          Kolorystyka stroju
          <select value={d.kit} disabled={readonly} onChange={(e) => field('kit', e.target.value as 'A' | 'B')}>
            <option value="A">A · czerń i czerwień</option>
            <option value="B">B · granat i pomarańcz</option>
          </select>
        </label>
        {d.kit === 'B' && <Toggle k="kitBConfirmed" label="To materiał związany ze strojem B" />}
        <ImageSelect k="backgroundAssetId" label="Tło" />
      </div>
    </details>
  );
}
