# Silnik AI: API ↔ Claude Agent SDK, oraz MCP dla Claude Code

Stan na 2026-10-10. Gałąź `feat/ai-engine-agent-sdk`.

W skrócie:

- W **Ustawieniach panelu** (Administracja → „Dostawca AI”) i w **Studio** (Ustawienia → „Dostawca AI”) jest jedno wspólne ustawienie. Decyduje, czy teksty AI pisze dotychczasowe **API**, czy **Claude Agent SDK**.
- **Obrazy zawsze idą przez dotychczasowe API obrazów**, niezależnie od ustawienia.
- **Twój Claude Code na Twojej subskrypcji** może wykonywać te same zadania przez MCP Studio. Przygotowuje je narzędziem `prepare_ai_task`, a wynik zapisuje przez `submit_ai_task_result`.

---

## A. Architektura przed zmianami

| Obszar | Stan |
|---|---|
| Studio | Warstwa wielu dostawców w `backend/studio/providers/*`: Gemini, Claude przez `@anthropic-ai/sdk` i OpenAI. Model wybierany osobno dla każdego zadania (`copy`, `report`, `text`, `image`). Miesięczny budżet z rezerwacją najgorszego kosztu (`StudioAiUsage`). Zadania wykonuje osobny kontener `bkpk-studio-worker`. Obrazy obsługuje tylko Gemini. |
| Panel | 6 operacji na Gemini, konfigurowanych wyłącznie przez env (`backend/ai/geminiClient.js`). Nie ma wyboru dostawcy, budżetu ani logu kosztów. |
| MCP Studio | `/api/studio/v1/mcp` z tokenami agenta (zakresy `read`/`draft`). Agent może proponować teksty kanałów. |
| Wspólne | Jeden proces backendu (Express 5) i jedna baza Postgres. Panel loguje przez JWT (rola ADMIN), Studio przez sesję jednego właściciela. |

## B. Architektura po zmianach

```
Panel (trasy /api/…)        Studio (kolejka → worker)        MCP (Claude Code właściciela)
        │                            │                                   │
        └──────── prepare (kontekst, prompt, hash) ─────────────────────┤
                         │                                               │
            AiEngineSetting (globalne, TTL 5 s)                prepare_ai_task / submit_ai_task_result
             ├─ 'api'  → geminiClient (panel) / providers/clients (Studio)       │
             └─ 'claude-agent-sdk' → ai-engine/agentSdk.js (query(), bez narzędzi)│
                         │                                               │
        └──────── save (te same walidatory i zapis) ────────────────────┘
Obrazy (zadanie 'image') → zawsze generateImage (Gemini), poza routingiem
```

- **`backend/ai-engine/`** to wspólny rdzeń, działający także w obrazie workera:
  - `settings.js`: ustawienie i audyt.
  - `agentSdk.js`: adapter Claude Agent SDK.
  - `status.js`: status silnika i test połączenia.
  - `log.js`: `AiGenerationLog`.
  - `operations.js`: mapa operacji.
  - `errors.js`: wspólne `ProviderError`/`failure`/`portableSchema`.
- **Panel:**
  - `ai/textEngine.js` (`aiText`) wybiera silnik.
  - `ai/generate.js` i `ai/tacticsOps.js` mają dla każdej operacji układ `prepare… → aiText → save…`.
  - `ai/agentOperations.js` udostępnia te same `prepare/save` dla MCP.
- **Studio:**
  - `studio/ai.js`: `resolveModel` zapisuje silnik w snapshotcie joba, więc rozpoczęte joby kończą się na swoim silniku.
  - `textCall` wybiera między SDK a dotychczasowym `generateJson`.
  - Rezerwacja dla SDK wynosi ×2, a rozliczenie liczy się z `total_cost_usd`.
- **MCP:** narzędzia `list_ai_tasks`, `prepare_ai_task`, `submit_ai_task_result` oraz opcjonalny zakres tokenu `panel-ai`.

## C. Wprowadzone zmiany

| Plik | Co i dlaczego |
|---|---|
| `backend/prisma/schema.prisma`, `migrations/20261010120000_ai_engine/` | Trzy nowe tabele, migracja wyłącznie dodaje: `AiEngineSetting`, `AiSettingAudit`, `AiGenerationLog`. |
| `backend/ai-engine/*` (nowe) | Wspólny rdzeń silnika (szczegóły w części B). |
| `backend/studio/providers/clients.js` | `ProviderError`/`failure`/`portableSchema` przeniesione do `ai-engine/errors.js` i re-eksportowane. Doszły kody błędów. |
| `backend/studio/providers/catalog.js` | `reservationFor` i `SDK_RESERVE_FACTOR`. |
| `backend/studio/providers/settings.js` | `aiOverview` pokazuje silnik. Zadania tekstowe mają `model` (aktywny) i `apiModel` (wybór dla API). |
| `backend/studio/providers/routes.js` | `GET/PUT /ai/engine`, `POST /ai/engine/test`. |
| `backend/studio/ai.js` | Routing SDK/API, rozliczenie, log. Obraz nigdy nie trafia do SDK. |
| `backend/studio/agent/{mcp,tokens,operations}.js` | Narzędzia zadań AI, zakres `panel-ai`, operacje Studio dla agenta. |
| `backend/ai/{textEngine,tacticsOps,agentOperations}.js` (nowe), `generate.js`, `geminiClient.js`, `catalog.js`, `routes/tactics.js` | Punkt wpięcia panelu bez powielania logiki. Kolumny `*Model` zapisują model, który faktycznie odpowiedział. |
| `backend/server.js` | `GET/PUT /api/ai/engine` i `POST /api/ai/engine/test` (tylko ADMIN). `/api/ai/status` uwzględnia silnik. |
| `frontend/src/features/admin/AiEngineSettings.tsx` (nowy), `pages/Administration.tsx` | Sekcja „Dostawca AI”. |
| `frontend/src/components/...`, `pages/ScoutingPage.tsx` | Napisy „Gemini” na sztywno zamienione na „AI”. |
| `frontend/nginx.prod.conf` | 180 s limitu tylko dla tras generowania AI. |
| `studio/src/features/ai/AiEngine.tsx` (nowy), `AiProviders.tsx`, `pages/SettingsPage.tsx`, `lib/{types,queries}.ts` | Karta „Dostawca AI” w Studio. |
| `studio/src/features/publications/{AgentTokens,AiCopyDialog}.tsx`, `graphic-editor/ExportPanel.tsx` | Zakres `panel-ai`. W trybie SDK nie ma jednorazowego wyboru modelu, bo backend by go zignorował. |
| `backend/package.json` | `@anthropic-ai/claude-agent-sdk@0.3.293`, wersja przypięta dokładnie. |
| `backend/studio/Dockerfile.worker`, `docker-compose.prod.yml`, `.github/workflows/studio.yml`, `backend/.env*.example` | Wdrożenie (szczegóły w części G). |
| `backend/tests/unit/*` | Testy opisane w części F. |
| `docs/studio-content-system.md` | Wygenerowany ponownie, bo lista narzędzi MCP się zmieniła. |

## D. Mapa obsługi AI

| Funkcja | Plik / trasa | API | Claude Agent SDK | MCP (Claude Code) | Routing |
|---|---|---|---|---|---|
| Analiza meczu | `ai/generate.js` · `POST /api/games/:id/analyze` | Tak (Gemini) | Tak (Markdown) | Tak, zakres `panel-ai` | Przełącznik |
| Plan rozwoju zawodnika | `generate.js` · `POST /api/players/:id/analyze` | Tak | Tak (JSON) | Tak, `panel-ai` | Przełącznik |
| Raport scoutingowy | `generate.js` · `POST /api/scouting/analyze` | Tak | Tak (JSON) | Tak, `panel-ai` | Przełącznik |
| Briefing drużyny | `generate.js` · `POST /api/ai/briefing/generate` | Tak | Tak (Markdown) | Tak, `panel-ai` | Przełącznik |
| Generator zagrywek | `ai/tacticsOps.js` · `POST /api/tactics/plays/generate` | Tak | Tak (JSON) | Tak, `panel-ai` | Przełącznik |
| Karta odprawy | `tacticsOps.js` · `POST /api/tactics/pregame/generate` | Tak | Tak (JSON) | Tak, `panel-ai` | Przełącznik |
| Teksty publikacji (IG, FB, WWW) | `studio/ai.js` · `POST /publications/:id/ai-copy` | Tak (model zadania) | Tak | Tak (`studio.copy`) | Przełącznik |
| Relacja meczowa WWW | `studio/ai.js` (krok reportera) | Tak | Tak | Tak (`studio.report`) | Przełącznik |
| Opis i alt grafiki | `studio/ai.js` · `POST /projects/:id/jobs {ai-text}` | Tak | Tak | Nie: wynik nie ma miejsca zapisu poza jobem | Przełącznik |
| Tła AI (generowanie obrazów) | `studio/ai.js` · `generateImage` | Tak (Gemini) | **Nie** | Nie | **Zawsze API** |
| Edycja obrazów, inpainting, image-to-image | Nie istnieją w repo | — | — | — | — |
| Embeddings, OCR, moderacja, transkrypcja | Nie istnieją w repo | — | — | — | — |
| Kampanie, scenariusze, storyboardy, Remotion | Nie istnieją. Decyzją właściciela to osobny etap; dojdą jako nowe wpisy w `ai-engine/operations.js` i rejestrach. | — | — | — | — |

## E. Uwierzytelnianie

Źródła (sprawdzone 2026-10-10):

- [API credits for Max and Team plans](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers), aktualizacja z 7.10.2026
- [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)

**Jak odbywa się autoryzacja:**

- **Serwerowe Agent SDK** używa wyłącznie klucza API z Claude Console (`AGENT_SDK_ANTHROPIC_API_KEY`). Adapter ma cztery zabezpieczenia:
  1. Zastępuje środowisko procesu minimalnym zestawem z pustym `HOME`, więc nie trafiają tam żadne sekrety serwera ani logowanie OAuth.
  2. Odrzuca `CLAUDE_CODE_OAUTH_TOKEN` i `ANTHROPIC_AUTH_TOKEN` oraz tokeny `sk-ant-oat…`.
  3. Przerywa wywołanie przed wysłaniem zapytania, gdy CLI zgłosi `apiKeySource` inne niż `ANTHROPIC_API_KEY`.
  4. Sprawdzone testem dymnym na wersji 0.3.293: init zwraca `"apiKeySource":"ANTHROPIC_API_KEY"`, a jedynym narzędziem jest `StructuredOutput`.
- **Limity subskrypcji** wykorzystujesz legalnie przez **Twój Claude Code**, czyli niezmodyfikowaną aplikację Anthropic, w której jesteś zalogowany swoim kontem. Podłączasz go do MCP Studio, a serwer niczego nie pośredniczy.

**Czy można legalnie wykorzystać limity subskrypcji?**

- **Przez Claude Code + MCP:** tak.
- **Przez serwerowe Agent SDK:** nie.
  - Anthropic zakazuje twórcom aplikacji kierowania żądań przez poświadczenia planu Free/Pro/Max w imieniu użytkowników oraz przechowywania lub pośredniczenia tokenów claude.ai.
  - Panel ma wielu administratorów.
- **Zgodna alternatywa:** od 7.10.2026 plan **Max 5x/20x** (oraz Team) daje miesięcznie **$100/$200 kredytów API**. Obejmują one wprost Agent SDK i trafiają do organizacji Console podpiętej do planu.
  - Klucz z tej organizacji = Agent SDK na kredytach z planu.
  - Gdy kredyty się skończą, a nie ma kredytów kupionych ani auto-reload, **żądania się zatrzymują** i nic nie trafia na kartę.
  - Plan Pro nie dostaje tych kredytów.

**Lokalnie:** ustaw `AGENT_SDK_ANTHROPIC_API_KEY` w `backend/.env`. SDK ma binarkę dla danej platformy w zależności opcjonalnej npm.

**Na VPS:** zmienna w `/opt/bekapaka-stats/.env` (część G). Bez niej silnik SDK ma status „Brak konfiguracji”, a API działa jak dotąd.

**Czy występują opłaty API:**

- **Silnik SDK:** tak. To wywołania Claude API rozliczane z kredytów organizacji Console (dołączonych do Maxa albo kupionych). Studio wlicza je też do swojego miesięcznego budżetu.
- **Silnik API:** bez zmian, płatne API Gemini/Claude/OpenAI.
- **MCP:** zużywa limity Twojej subskrypcji w Claude Code. Serwer nie ponosi kosztu i loguje `costKind: none`.

**Jak zweryfikować rzeczywisty mechanizm rozliczania:**

1. „Testuj połączenie” pokazuje `Uwierzytelnienie: ANTHROPIC_API_KEY`, model i szacunkowy koszt.
2. Console → Settings → Billing → „Promotional credits” pokazuje saldo i datę wygaśnięcia kredytów z planu.
3. Console → Cost pokazuje faktyczne zużycie.
4. Zalecenie: osobny **workspace** w Console z limitem wydatków, bez auto-reload.

## F. Testy

| Zestaw | Wynik |
|---|---|
| Backend `npx vitest run` | 394 zaliczone, 30 pominiętych: testy integracyjne bez bazy |
| Backend, testy integracyjne na izolowanym Postgres (`bekapaka_studio_ci`) | 30/30 zaliczonych. Nowy test: agent przez MCP wykonuje `studio.copy` (prepare → odrzucenie niepoprawnego wyniku → zapis szkicu agenta) i nie ma dostępu do operacji panelu bez `panel-ai`. |
| Nowe testy jednostkowe | `aiEngine.agentSdk` (blokady opcji, środowisko bez OAuth, `apiKeySource`, mapowanie błędów, timeout, limiter, sprzątanie), `aiEngine.settings` (ustawienie, audyt, status, test, sanityzacja), `aiTextEngine` (API bez zmian, SDK, brak cichego fallbacku), `studio.engine` (SDK w workerze, rezerwacja, stare joby na API, obraz nigdy przez SDK), `studio.mcp-tasks`, `apiAuthorization` (403 dla nie-admina) |
| `prisma validate` + `migrate deploy` + `migrate diff --exit-code` | OK, bez różnic |
| Panel: typecheck, vitest (60, w tym nowy `AiEngineSettings.test.tsx`), build | OK |
| Studio: typecheck, lint, prettier, vitest, build | OK |
| `npm audit --omit=dev --audit-level=critical` | OK. 4 podatności „high” istniały wcześniej (`prisma`: `deepmerge-ts`, `mysql2`), nie pochodzą z SDK. |

**E2E w przeglądarce** (lokalnie: baza `bekapaka_studio_e2e`, API na :4011, panel na :5185, Studio na :5184):

1. Panel → Administracja → „Dostawca AI”: status „Skonfigurowany — wykonaj test”, a nie fałszywe „Gotowy”.
2. Przełączenie na SDK zostało zapisane i trafiło do audytu (`from: panel`).
3. „Testuj połączenie” uruchomił prawdziwy proces Claude Code. Celowo nieprawidłowy klucz dał prawdziwe 401 od Anthropic, status „Wymagane uwierzytelnienie”, wpis w logu `rejected/auth_required` i 0 kosztu.
4. Generowanie briefingu w trybie SDK zwróciło czytelny błąd 503. W logu `requested = actual = SDK`, **nie było fallbacku na API**.
5. Po restarcie backendu Studio pokazało ten sam stan, łącznie z „Zmienione … panel”.
6. Tło AI w trybie SDK poszło ścieżką Gemini: 503 „Brak klucza API Google Gemini”, a nie SDK.
7. Przełączenie z powrotem na API ze Studio zostało zapisane i trafiło do audytu (`from: studio`).

Pomiar: szczyt RSS procesu Claude Code przy krótkim wywołaniu wyniósł około **200 MiB** (macOS arm64).

## G. Deployment

Kolejność (zgodnie z `docs/vps-runbook.md` i `docs/vps-optimization.md`):

1. **Przed wdrożeniem:**
   - kopia bazy, bo jest migracja, choć tylko dodaje tabele;
   - `df -h` (każdy obraz backendu i workera rośnie o około **250 MB**, bo zawiera binarkę Claude Code), sprzątanie starych obrazów punktowo;
   - wolny RAM ≥ 1024 MiB.
2. **Twoje kroki w Anthropic**, jeśli chcesz używać SDK:
   - claude.ai → Settings → Billing → API credits → podepnij organizację Console;
   - w Console utwórz osobny workspace z limitem wydatków i wygeneruj w nim klucz API.
3. **VPS, `/opt/bekapaka-stats/.env`** (wartości ustawiasz Ty, nie trafiają do repo):
   ```
   AGENT_SDK_ANTHROPIC_API_KEY=<klucz z Console>
   AGENT_SDK_PANEL_MAX_USD=0.5   # opcjonalnie
   ```
   Nie ustawiaj na serwerze `CLAUDE_CODE_OAUTH_TOKEN`: silnik go odrzuci.
4. **Merge do `main`:**
   - `deploy.yml` buduje i wdraża backend (migracja przez entrypoint) oraz panel (nowy nginx z limitem 180 s dla tras AI);
   - `studio.yml` buduje obrazy `studio` i `studio-worker` i sprawdza w obrazie import SDK oraz `claude --version`.
5. **Studio:**
   - `scripts/studio/deploy.sh <SHA>`;
   - ustaw `BKPK_STUDIO_IMAGE_TAG=<SHA>` w `.env`;
   - worker dostaje `mem_limit: 1536m` i zmienną `AGENT_SDK_ANTHROPIC_API_KEY`.
6. **Po wdrożeniu:**
   - Administracja → Dostawca AI → „Testuj połączenie” (najpierw w trybie API, potem SDK);
   - obserwuj `/var/log/bekapaka-ram.log` przy pierwszych generacjach.

**MCP dla Claude Code:**

1. Studio → Ustawienia → Agent (MCP) → utwórz token. Opcja „Także analizy panelu (panel-ai)” jest dla Twojego własnego agenta.
2. Skopiuj konfigurację MCP do Claude Code.
3. Workflow: `list_ai_tasks` → `prepare_ai_task` → napisz wynik → `submit_ai_task_result`.

## H. Regresje

- **Tryb API (domyślny)** wysyła te same wywołania Gemini z tymi samymi parametrami, potwierdzone testem `aiTextEngine` na argumentach. Studio na API ma niezmienione `generateJson` i budżet.
- **Prompty, wersje promptów, hashe cache, walidatory i miejsca zapisu** są bez zmian. W kolumnach `*Model` zapisuje się model, który faktycznie odpowiedział (w trybie API to nadal `GEMINI_MODEL`).
- **Pipeline obrazów** (Gemini, parametry, zapis jako `StudioAsset`, provenance) jest bez zmian. SDK jest dla obrazów zablokowane w `resolveModel` i dodatkowo w workerze.
- **Publikacja** (Strapi, pakiety IG/FB) nie była ruszana. Agent MCP nadal nie zatwierdza i nie publikuje.
- **Istniejące testy** backendu, panelu i Studio przechodzą. Zaktualizowano listę narzędzi MCP w `studio.ai-agent.test.js`.

## I. Nierozwiązane problemy i ograniczenia

1. **Nie wykonano generacji z ważnym kluczem SDK**, bo nie było autoryzowanego klucza. Uruchomienie procesu, uwierzytelnienie i ścieżka błędów są potwierdzone na żywo, ale udana odpowiedź jest pokryta tylko testami z atrapą `query()`. Integracja jest gotowa, lecz **nie została potwierdzona na prawdziwym modelu**. Do sprawdzenia po ustawieniu klucza:
   - czy SDK wymusza `minItems` w `outputFormat`; walidatory aplikacji i tak to sprawdzają;
   - rzeczywisty czas i RSS przy dłuższych generacjach na VPS.
2. **`nginx -t`** dla nowej lokalizacji w `frontend/nginx.prod.conf` nie był uruchomiony lokalnie (brak dockera i nginx). Pierwsza weryfikacja nastąpi przy deployu; health-check wycofa zmianę w razie błędu.
3. **Ścieżka SDK w workerze Studio** jest przetestowana jednostkowo. W E2E worker nie był uruchomiony.
4. **Fallback na API** działa tylko w panelu i tylko gdy SDK niczego nie wygenerowało. W Studio rezerwacja budżetu dotyczy konkretnego modelu, więc fallback byłby błędny.
5. **Współbieżność SDK** to 1 wywołanie na proces (backend i worker) plus kolejka 2. Przy wielu jednoczesnych generacjach w panelu kolejne dostają „zajęte”.
6. **Opis/alt grafiki (`ai-text`)** nie ma zadania MCP, bo wynik żyje tylko w jobie i nie ma trwałego miejsca zapisu.
7. **Rozmiar obrazów Docker** rośnie o około 250 MB na obraz. Przy ograniczonym dysku VPS trzeba pilnować sprzątania (`docs/vps-optimization.md`).
8. **Zmiana silnika jest globalna.** Admin panelu zmienia też silnik Studio i odwrotnie. Zmiana jest widoczna w obu ekranach („Zmienione … przez … w …”) i w `AiSettingAudit`.
9. **Kampanie, scenariusze, storyboardy i Remotion** to osobny etap.
