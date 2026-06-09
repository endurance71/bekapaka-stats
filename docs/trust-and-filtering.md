# Zaufanie domeny i filtry operatorów (panel.bekapaka.pl)

Playbook dla blokad typu T-Mobile Web Guard / Bezpieczny Internet oraz globalnych filtrów kategorii URL.

## Diagnoza szybka

| Test | Interpretacja |
|------|----------------|
| `bekapaka.pl` działa, `panel.bekapaka.pl` nie | Blokada subdomeny/kategorii, nie IP |
| Oba nie działają na T-Mobile | IP lub cała domena |
| Działa po wyłączeniu Web Guard | Usługa abonenta, nie błąd serwera |
| `scripts/check-reputation.sh` → CERT/blacklist | Wpis na liście — delist |

## Weryfikacja techniczna po wdrożeniu

```bash
# Nagłówki bezpieczeństwa (HSTS, CSP)
curl -sI https://panel.bekapaka.pl | grep -iE 'strict-transport|content-security'

# security.txt
curl -s https://panel.bekapaka.pl/.well-known/security.txt

# Pełny audyt reputacji
./scripts/check-reputation.sh
```

Checklist funkcjonalna:

- [ ] Logowanie do panelu działa
- [ ] Google Fonts ładują się (CSP)
- [ ] `/api/` odpowiada po zalogowaniu
- [ ] `/.well-known/security.txt` zwraca 200
- [ ] `/robots.txt` zwraca 200

## Odblokowanie u operatora (T-Mobile)

1. **Zgłoszenie z ekranu blokady** — każdy zablokowany użytkownik klika „Zgłoś bezpieczną stronę” / „Zgłoś błąd”. To najszybsza ścieżka do ręcznej weryfikacji SOC (zwykle 1–5 dni roboczych).
2. **Web Guard / Bezpieczny Internet** — w aplikacji Mój T-Mobile sprawdź, czy usługa jest włączona. Wyłączenie na próbę rozróżnia filtr abonenta od globalnej blokady.
3. **Porównanie domen** — jeśli strona publiczna działa, a panel nie, w zgłoszeniu podaj obie adresy i fakt, że panel to oficjalny system statystyk klubu sportowego powiązany z `bekapaka.pl`.

## Globalne blacklisty i kategoryzacja

| Usługa | URL | Co zgłosić |
|--------|-----|------------|
| VirusTotal | https://www.virustotal.com | `panel.bekapaka.pl`, `51.210.102.167` |
| FortiGuard | https://www.fortiguard.com/faq/wfratingsubmit | Recategorize → Sports / Recreation |
| Cisco Talos | https://talosintelligence.com/reputation_center | Request review |
| McAfee TrustedSource | https://trustedsource.org | URL categorization |

Kategoria docelowa: **Sports / Recreation** lub **Business** (nie Unknown / Newly Registered).

## CERT Polska

Sprawdzenie:

```bash
curl -s https://hole.cert.pl/domains/domains.txt | grep -i bekapaka || echo "brak wpisu"
```

Jeśli jest wpis — zgłoszenie fałszywego alarmu: https://incydent.cert.pl/

## Infrastruktura w repozytorium

- Snippet Caddy: [`deploy/caddy/bekapaka-blocks.caddy`](../deploy/caddy/bekapaka-blocks.caddy)
- Nagłówki nginx (backup): [`frontend/nginx.prod.conf`](../frontend/nginx.prod.conf)
- Monitoring: [`scripts/check-reputation.sh`](../scripts/check-reputation.sh)

Wdrożenie Caddy na VPS — patrz [vps-runbook.md](./vps-runbook.md#aktualizacja-caddy-bekapaka).

## Czas „rozgrzania” reputacji

Nowe subdomeny często wymagają **2–4 tygodni** stabilnego ruchu HTTPS bez incydentów, nawet po zgłoszeniach. Nagłówki i sygnały zaufania (link do `bekapaka.pl`, `security.txt`) skracają ryzyko ponownej blokady.
