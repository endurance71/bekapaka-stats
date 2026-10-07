# Design tokens BeKaPaKa

Kanoniczna paleta marki jest w [`packages/design-tokens/bkp-tokens.css`](../packages/design-tokens/bkp-tokens.css). Oba frontendy importują ten plik:

| Aplikacja | Plik importu |
|-----------|--------------|
| Strona publiczna (`site/`) | [`packages/digital-design/dist/tokens.css`](../packages/digital-design/dist/tokens.css) (Brandbook 2.0) → role w [`site/app/styles/foundation.css`](../site/app/styles/foundation.css) |
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

## Strona publiczna (CSS) — Website 2.0

Strona nie używa złotych gradientów ani poświaty. Złoto to wyróżnienie (aktywna nawigacja, lider statystyki, focus na płycie), nigdy CTA.

```css
/* Role semantyczne zależne od materiału: data-theme="plyta" | "papier" */
.btn--primary { background: var(--action); color: var(--action-text); }
.kicker::before { background: var(--brand); }
.story__category { color: var(--brand-text); }
```

Role (`--bg`, `--bg-muted`, `--surface`, `--surface-elevated`, `--text`, `--text-secondary`, `--text-muted`, `--line`, `--brand`, `--brand-gold`, `--action`, `--success`, `--warning`, `--danger`, `--focus`) definiuje `site/app/styles/foundation.css`. Sekcja „Kontrast / WCAG” poniżej dotyczy panelu (`frontend/`).

## Kontrast / WCAG

### Dozwolone pary kolorów

| Kontekst | Tło | Tekst | Uwagi |
|----------|-----|-------|-------|
| CTA primary | `--bkp-gold-gradient` | `#000` (`--bkp-on-primary`) | Kanoniczny przycisk akcji |
| Aktywny pill / tab | `bg-bkpk-primary/10` | `text-bkpk-primary` | Użyj `bkpkActivePillClass` z `BkpkButton.tsx` |
| Tekst pomocniczy | `--bkp-bg-surface` | `--bkp-text-secondary` | Min. `text-xs` (12px) |
| Tekst wyciszony | `--bkp-bg-surface` | `--bkp-text-muted` | Tylko ≥12px; przy 10–11px użyj secondary |

### Zakazy

1. **Cykliczne aliasy tokenów** — nigdy `--bkp-gold-gradient: var(--bkp-gold-gradient)` w `:root`; nadpisuje gradient z `bkp-tokens.css` i przezroczyste CTA.
2. **`text-bkpk-primary/20`–`/40`** na tekście UI — opacity primary tylko dla dekoracji (ikony tła, glow), nie dla czytelnego tekstu.
3. **Niezdefiniowane klasy Tailwind** — np. `bg-bkpk-card` bez wpisu w `tailwind.config.ts`.
4. **Opacity na custom shadow** — `shadow-bkpk-primary/20` nie działa; użyj `shadow-bkpk-primary` lub jawnego `shadow-[...]`.

### Wzorzec aktywnych stanów

- **Akcje główne** (submit, „Zobacz analizę”, login) → gradient + czarny tekst (`.bkpk-btn-primary` / `BkpkButton variant="primary"`).
- **Toggle / filtry / taby** → `bkpkActivePillClass` (złoty tint + border), nie `bg-bkpk-primary-fill text-white`.

### Regresja w repo

```bash
# Cykliczne aliasy w global.css
rg 'var\(--bkp-[a-z-]+\);\s*$' frontend/src/styles/global.css

# Zbyt niska opacity primary na tekście
rg 'text-bkpk-primary/(2[0-9]|3[0-9])' frontend/src

# Legacy pomarańcz
rg '#FF6B35|rgba\(255,\s*107,\s*53' frontend/src --glob '!global.css'
```

## Checklist QA wizualnego

Po zmianie tokenów sprawdź ręcznie:

- [ ] **Login** (`panel.bekapaka.pl`) — CTA gradient złoty, czarny tekst, glow, brak pomarańczu
- [ ] **Dashboard briefing** — przycisk „Zobacz analizę” widoczny (gradient + czarny tekst), ghost „Odśwież” obok
- [ ] **Dashboard** — karty, wykresy, hero stats, taby trybu statystyk (gold tint)
- [ ] **Shell** — sidebar active (złote tło ~8%), mobile menu, header glass
- [ ] **Mecze** — filtry (tło `bg-bkpk-surface`), aktywny filtr gold tint; lista filtrów Wszystkie/Rozegrane
- [ ] **Box score / Game detail** — taby BKPK/OPP, sticky headers, primary highlights
- [ ] **Skład** — PlayerCard: numer czytelny, imię w pełnym primary; panel + `bekapaka.pl/sklad`
- [ ] **Liga KALK** — wiersz BeKaPaKa w tabeli / rankingach
- [ ] **Administracja** — tabele, badge ADMIN; meta AI ≥12px, secondary zamiast muted
- [ ] **Wykresy** — kontrast etykiet (muted text) na ciemnym tle

## CI / regresja kolorów (opcjonalnie)

```bash
# Pomarańcz legacy — nie powinien występować poza dokumentacją
rg '#FF6B35|rgba\(255,\s*107,\s*53' frontend/src --glob '!global.css'
```
