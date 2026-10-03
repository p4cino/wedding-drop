# Design

## Context

Motywacja: patrz `proposal.md` – Why. Wymagania: `specs/owner-session/spec.md`, `specs/credential-transport/spec.md`.

Stan obecny (zaobserwowany w kodzie):

- `apps/web/src/lib/auth.ts` – `generateOwnerToken(slug)` / `verifyOwnerToken(token, slug)` (HMAC-SHA256, `timingSafeEqual`, 7 dni). `authenticateOwner(req, slug, body)` pobiera token kolejno z: `x-owner-token`, `Authorization: Bearer`, **`?token=`**, `body.token`. Używany przez wszystkie endpointy `/api/owner/[slug]/*`.
- `api/owner/[slug]/auth` (POST) – weryfikuje hasło bcryptem, zwraca `ownerToken` + dane galerii, statystyki, `cardSettings`, `isGDriveConfigured`.
- `api/gallery/[slug]/zip` – rozpoznaje właściciela **tylko** po `x-owner-password` / `?password=`; tokenu nie obsługuje, przez co link panelu `?token=` jest traktowany jak pobranie gościa.
- `api/gallery/[slug]/media` – `includeHidden=true` akceptuje `x-owner-token|?ownerToken`, `x-owner-password|?password`, `x-admin-token|?adminToken`.
- `api/auth/google` (GET) – `?slug&token|password`, przekierowanie 302 na Google; callback wraca na `${APP_DOMAIN}/owner/{slug}?gdrive=connected`.
- `api/admin/galleries` i `api/admin/galleries/[id]` – token admina także z `?token=`.
- `[locale]/owner/[slug]/page.tsx` – zapisuje `owner_pwd_{slug}` i `owner_token_{slug}` w `sessionStorage`, przy montowaniu loguje się ponownie zapisanym hasłem.
- Ruch produkcyjny przechodzi przez Caddy (TLS); E2E Playwright działa na `https://localhost`.

## Goals / Non-Goals

**Goals:**
- Jeden helper ciasteczka sesji współdzielony przez wszystkie endpointy (bez kopiowania logiki w trasach).
- Zachowanie istniejącego formatu tokenu HMAC – ciasteczko przenosi ten sam token, więc nie potrzeba magazynu sesji w DB.
- Minimalna zmiana kontraktu dla mutujących endpointów (nadal nagłówek `x-owner-token`).

**Non-Goals:**
- Unieważnianie tokenów po stronie serwera (lista odwołań / rotacja sekretu) – token pozostaje bezstanowy, ważny 7 dni.
- Zmiana mechanizmu sesji administratora (token admina pozostaje w pamięci strony `/admin`; zmienia się tylko odrzucanie `?token=`/`?adminToken=`).
- Usunięcie domyślnego sekretu `wedding-admin-secret-fallback-key` w `getAdminSecret()` – osobna zmiana.
- Zmiany w schemacie DB, pipeline mediów, SSE.

## Decisions

### D1. Ciasteczko przenosi istniejący token właściciela
Wartość ciasteczka = wynik `generateOwnerToken(slug)`; weryfikacja przez `verifyOwnerToken`. Nazwa: `wd_owner_{slug}` (slug spełnia `^[a-z0-9_-]+$`, więc jest poprawną nazwą ciasteczka i daje izolację per galeria). Atrybuty: `HttpOnly`, `SameSite=Strict`, `Path=/api`, `Max-Age=604800`, `Secure` gdy `NODE_ENV === "production"`.
- *Alternatywa*: losowy identyfikator sesji w tabeli DB – odrzucona: wymaga migracji i zapytania przy każdym żądaniu (koszt na N100) bez zysku w obecnym modelu zagrożeń.
- *Alternatywa*: jedno ciasteczko z listą galerii – odrzucona: komplikuje parsowanie i izolację.

### D2. Ciasteczko honorowane tylko dla GET/HEAD
`authenticateOwner` przyjmie ciasteczko wyłącznie, gdy `req.method` to `GET` lub `HEAD`; dla mutacji wymagany nagłówek/body. To zamyka CSRF niezależnie od `SameSite` (obrona warstwowa, np. starsze przeglądarki, subdomeny).
- *Alternatywa*: honorować ciasteczko wszędzie i polegać na `SameSite=Strict` – odrzucona: jedna linia obrony dla operacji destrukcyjnych (usuwanie plików, odłączanie Drive).
- Uwaga: `GET /api/owner/{slug}/gdrive` (polling statusu) też zadziała z samym ciasteczkiem – akceptowalne, to odczyt.

### D3. Nowa trasa `api/owner/[slug]/session`
- `GET`: weryfikuje ciasteczko (D1/D2), zwraca ten sam kształt co `POST /auth` + świeży `ownerToken` i odnawia ciasteczko (przesuwane okno 7 dni).
- `DELETE`: ustawia `wd_owner_{slug}` z `Max-Age=0`. Nie wymaga uwierzytelnienia (wylogowanie jest idempotentne i nieszkodliwe).
- Budowanie payloadu (galeria + stats + gdrive + card) zostanie wydzielone z `auth/route.ts` do wspólnej funkcji w `apps/web/src/lib/` (np. `owner-session.ts`), by obie trasy nie duplikowały zapytań.

### D4. Ekstrakcja poświadczeń w jednym miejscu
W `lib/auth.ts` powstaje helper odczytu tokenu właściciela z dozwolonych kanałów (nagłówki → body → ciasteczko dla GET/HEAD) – używany przez `authenticateOwner`, `zip`, `media`. Wszystkie odczyty `searchParams.get("token"|"password"|"ownerToken"|"adminToken")` są usuwane, również w trasach admina. Parametr `includeHidden` i `pin` pozostają w query (nie są poświadczeniami właściciela; PIN gościa – poza zakresem).

### D5. ZIP rozpoznaje właściciela tokenem
`zip/route.ts`: `isOwner = verifyOwnerToken(tokenZNagłówkaLubCiasteczka, slug) || bcrypt(x-owner-password)`. Strumieniowanie przez `archiver` bez zmian (inwariant N100). Link w panelu: `href={`/api/gallery/${slug}/zip`}` – przeglądarka dołączy ciasteczko przy nawigacji same-site.

### D6. `POST /api/auth/google` zwraca `authUrl`
Body `{ slug }`, autoryzacja: `x-owner-token` (lub `Authorization: Bearer`) albo `x-owner-password`. Odpowiedź `200 { authUrl }`. Eksport `GET` znika – Next.js zwróci `405` automatycznie dla nieeksportowanej metody. Klient: `const { authUrl } = await res.json(); window.location.assign(authUrl)`. Callback bez zmian.
- *Alternatywa*: zostawić GET i autoryzować ciasteczkiem – odrzucona: GET inicjujący OAuth bez tokenu jest wrażliwy na wymuszone nawigacje; POST + JSON jest jawny i testowalny.

### D7. Frontend panelu
- Usunięcie wszystkich zapisów/odczytów `sessionStorage`; jednorazowe `removeItem` starych kluczy `owner_pwd_{slug}`/`owner_token_{slug}` przy montowaniu (migracja).
- Montowanie: `GET /api/owner/{slug}/session` → przy 200 ustawienie stanu jak po logowaniu (wspólna funkcja `applySession(data)` używana też przez `doLogin`), przy 401 formularz hasła.
- Dodanie przycisku „Wyloguj” (`DELETE /session`, reset stanu) – nowe klucze i18n w `messages/{pl,en,de}.json`.
- Brak hasła w stanie po zalogowaniu (`setPassword("")`).

## Risks / Trade-offs

- [Powrót z Google OAuth to nawigacja zainicjowana cross-site – ciasteczko `SameSite=Strict` nie jest wysyłane na samą nawigację] → ciasteczko ma `Path=/api`, więc nawigacja na `/owner/{slug}` go nie potrzebuje; `fetch` do `/api/owner/{slug}/session` wykonywany z załadowanej strony jest same-site i ciasteczko zostanie dołączone. Weryfikacja scenariuszem E2E (symulacja wejścia z `?gdrive=connected`).
- [Mobile Safari / ITP i ciasteczka first-party] → ciasteczko jest first-party i ustawiane odpowiedzią na `fetch` same-origin; pokryte projektem Playwright „Mobile Safari”.
- [`Secure` w dev po HTTP (`next dev` na `http://localhost:3000`)] → `Secure` tylko w produkcji; w dev ciasteczko działa po HTTP.
- [Zmiana łamiąca dla zewnętrznych skryptów używających `?password=`] → opis migracji w `DOCUMENTATION.md` (nagłówek `x-owner-password` / `x-owner-token`), wpis w README.
- [Token w ciasteczku nadal bezstanowy – wylogowanie nie unieważnia skopiowanego tokenu] → akceptowane (Non-Goal); ryzyko ograniczone przez `HttpOnly` i brak tokenu w URL/storage.
- [Ciasteczko dla GET pozwala na odczyt (ZIP z plikami ukrytymi) przy wymuszonej nawigacji same-site] → `SameSite=Strict` blokuje wysłanie przy nawigacji z obcej domeny; same-site atakujący wymagałby XSS na tej samej domenie.

## Migration Plan

1. Wdrożenie serwera i klienta w jednym obrazie Docker (monorepo, jeden build) – brak okna niekompatybilności między frontendem a API.
2. Użytkownicy zalogowani starą wersją: przy pierwszym wejściu stare klucze `sessionStorage` są usuwane, panel pokaże formularz hasła (jednorazowe ponowne logowanie).
3. Rollback: przywrócenie poprzedniego obrazu; ciasteczka `wd_owner_*` są ignorowane przez starą wersję i wygasną samoczynnie.
