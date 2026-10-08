import { useEditor } from './editor-context';
import { AreaField, DateField, NumberField, TextField, Toggle } from './fields';

const matchFamilies = ['announcement', 'result', 'lineup'];

export default function ContentPanel() {
  const { project } = useEditor();
  const { family, variant, visualStyle, postType } = project;
  const titled = ['tournament', 'report', 'schedule', 'partners', 'club', 'statistics'].includes(family);
  const withBody =
    ['tournament', 'report', 'schedule', 'club', 'statistics'].includes(family) ||
    (!!postType && family === 'partners' && variant === 'thanks');
  return (
    <details open>
      <summary>{matchFamilies.includes(family) ? 'Mecz' : 'Treść materiału'}</summary>
      <div className="form-group">
        {matchFamilies.includes(family) && (
          <>
            <TextField k="opponent" label="Rywal" maxLength={100} />
            <TextField k="opponentShort" label="Skrót rywala na tarczy" maxLength={8} />
          </>
        )}
        {!['player', 'partners'].includes(family) && <DateField k="date" label="Data i godzina · Europe/Warsaw" />}
        {visualStyle === 'jersey' && (
          <>
            <TextField k="lastName" label="Nazwisko na koszulce" maxLength={80} />
            <TextField k="number" label="Numer na koszulce" maxLength={3} />
          </>
        )}
        {family === 'announcement' && (
          <TextField k="entryInfo" label="Wstęp · np. „Wstęp wolny” (tylko potwierdzona informacja)" maxLength={80} />
        )}
        {variant === 'postponed' && <DateField k="originalDate" label="Poprzedni termin" />}
        {['announcement', 'result', 'tournament', 'club'].includes(family) && (
          <TextField k="venue" label="Miejsce" maxLength={100} />
        )}
        {family === 'result' && (
          <>
            <div className="score-inputs">
              <NumberField k="scoreUs" label="BeKaPaKa" />
              <b>:</b>
              <NumberField k="scoreThem" label="Rywal" />
            </div>
            {variant !== 'final' && (
              <>
                <TextField k="phase" label="Kwarta / stan meczu" maxLength={50} />
                <p className="muted small">Wynik na żywo i w przerwie wpisujesz ręcznie. KALK nie jest źródłem live.</p>
              </>
            )}
          </>
        )}
        {titled && <TextField k="title" label="Nagłówek" maxLength={180} />}
        {withBody && <AreaField k="body" label="Treść" />}
        {family === 'tournament' && (
          <div className="field-row three">
            <NumberField k="edition" label="Edycja" />
            <NumberField k="teams" label="Drużyny" />
            <NumberField k="days" label="Dni" />
          </div>
        )}
        {family === 'club' && variant === 'birthday' && (
          <>
            <TextField k="firstName" label="Imię" maxLength={60} />
            <TextField k="lastName" label="Nazwisko" maxLength={80} />
          </>
        )}
        {family === 'club' && variant === 'quote' && <TextField k="attribution" label="Autor cytatu" maxLength={100} />}
        {family === 'player' && (
          <>
            <TextField k="firstName" label="Imię" maxLength={60} />
            <TextField k="lastName" label="Nazwisko" maxLength={80} />
            <div className="field-row">
              <TextField k="number" label="Numer" maxLength={3} />
              <TextField k="position" label="Pozycja" maxLength={40} />
            </div>
            {variant === 'mvp' && <Toggle k="mvpConfirmed" label="Potwierdzam wybór zawodnika MVP" />}
          </>
        )}
      </div>
    </details>
  );
}
