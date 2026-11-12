// Przełączniki funkcji panelu sterowane zmiennymi środowiskowymi.
// Domyślnie wyłączone: na produkcji zmienna nie jest ustawiona, lokalnie można włączyć w .env.

/** Zagrywki (tablica, generator zagrywek AI, operacja panel.play). Włącz: PLAYS_ENABLED=true. */
export function playsEnabled(env = process.env) {
  return String(env.PLAYS_ENABLED ?? '').trim().toLowerCase() === 'true';
}
