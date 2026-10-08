export function warsawInput(value: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  const p = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
  return p.replace(' ', 'T');
}
export function warsawIso(value: string) {
  if (!value) return '';
  const wall = Date.parse(value + 'Z');
  let real = wall;
  for (let i = 0; i < 3; i++) {
    const shown = warsawInput(new Date(real).toISOString());
    real += wall - Date.parse(shown + 'Z');
  }
  if (warsawInput(new Date(real).toISOString()) !== value)
    throw new Error('Ta godzina nie istnieje przy zmianie czasu. Wybierz inną.');
  return new Date(real).toISOString();
}
export const weekday = (value: string) =>
  value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('pl-PL', {
        timeZone: 'Europe/Warsaw',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : 'Wybierz datę i godzinę';
