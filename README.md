# WeddingDrop 💍 - Self-Hosted Fotowrzutka Ślubna

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24%20Alpine-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](docker-compose.yml)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)](turbo.json)
[![pnpm](https://img.shields.io/badge/pnpm-12.4.1-F69220?style=flat-square&logo=pnpm&logoColor=white)](pnpm-lock.yaml)
[![Biome](https://img.shields.io/badge/Biome-v2.5.13-60A5FA?style=flat-square&logo=biome&logoColor=white)](biome.json)
[![Vitest](https://img.shields.io/badge/Vitest-464%20passing-6E9F18?style=flat-square&logo=vitest&logoColor=white)](package.json)
[![Playwright](https://img.shields.io/badge/Playwright-114%20E2E%20passing-2EAD33?style=flat-square&logo=playwright&logoColor=white)](package.json)
[![UI](https://img.shields.io/badge/UI-Park%20UI%20%2B%20Panda%20CSS-F59E0B?style=flat-square&logo=react&logoColor=white)](https://park-ui.com)
[![Hardware](https://img.shields.io/badge/Hardware-Intel%20N100%20Optimized-0071C5?style=flat-square&logo=intel&logoColor=white)](#-optymalizacje-pod-procesor-intel-n100)

Kompletna, samoobsługowa aplikacja internetowa do zbierania zdjęć i filmów z wesel, zaprojektowana z myślą o serwerach domowych i mini-PC (np. z procesorem **Intel N100**). Działa w 100% w środowisku **Docker**, bez żadnych płatnych planów i bez limitów.

---

## 📸 Zrzuty Ekranu

### 📱 Doświadczenie Gościa Weselnego (100% Mobile First & PWA)
Bez instalacji aplikacji ze sklepów i bez rejestracji – gość skanuje kod QR ze stolika, natychmiast przegląda zdjęcia na żywo, rywalizuje w rankingu TOP 3, wysyła ciepłe słowa w Księdze Życzeń oraz robi zdjęcia w wirtualnym Photobooth:

<p align="center">
  <img src="docs/screenshots/01-guest-gallery-mobile.png" width="270" alt="Galeria gościa weselnego z rankingiem TOP 3 i odznaką fotografa" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/02-upload-drawer-mobile.png" width="270" alt="Drawer wznawialnego uploadu TUS z opcją aparatu Photobooth" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/03-guest-wishes-mobile.png" width="270" alt="Księga Życzeń gości na żywo z dedykowanymi wpisami" />
</p>

### 📺 Tryb TV na Sali Weselnej (Pokaz Slajdów na Żywo)
Dedykowany, publiczny tryb tylko-do-odczytu na telewizor lub rzutnik w sali weselnej – automatyczna rotacja nowych materiałów w pełnej rozdzielczości z dynamicznym kodem QR w rogu dla dołączających gości:

<p align="center">
  <img src="docs/screenshots/04-tv-slideshow.png" width="850" alt="Tryb TV z pokazem slajdów na żywo i kodem QR" />
</p>

### 💌 Generator Winietek na Stoliki Weselne (Format A6 / 300 DPI)
Wbudowany wektorowy generator wizytówek na stoły z dynamicznym kodem QR, wyborem eleganckich motywów kolorystycznych i opcją natychmiastowego druku:

<p align="center">
  <img src="docs/screenshots/05-table-card-creator.png" width="850" alt="Generator winietek na stoliki weselne A6" />
</p>

### 💍 Panel Pary Młodej (Moderacja Treści, Import Fotografa, Księga Życzeń i Google Drive)
Dedykowany panel właściciela galerii chroniony utwardzoną sesją – statystyki w czasie rzeczywistym, moderacja widoczności zdjęć i życzeń jednym kliknięciem, masowy import materiałów fotografa z odznaką, pobieranie strumieniowego archiwum ZIP oraz automatyczny backup do chmury Google Drive:

<p align="center">
  <img src="docs/screenshots/06-owner-dashboard.png" width="850" alt="Panel Pary Młodej z moderacją na żywo, importem fotografa i Google Drive" />
</p>

### ⚙️ Panel Główny Administratora Systemu
Szybki podgląd wszystkich ślubów, zarządzanie przestrzenią dyskową oraz błyskawiczne tworzenie nowych wesel:

<p align="center">
  <img src="docs/screenshots/07-admin-panel.png" width="850" alt="Panel Administratora Systemu WeddingDrop" />
</p>

---

## 🌟 Główne Funkcje

1. **Dla Gości (100% Mobile First & PWA)**:
   - Dostęp bezpośrednio po zeskanowaniu kodu QR ze stolika weselnego.
   - Brak logowania, rejestracji i instalowania aplikacji ze sklepów.
   - **Progressive Web App (PWA)**: Możliwość instalacji na ekranie głównym (dodaj do ekranu głównego) oraz strona awaryjna (Offline Fallback) informująca o braku sieci.
   - Wrzucanie zdjęć i filmów prosto z rolki aparatu.
   - **Natywny aparat**: opcja "Zrób zdjęcie" w drawerze uploadu płynnie integruje się z systemową aplikacją aparatu smartfona (`capture="environment"`). Dzięki wywołaniu natywnego interfejsu systemu iOS/Android, goście zachowują najwyższą jakość obrazu wspieraną sprzętowo (Deep Fusion, Smart HDR, pełna rozdzielczość matrycy, stabilizacja optyczna, tryb nocny), której często brakuje w zwykłym podglądzie z przeglądarki (`getUserMedia`). Wykonane zdjęcie od razu trafia do dokładnie tego samego, wznawialnego potoku TUS co pliki wybrane ręcznie.
   - Opcjonalny podpis ("np. Wujek Janusz i Ciocia Halinka").
   - **Wznawialny upload (TUS Protocol 1.0.0)**: Jeśli na sali weselnej na chwilę zerwie się zasięg Wi-Fi lub LTE, upload wznowi się automatycznie bez utraty przesłanych danych.
   - **Galeria na żywo (SSE)**: Nowe zdjęcia pojawiają się w telefonach gości w czasie rzeczywistym bez przeładowywania widoku.
   - **Pełnoekranowa przeglądarka (Lightbox)**: Natywna obsługa gestów dotykowych **Swipe** (przesuwanie palcem lewo/prawo na smartfonach) oraz klawiatury na desktopie.
   - **Odporność na napływ zdjęć**: Przeglądanie zdjęcia w powiększeniu nie ulega zresetowaniu, gdy w tle pojawiają się nowe zdjęcia od innych gości.
   - **Życzenia audio/wideo**: gość może nagrać krótką wiadomość (do 60 s) prosto w szufladzie uploadu — z podglądem kamery oraz odsłuchem przed wysłaniem (podgląd/odrzucenie/ponowne nagranie). Na urządzeniach bez `MediaRecorder` (np. starsze iOS) działa fallback do natywnego dyktafonu/kamery. Nagranie przechodzi tym samym wznawialnym protokołem TUS i tą samą kolejką (`p-queue` concurrency: 2) co zdjęcia, a w galerii jest oznaczone ikoną i odtwarzane w Lightboxie. W pobranym ZIP-ie trafia do katalogów `audio/` i `video/`. Interfejs nagrywania jest w pełni przetłumaczony (PL/EN/DE).
   - **Księga Życzeń**: Oddzielna zakładka "Życzenia" obok galerii zdjęć — gość może zostawić tekstowe życzenia dla Pary Młodej (opcjonalne imię/nazwisko + treść) bez logowania i bez konieczności wgrywania żadnego pliku. Nowe wpisy pojawiają się na żywo (SSE) u wszystkich gości przeglądających galerię w tym samym czasie.
   - **Ranking najaktywniejszych gości (TOP 3)**: Niewielki widget nad galerią pokazuje trzech gości z największą liczbą wgranych zdjęć/filmów wraz z odznakami miejsc (🥇🥈🥉) — prosty "społeczny dowód słuszności", który zachęca do dalszego dodawania zdjęć. Ranking liczy się w całości po stronie przeglądarki (bez dodatkowego zapytania do serwera) na podstawie listy zdjęć, którą galeria już wczytała, więc aktualizuje się na żywo razem z resztą galerii (SSE). Uwzględnia wyłącznie widoczne materiały (ukryte/skasowane nigdy nie liczą się na korzyść gościa), a drobne różnice w zapisie podpisu (wielkość liter, spacje) grupują się w jedną pozycję. Widget jest niewidoczny, dopóki nikt jeszcze nic nie wgrał.

2. **Dla Pary Młodej (Właściciela Galerii)**:
   - Panel zarządzania dostępny pod `/owner/[slug]`.
   - **Utwardzona sesja właściciela**: Bezpieczne ciasteczko sesji `HttpOnly; SameSite=Strict; Path=/api` (brak haseł i tokenów w `sessionStorage` oraz w URL-ach). Automatyczne wznawianie sesji po odświeżeniu i przycisk wylogowania.
   - **Personalizacja galerii (Branding)**: Własne logo (zastępujące tekst na górze ekranu) oraz niestandardowe tło (widoczne za zdjęciami pod przyciemniającą nakładką), konfiguracja wprost z panelu administracyjnego.
   - Podgląd liczby zdjęć, filmów oraz sumarycznego zajętego miejsca na dysku.
   - **Import materiałów fotografa/kamerzysty**: masowy, wznawialny import profesjonalnych zdjęć i filmów (ten sam protokół TUS co upload gości) do tej samej galerii i chronologii — dostępny wyłącznie po zalogowaniu właściciela. Zaimportowane pliki są oznaczone w siatce galerii odróżniającą odznaką "Fotograf" i przechodzą przez dokładnie tę samą, ograniczoną kolejkę przetwarzania (`p-queue` concurrency: 2) co uploady gości — bez priorytetu ani osobnego limitu. Jeśli administrator ustawił limit pojemności galerii (`maxStorageBytes`), import fotografa go respektuje i odrzuci pojedyncze pliki przekraczające limit (nie wpływając na pozostałe pliki tej samej paczki importu).
   - **Pobieranie całej galerii jako jeden plik ZIP**: Generowanie strumieniowe w locie (`archiver`) bez obciążania pamięci RAM serwera (z uwzględnieniem zdjęć ukrytych dla uwierzytelnionej Pary Młodej). Jeśli galeria zawiera życzenia, ZIP zawiera dodatkowo plik tekstowy `zyczenia.txt` z treścią i autorami wszystkich widocznych wpisów.
   - **Moderacja na żywo**: Szybkie ukrywanie zdjęć niepożądanych jednym kliknięciem oraz usuwanie — zmiana statusu natychmiast synchronizuje się ze wszystkimi telefonami na sali weselnej przez SSE (`media-updated`).
   - **Zaawansowane uprawnienia (Toggles)**: Właściciel galerii z poziomu swojego panelu może w dowolnej chwili:
     - wyłączyć możliwość wgrywania nowych zdjęć (zamrożenie galerii, np. po poprawinach),
     - wyłączyć możliwość podglądu galerii przez gości (ukrycie zdjęć),
     - nałożyć opcjonalne **hasło dostępu** dla gości w celu dodatkowej ochrony prywatności,
     - włączyć **Kolejkę Akceptacji** (nowe uploady od gości mają status `pending` i oczekują na zatwierdzenie przez właściciela przed ich upublicznieniem).
   - **Moderacja Księgi Życzeń**: Ten sam mechanizm ukrywania/trwałego usuwania dostępny również dla wpisów w księdze życzeń (SSE `wish-updated`), z filtrowaniem po statusie (wszystkie/widoczne/ukryte).
   - Bezpośredni dostęp do generatora winietki na stolik oraz do trybu TV.

3. **Tryb TV / Pokaz Slajdów na Sali (`/g/[slug]/tv`)**:
   - Publiczna, tylko-do-odczytu, pełnoekranowa trasa myślana pod telewizor lub rzutnik w sali weselnej — bez logowania, bez FAB-a uploadu i bez klikalnego lightboxa.
   - Reużywa dokładnie te same, niezmodyfikowane publiczne endpointy co galeria gościa (`/api/gallery/[slug]/media` i `/api/gallery/[slug]/live`), więc dziedziczy ich filtrowanie `status: "ready"` — zdjęcia `hidden`/`deleted` nigdy się tam nie pojawiają, nawet jeśli ktoś doda do adresu URL parametry sugerujące dostęp właściciela.
   - Automatyczna rotacja materiałów w pełnej rozdzielczości; nowo wgrane zdjęcie/wideo wskakuje na wierzch rotacji zaraz po zdarzeniu SSE `new-media`, a ukryte przez Parę Młodą — natychmiast znika (`media-updated`).
   - Materiały wideo pokazywane jako statyczna miniatura (bez autoodtwarzania dźwięku).
   - Stały kod QR w rogu ekranu (generowany po stronie klienta biblioteką `qrcode`), by goście patrzący na telewizor mogli dołączyć.
   - Link "Otwórz tryb TV" dostępny bezpośrednio w panelu Pary Młodej (`/owner/[slug]`).

4. **Generator Karteczek na Stoły (Format A6 / 300 DPI)**:
   - Wektorowy generator dokumentu **PDF do druku** ze złotą ramką, imionami, datą, dynamicznym kodem QR i instrukcją.
   - Wizualny edytor z wyborem motywu barwnego (*Złoto & Granat*, *Butelkowa Zieleń*, *Pudrowy Róż*, *Klasyczna Czerń* lub własne kolory HEX).
   - Generowanie PDF na żywo z aktualnymi parametrami z formularza.
   - Opcja bezpośredniego druku (Ctrl+P) zoptymalizowana pod format A6.

5. **Dla Administratora (Panel Główny)**:
   - Dostęp pod `/admin`.
   - Bezpieczna autoryzacja kryptograficznym tokenem **HMAC-SHA256** z ochroną przed atakami czasowymi (Timing Attacks).
   - Przegląd wszystkich ślubów, liczby plików i sumarycznego zużycia dysku w oparciu o szybkie indeksy bazodanowe.
   - Błyskawiczne tworzenie nowego ślubu (formularz: imiona, data, e-mail, hasło, sanityzacja sluga).
   - Całkowite usuwanie galerii wraz ze wszystkimi plikami fizycznymi z dysku.

---

## 🚀 Szybki Start (Docker Desktop / Docker Compose)

Aplikacja jest gotowa do uruchomienia jednym poleceniem:

```bash
# 1. Przejdź do katalogu projektu
cd wedding-drop

# 2. Uruchom kontenery w tle
docker compose up -d --build
```

Docker pobierze obrazy, zbuduje aplikację i uruchomi 3 kontenery:
- `wedding_postgres` – Baza danych PostgreSQL 16 Alpine ze zoptymalizowanymi indeksami złożonymi
- `wedding_web` – Monorepo Turborepo (Node.js 24 Alpine + Next.js 16 + serwer TUS + Sharp/FFmpeg z limitem współbieżności i watchdogiem)
- `wedding_caddy` – Reverse proxy z automatycznym HTTPS i blokadą noindex

### Architektura Monorepo (pnpm + Turborepo + Biome):
- `apps/web`: Aplikacja Next.js 16, App Router, SSR, serwer HTTP (`server.ts`), komponenty Park UI oparte na maszynach stanów Ark UI i kompilowane w czasie budowy przez silnik Panda CSS (zero-runtime CSS-in-JS).
- `packages/db`: Drizzle ORM, schemat PostgreSQL, migracje i connection pool singleton.
- `packages/media`: Potok przetwarzania mediów (Sharp, FFmpeg, TUS, SSE, PDF A6, QR, ZIP, Google Drive).

### System Wzornictwa (Park UI & Panda CSS):
Warstwa wizualna aplikacji opiera się na [Park UI](https://park-ui.com) oraz silniku **Panda CSS**:
- **Zero-runtime CSS**: Style są w całości ekstrahowane statycznie w trakcie kompilacji (`panda codegen`), co eliminuje narzut obliczeniowy w runtime i chroni procesor Intel N100.
- **Dostępność WAI-ARIA z pudełka**: Modale, szuflady (drawer), toasty i elementy formularzy oparte są na maszynach stanów Ark UI z wbudowaną obsługą pułapki fokusu (`useFocusTrap`) i zamykania klawiszem Escape.
- **Spójna paleta ślubna**: Silnie typowane tokeny barw (`wedding.champagne`, `wedding.gold`, `wedding.rose`, `wedding.slate`, `wedding.emerald`) oraz luksusowa typografia serif (*Playfair Display*, *Cinzel*).

### Adresy URL w przeglądarce:
- **Strona główna**: [http://localhost](http://localhost)
- **Panel Administratora**: [http://localhost/admin](http://localhost/admin)
  - Domyślny login: `admin`
  - Domyślne hasło: `admin123` (możesz zmienić w pliku `.env`)

---

## 🐳 Instalacja z Gotowego Obrazu (ZimaOS / inny NAS z CasaOS)

Jeśli nie chcesz budować obrazu lokalnie (np. na NAS-ie ZimaOS/CasaOS), aplikacja `web` jest automatycznie budowana i publikowana przez GitHub Actions do GitHub Container Registry pod adresem `ghcr.io/p4cino/wedding-drop` (obraz `linux/amd64`, zgodny z Intel N100/ZimaBoard). Serwis `postgres` i `caddy` korzystają ze standardowych publicznych obrazów, więc do uruchomienia potrzebny jest tylko ten jeden gotowy obraz.

### Instalacja na ZimaOS:
1. W panelu ZimaOS przejdź do **App Center** → **"Install a Customized App"** → **Import** → zakładka **Docker Compose**.
2. Wklej zawartość pliku [`docker-compose.prod.yml`](docker-compose.prod.yml) z tego repozytorium.
3. **Przed kliknięciem Submit** podmień w wklejonym tekście:
   - `ADMIN_PASSWORD` (hasło do panelu `/admin`, wystawionego publicznie) — **wymagane**.
   - Porty serwisu `caddy` (domyślnie `8080`/`8443`) — sprawdź w formularzu ZimaOS, czy nie są już zajęte (bardzo częste na NAS-ach z innymi appkami — Nginx Proxy Manager, dashboard ZimaOS itp. też lubią te numery); jeśli tak, zmień na jakikolwiek wolny port.
   - `APP_DOMAIN` w serwisie `web`, jeśli chcesz, by generowane linki/kody QR wskazywały realny adres NAS-a, a nie `localhost`.
4. **Ustaw Primary Service na `caddy`**, nie `web` — `web` nie ma żadnego portu wystawionego na zewnątrz i jest dostępny tylko przez `caddy` (patrz architektura w [DOCUMENTATION.md](DOCUMENTATION.md#11-publikacja-obrazu-docker-ghcr-i-instalacja-na-zimaoscasaos)).
5. Kliknij **Submit**, a następnie **Install**.

Ten plik compose nie buduje niczego lokalnie i nie odwołuje się do żadnych plików z dysku — Caddy ściąga swój `Caddyfile` zdalnie z tego repozytorium przy starcie, więc cały stack da się wkleić jako czysty tekst YAML.

> **Coś nie działa po instalacji?** Zobacz sekcję rozwiązywania problemów w [DOCUMENTATION.md](DOCUMENTATION.md#11-publikacja-obrazu-docker-ghcr-i-instalacja-na-zimaoscasaos) — konkretne komendy do zdiagnozowania konfliktu portów, crashującego Caddy albo białej strony.

### Uruchomienie tego samego pliku przez SSH / CLI (dowolny host z Dockerem):
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Aktualizacje:
- Tag `:latest` śledzi najnowszy commit na `main`.
- Wersje oznaczone tagiem (np. `v1.0.0`) są stabilne i nie zmieniają się — podmień tag w `docker-compose.prod.yml` (`image: ghcr.io/p4cino/wedding-drop:vX.Y.Z`), jeśli wolisz przypiętą wersję.

---

## ⚙️ Konfiguracja Domeny i Automatycznego Certyfikatu SSL (HTTPS)

Aby aplikacja działała na Twojej publicznej domenie z darmowym certyfikatem Let's Encrypt:

1. W pliku `.env` ustaw swoją domenę:
   ```env
   APP_DOMAIN=slub.twojadomena.pl
   ```
2. Upewnij się, że porty 80 i 443 na Twoim routerze/serwerze są przekierowane na maszynę z Dockerem.
3. Zrestartuj kontenery:
   ```bash
   docker compose up -d
   ```
   Caddy automatycznie wygeneruje i odnowi certyfikat HTTPS!

---

## ⚡ Optymalizacje pod Procesor Intel N100

- **Kolejka obróbki z throttlingiem (`concurrency: 2`)**: Procesor Intel N100 posiada 4 rdzenie Gracemont. Ograniczenie konwersji zdjęć (`Sharp`) i klatek wideo (`FFmpeg`) do 2 zadań współbieżnych chroni serwer przed przeciążeniem i gwarantuje płynną obsługę ruchu HTTP dla gości.
- **Watchdog FFmpeg (25s timeout)**: W razie napotkania uszkodzonego pliku wideo proces transkodowania jest bezpiecznie ubijany (`SIGKILL`), zapobiegając zablokowaniu kolejki zadań w tle.
- **Strumieniowany ZIP (`archiver`)**: Pakiety danych są przekazywane bezpośrednio ze strumieni dyskowych do gniazda sieciowego (`chunked transfer-encoding`). Nawet przy pobieraniu 50 GB zdjęć pamięć RAM serwera nie ulega wyczerpaniu.
- **Indeksy złożone w PostgreSQL**: Zapytania o multimedia oraz agregacje rozmiarów dyskowych korzystają z indeksów `idx_media_items_gallery_status_created` oraz `idx_media_items_gallery_size`, eliminując powolne przeszukiwania sekwencyjne.
- **Akceleracja sprzętowa Intel QuickSync (QSV)**: W pliku `docker-compose.yml` możesz odkomentować mapowanie urządzenia `/dev/dri:/dev/dri` na maszynach z systemem Linux, aby FFmpeg korzystał ze sprzętowego transkodowania wideo.

---

## 📁 Bezpieczeństwo i Prywatność

- **Brak indeksowania**: Serwer automatycznie wysyła nagłówki HTTP `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`, chroniąc prywatne zdjęcia przed robotami Google czy Bing.
- **Bezpieczne tokeny administracyjne**: Logowanie administratora generuje podpisany kryptograficznie token HMAC-SHA256 z weryfikacją `crypto.timingSafeEqual` w stałym czasie.
- **Ochrona Path Traversal i ścisła sanityzacja**: Serwowanie plików przeniesione bezpośrednio na poziom webserwera Caddy chroniąc przed wyjściem poza katalog /data. Dodatkowo działa sanityzacja `^[a-z0-9_-]+$` przy tworzeniu slugów galerii (całkowite wycięcie znaków specjalnych, spacji i sekwencji `../`).
- **Zgodność TUS z HTTPS i Reverse Proxy**: Serwer TUS działa z flagami `relativeLocation: true` oraz `respectForwardedHeaders: true`, a klient przeglądarki dynamicznie odpytuje `window.location.origin`, co całkowicie eliminuje błędy CORS i niepożądane przekierowania preflight HTTP -> HTTPS.
- **Globalny singleton SSE i odporne odświeżanie**: Magistrala zdarzeń zarejestrowana w `globalThis.__wedding_sse_bus__` oraz mechanizm ponawianego cichego odpytywania w tle (0s, 1s, 2.5s, 5s) gwarantują natychmiastowe pojawienie się zdjęć i filmów na ekranach gości zaraz po zakończeniu obróbki FFmpeg/Sharp.
- **Autoryzacja zdjęć ukrytych**: Dostęp do materiałów ukrytych (`status: "hidden"`) przez API wymaga poświadczeń właściciela galerii lub administratora (brak wycieków w publicznym JSON).
- **Haszowanie haseł**: Hasła administratora, par młodych, hasła gości oraz PIN-y ZIP są zabezpieczone funkcją `bcrypt` z solą (stare wartości plaintext są automatycznie zamieniane na hash przy pierwszym poprawnym logowaniu).
- **Rate limiting**: 10 nieudanych prób / 15 min na IP i galerię dla logowań, haseł i PIN-ów (potem `429`, bez kosztownego bcrypt); limity dla życzeń i tworzenia uploadów. Tokeny admina wygasają po 8 h, a wylogowanie unieważnia token.
- **Limity uploadu**: maksymalnie **1 GB na plik**; limit pojemności galerii (`maxStorageBytes`) obejmuje także gości; porzucone uploady są sprzątane po 24 h.
- **Hasło gościa**: galeria chroniona hasłem nie ujawnia mediów, życzeń ani uploadu bez sesji gościa.
- **Branding bez SVG**: logo i tło tylko JPEG/PNG/WebP, weryfikowane po zawartości pliku.
- **Izolacja**: Pliki każdej pary są przechowywane w odrębnych podkatalogach `/data/galleries/<slug>/`.
- **Utwardzony kontener Docker i nieuprzywilejowany użytkownik (`USER node`)**: Kontener aplikacji produkcyjnej działa na odświeżonym obrazie `node:24-alpine` z całkowitym usunięciem zbędnych globalnych narzędzi NPM/Yarn oraz prawami użytkownika nie-root (`USER node`, UID/GID 1000). Kontener startuje przez `docker-entrypoint.sh`, który przy każdym starcie naprawia właściciela `/app/data` (stare wolumeny założone przez root powodowały `EACCES` przy przenoszeniu uploadów) i dopiero wtedy zrzuca uprawnienia do `node` (`su-exec`).
- **Zoptymalizowany rozmiar obrazu**: Dzięki rozdzieleniu zależności deweloperskich (`@serwist/*`), migracji Google SDK na `@googleapis/drive` oraz optymalizacji warstw, obraz produkcyjny został zredukowany o ponad 65% z 0 podatnościami krytycznymi.

---

## 🧪 Testy Automatyczne
 
### 1. Testy Jednostkowe i Integracyjne (Vitest)
```bash
# Uruchomienie 464 testów jednostkowych i integracyjnych w monorepo
pnpm turbo run test
# lub w kontenerze Docker (Node 24 Alpine)
docker run --rm -v "${PWD}:/app" -w /app node:24-alpine sh -c "corepack enable && pnpm -r test"
```

### 2. Testy End-to-End (Playwright)
Pakiet **38 unikalnych scenariuszy testowych (łącznie 114 testów)** uruchamianych w profilach Desktop Chromium, Mobile Chrome oraz Mobile Safari (WebKit):
```bash
# Uruchomienie pełnego zestawu Playwright E2E
pnpm --filter @wedding-drop/web test:e2e
# lub w sieci Docker
docker run --rm --network wedding-drop_wedding_net -v wedding_playwright_browsers:/ms-playwright -v "${PWD}:/app" -w /app/apps/web -e BASE_URL=http://wedding_web:3000 mcr.microsoft.com/playwright:v1.50.0-noble npx playwright test
```
Pokrywa:
- **Panel Administratora**: logowanie danymi admina, walidacja błędu hasła, tworzenie wesela, obsługa kolizji sluga, usuwanie galerii.
- **Panel Pary Młodej (Moderacja)**: logowanie hasłem, pobieranie ZIP z hasłem (w tym zdjęć ukrytych), moderacja widoczności (ukryj/pokaż), filtrowanie zakładek, usuwanie multimediów.
- **Ścieżka Gościa & Mobile UX**: przeglądanie galerii na żywo, drawer uploadu TUS, siatka zdjęć z podpisami, pełnoekranowy Lightbox z gestami **Touch Swipe** (przesuwanie palcem lewo/prawo) oraz pobieranie plików.
- **Kreator Winietek A6**: podgląd karty `#printable-card` z kodem QR, zmiana palet barwnych, edycja tekstów na żywo, generowanie wektorowego PDF (300 DPI) z parametrami w URL.
- **Bezpieczeństwo & Edge Cases**: blokada ukrytych zdjęć (401), ekran 404, ochrona sandbox Directory Traversal, pobieranie ZIP pustej galerii (400), blokada fałszywych tokenów HMAC (401), sanityzacja złośliwego sluga z path traversal, tryb TV natychmiast usuwający z rotacji zdjęcie ukryte na żywo (SSE) oraz ignorujący sfałszowane parametry dostępu właściciela w adresie URL.

---

## 🧭 OpenSpec (spec-driven changes)

Repozytorium używa [OpenSpec](https://github.com/Fission-AI/OpenSpec) do propozycji zmian i specyfikacji (`openspec/`). Artefakty piszemy po polsku; kontekst projektu jest w `openspec/config.yaml`.

Komendy w Antigravity i Cursorze: `/opsx-explore`, `/opsx-propose`, `/opsx-apply`, `/opsx-update`, `/opsx-sync`, `/opsx-archive`  
(Claude Code i Gemini CLI: `/opsx:explore`, `/opsx:propose`, …).

```bash
pnpm openspec list          # aktywne change'e
pnpm openspec list --specs  # główne specyfikacje
```

---

## 📐 Spec-Driven Development (OpenSpec)

Projekt wspiera podejście **Spec-Driven Development (SDD)** z wykorzystaniem narzędzia [OpenSpec](https://github.com/Fission-AI/openspec), umożliwiając tworzenie formalnych specyfikacji, propozycji zmian i zadań przed przystąpieniem do kodowania z asystentami AI (Antigravity, Cursor, Claude Code).

```bash
# Sprawdzenie stanu specyfikacji i propozycji
pnpm openspec doctor
pnpm openspec validate --all

# Interaktywny pulpit specyfikacji i zmian
pnpm openspec view
```

Wszystkie specyfikacje oraz propozycje zmian znajdują się w katalogu `openspec/`, a dedykowane skille i komendy agentów są dostępne m.in. w `.agents/`, `.cursor/` oraz `.claude/`.

---

## 🔒 Bezpieczeństwo i Zmiany w API (Breaking Changes)

Od wersji z utwardzoną sesją właściciela wprowadzono następujące zasady:
- **Wycofanie poświadczeń z query stringu**: Parametry `?password=`, `?token=`, `?ownerToken=`, `?adminToken=` nie są już akceptowane przez serwer (`/api/gallery/:slug/media`, `/api/gallery/:slug/zip`, `/api/admin/galleries`, `/api/auth/google`). Wszelkie poświadczenia muszą być przekazywane w nagłówkach HTTP (`x-owner-token`, `x-owner-password`, `Authorization: Bearer <token>`, `x-admin-token`) lub za pośrednictwem ciasteczka sesji `wd_owner_{slug}`.
- **Inicjalizacja Google OAuth**: Endpoint `/api/auth/google` przyjmuje wyłącznie metodę `POST` z ciałem JSON `{ "slug": "..." }` i nagłówkiem autoryzacyjnym, zwracając adres docelowy `{ "authUrl": "..." }`.
- **PIN ZIP tylko w nagłówku**: `?pin=` jest ignorowany — użyj `x-access-pin`.
- **Nowy format tokenów**: tokeny admina/właściciela zawierają `jti`; po wdrożeniu starsze tokeny przestają działać (ponowne logowanie). Token admina ważny 8 h. Logowanie ma limit prób (`429` + `Retry-After`).
- **SVG nie jest już przyjmowany** jako logo/tło.
- **Migracja skryptów i integracji**: Zewnętrzne skrypty korzystające dotąd z parametrów w adresie URL (np. pobieranie ZIP) muszą przekazywać nagłówek HTTP, np. `curl -H "x-owner-token: <token>" https://.../api/gallery/<slug>/zip` lub `curl -H "x-owner-password: <haslo>" ...`.

---

## 📄 Licencja

Projekt **WeddingDrop** jest wolnym i otwartym oprogramowaniem (Free & Open Source Software) publikowanym na warunkach licencji **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### Co to oznacza w praktyce?
- **Wolność użytkowania**: Możesz bezpłatnie uruchamiać i hostować aplikację na własne potrzeby prywatne oraz komercyjne (np. obsługa wesel Twoich klientów).
- **Wolność modyfikacji**: Możesz w pełni dostosowywać kod do swoich wymagań i dodawać nowe funkcje.
- **Copyleft (w duchu WordPressa)**: Jeśli zmodyfikujesz kod źródłowy WeddingDrop i udostępnisz go gościom lub klientom — w tym również **przez sieć jako usługę online (SaaS/Cloud)** — masz prawny obowiązek udostępnić pełny kod źródłowy wprowadzonych ulepszeń na tej samej licencji (AGPL-3.0).
- **Ochrona wolności społeczności**: Żadna firma ani podmiot trzeci nie może zamknąć projektu ani dystrybuować zmodyfikowanej wersji jako zamkniętego oprogramowania własnościowego (proprietary software).
- **Brak gwarancji**: Oprogramowanie jest dostarczane w stanie "tak jak jest" (AS IS), bez jakichkolwiek dorozumianych gwarancji.

Pełny, oficjalny tekst licencji znajduje się w pliku [LICENSE](LICENSE).

Copyright (C) 2026 WeddingDrop Contributors

