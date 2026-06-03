# Design tokens BeKaPaKa

Kanoniczna paleta marki jest w [`packages/design-tokens/bkp-tokens.css`](../packages/design-tokens/bkp-tokens.css). Oba frontendy importują ten plik:

| Aplikacja | Plik importu |
|-----------|--------------|
| Strona publiczna (`site/`) | [`site/app/styles/tokens.css`](../site/app/styles/tokens.css) |
| Panel (`frontend/`) | [`frontend/src/styles/global.css`](../frontend/src/styles/global.css) |

## Zasady

1. **Nie hardcoduj kolorów** w komponentach — używaj tokenów CSS lub klas Tailwind `bkpk-*`.
2. **Zmiany brandu** wprowadzaj wyłącznie w `bkp-tokens.css`, potem weryfikuj oba produkty.
3. **Deploy kolorystyki** — po zmianie tokenów wdrażaj razem `bkpk-site-prod` i `bkpk-frontend-prod`.

## Paleta (skrót)

| Token | Wartość | Użycie |
|-------|---------|--------|
| `--bkp-gold` | `#ECA72C` | Akcent primary, linki, aktywna nawigacja |
| `--bkp-gold-strong` | `#F0B849` | Hover akcentu |
| `--bkp-copper` | `#D97736` | Gradient CTA, active state |
| `--bkp-crimson` | `#D32F2F` | Błędy, porażki |
| `--bkp-bg-app` | `#0B0B0C` | Tło aplikacji |
| `--bkp-bg-surface` | `#121214` | Karty, sidebar |
| `--bkp-border` | `rgba(255,255,255,0.08)` | Obramowania subtelne |
| `--bkp-gold-gradient` | gold → copper | Przyciski primary |

## Panel (Tailwind)

```tsx
// Tło, tekst, akcent
<div className="bg-bkpk-bg text-bkpk-text-primary border border-bkpk-border-subtle">
  <span className="text-bkpk-primary">Akcent</span>
</div>

// Przycisk primary (gradient jak strona)
<button className="bkpk-btn-primary rounded-bkpk-md px-5 py-2.5 font-bold">
  Zapisz
</button>
```

## Strona publiczna (CSS)

```css
.cta {
  background: var(--gold-gradient);
  color: #000;
  box-shadow: var(--glow-gold);
}
```

Aliasy strony (`--accent`, `--bg-app`) mapują na tokeny wspólne w `tokens.css`.

## Checklist QA wizualnego

Po zmianie tokenów sprawdź ręcznie:

- [ ] **Login** (`panel.bekapaka.pl`) — CTA gradient złoty, glow, brak pomarańczu
- [ ] **Dashboard** — karty, wykresy, hero stats
- [ ] **Shell** — sidebar active (złote tło ~8%), mobile menu, header glass
- [ ] **Mecze / Box score** — sticky headers, primary highlights
- [ ] **Skład** — panel + `bekapaka.pl/sklad` — spójne karty zawodników
- [ ] **Liga KALK** — wiersz BeKaPaKa w tabeli / rankingach
- [ ] **Administracja** — tabele, badge ADMIN
- [ ] **Wykresy** — kontrast etykiet (muted text) na ciemnym tle

## CI / regresja kolorów (opcjonalnie)

```bash
# Pomarańcz legacy — nie powinien występować poza dokumentacją
rg '#FF6B35|rgba\(255,\s*107,\s*53' frontend/src --glob '!global.css'
```
