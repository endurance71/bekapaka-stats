# Publiczna strona + CMS — rollout

## Mapowanie domen i kontenerów

- `bekapaka.pl` i `www.bekapaka.pl` -> `bkpk-site-prod` (`127.0.0.1:8082`)
- `panel.bekapaka.pl` -> `bkpk-frontend-prod` (`127.0.0.1:8081`)
- `cms.bekapaka.pl` -> `bkpk-cms-prod` (`127.0.0.1:1337`)
- `moya-api.damianmotylinski.pl` pozostaje bez zmian -> `127.0.0.1:3000`

## Caddy (przykład bloków BeKaPaKa)

```caddyfile
bekapaka.pl, www.bekapaka.pl {
  reverse_proxy 127.0.0.1:8082
}

panel.bekapaka.pl {
  reverse_proxy 127.0.0.1:8081
}

cms.bekapaka.pl {
  basicauth {
    admin JDJhJDEwJG5iN2c0NmNhY0J4dFQwZm5hN3M3NE9zNU1xR1pMSThjUDBXWmExNldDbDVQWktYQzJ3YjJX
  }
  reverse_proxy 127.0.0.1:1337
}
```

## Dane i źródła

- Dane sportowe (readonly): `bkpk-backend-prod` (`/api/league/table`, `/api/roster`)
- Dane redakcyjne: Strapi (`news-posts`, `events`, `sponsors`, `documents`, `homepage-sections`)
- Publiczna strona łączy oba źródła i używa rewalidacji co 300 sekund

## Role CMS

- `admin`: zarządzanie konfiguracją i publikacjami
- `editor`: publikacja treści bez zmian konfiguracji systemowej

## Aktualna lista sponsorów

- Gmina Bobolice
- CERTE. Kancelaria Doradcy Podatkowego Inez Szczęśniak
- Contema Bobolice
- Emil Jaświg
- PST Sped-Trans Bobolice
- Nadleśnictwo Bobolice, Lasy Państwowe
- ALAB laboratoria
- Piotr Adamus
- „Skup aut i Auto laweta” Remek Klimek
- CESIR Bobolice
- Fem-Tech Tychowo
- Baumal e-hurtowniabudowlana.pl
- Majster Plus Koszalin
- Insight Data Consulting Izabela Kaszubowska

## Etapy i checklista go-live

1. **Foundation**
   - uruchomić `bkpk-cms` i `bkpk-site` w `docker-compose.prod.yml`
   - sprawdzić health endpointy kontenerów i logi startowe
2. **Content model**
   - utworzyć kolekcje wg `cms/content-types/*.schema.json`
   - skonfigurować role `admin` i `editor`
3. **Public UI**
   - zweryfikować sekcje: aktualności, wydarzenia, sponsorzy, dokumenty, zawodnicy, tabela
4. **Integracja**
   - sprawdzić odczyt z backendu i CMS na `site`
   - potwierdzić rewalidację danych
5. **SEO i wydajność**
   - uzupełnić metadata i OpenGraph
   - sprawdzić wydajność kluczowych widoków
6. **Go-live**
   - wykonać backup `cms/data` + `data/pgdata`
   - podmienić bloki Caddy, zrobić `caddy validate` i `reload`
   - smoke test domen: `bekapaka.pl`, `panel.bekapaka.pl`, `cms.bekapaka.pl`
