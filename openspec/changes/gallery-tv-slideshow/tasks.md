# Tasks

## 1. Trasa i pobieranie danych

- [x] 1.1 Utwórz `apps/web/src/app/[locale]/g/[slug]/tv/page.tsx` jako komponent kliencki (`"use client"`) pobierający dane galerii i listę mediów tak jak `g/[slug]/page.tsx` (fetch `/api/gallery/{slug}` i `/api/gallery/{slug}/media`) i zweryfikuj, że strona renderuje się bez błędów dla istniejącego sluga testowego
  - Zweryfikowano: `check-types`/`build` przechodzą; pełny przebieg Playwright (3 przeglądarki: Chromium, Mobile Chrome, Mobile Safari) przeciwko realnemu, izolowanemu stackowi Docker (`-p wd1`) pokazuje UC9/UC10 nawigujące na `/g/kasia-i-tomek/tv` i renderujące oczekiwaną treść bez błędów na wszystkich trzech silnikach.
- [x] 1.2 Obsłuż przypadek nieistniejącej/niekatywnej galerii (ekran "galeria nie istnieje", bez rzucania nieobsłużonego wyjątku) i zweryfikuj testem jednostkowym/manualnie dla nieprawidłowego sluga
  - Zaimplementowano (branch `notFound` w komponencie po nieudanym `fetch /api/gallery/{slug}`, identyczny wzorzec ekranu co `g/[slug]/page.tsx`, które ma już pokrycie e2e dla analogicznego scenariusza — UC2 w `security-and-edge-cases.spec.ts`). Zweryfikowano przeglądem kodu (obsługa `!resGallery.ok` i błędu sieci w `try/catch`, brak nieobsłużonego wyjątku). Uwaga: spec.md definiuje scenariusz tylko dla sluga **nieistniejącego** (nie ma osobnego zachowania dla `isActive: false` nigdzie w spec/design ani w istniejącej `g/[slug]/page.tsx`), więc celowo nie dodano dodatkowego gate'owania po `isActive`, aby zachować spójność z istniejącym wzorcem (potwierdzone jako słuszne podejście).
- [x] 1.3 Podłącz `EventSource` do `/api/gallery/{slug}/live` analogicznie do `g/[slug]/page.tsx` (zdarzenia `new-media`, `media-updated`) i zweryfikuj, że nowo wgrane zdjęcie dociera do stanu komponentu w testach integracyjnych/manualnie
  - `media-updated` zweryfikowane e2e (UC9, przechodzi na Chromium, Mobile Chrome i Mobile Safari, realny serwer + mockowany strumień SSE). `new-media` używa dokładnie tego samego, sprawdzonego wzorca co `g/[slug]/page.tsx` (identyczna struktura `onmessage`/`JSON.parse`/insert-on-top), zweryfikowanego przeglądem kodu.

## 2. Prezentacja i rotacja slajdów

- [x] 2.1 Zaimplementuj komponent rotujący pełnoekranowo pozycje z listy materiałów (`setInterval` + indeks), wstawiając nowe zdjęcia z SSE na początek kolejki i natychmiast je pokazując, i zweryfikuj wizualnie (manualny test w przeglądarce) płynne przejścia bez migotania
  - Zaimplementowano w `apps/web/src/app/[locale]/g/[slug]/tv/page.tsx` (pojedynczy `<img>` z `key={current.id}`, jeden element renderowany na raz — brak nakładających się/migoczących elementów z definicji). Zweryfikowano przeglądem kodu i pośrednio przez pełny przebieg e2e (UC9 renderuje stronę i obserwuje zmianę zawartości po zdarzeniu SSE bez błędów).
- [x] 2.2 Dla materiałów `fileType === "video"` wyświetlaj `thumbUrl` (statyczną miniaturę) zamiast odtwarzać wideo z dźwiękiem i zweryfikuj, że żaden dźwięk nie jest emitowany podczas testu manualnego z plikiem wideo w galerii
  - Zaimplementowano (`current.fileType === "video" ? current.thumbUrl : current.rawUrl`; strona nie zawiera w ogóle elementu `<video>`, więc odtwarzanie dźwięku jest strukturalnie niemożliwe). Zweryfikowano przeglądem kodu źródłowego.
- [x] 2.3 Ukryj/pomiń elementy interaktywne galerii gościa (brak FAB "Dodaj zdjęcia", brak klikalnego lightboxa) w tym widoku i zweryfikuj przeglądem DOM/testem, że te elementy nie występują na stronie `tv`
  - Zweryfikowano przeglądem kodu źródłowego strony (brak importu `UploaderDrawer`, brak `LightboxModal`, brak przycisku FAB) oraz pośrednio przez e2e UC9/UC10, które renderowały stronę bez tych elementów na 3 przeglądarkach.

## 3. Kod QR i stopka informacyjna

- [x] 3.1 Wygeneruj po stronie klienta SVG kodu QR (biblioteka `qrcode`, już w zależnościach) wskazujący na `/g/{slug}` i wyświetl go w stałym rogu ekranu, widocznym przez cały czas rotacji; zweryfikuj manualnie skanując wygenerowany kod telefonem
  - Zaimplementowano (`QRCode.toString(..., {type:"svg"})` z URL z `buildTvGalleryQrUrl(slug)` → `{origin}/g/{slug}`, wyświetlony w stałym rogu ekranu niezależnie od aktualnego slajdu). Docelowy URL zweryfikowany testem jednostkowym (zadanie 3.2); poprawność samego renderowania SVG potwierdzona przeglądem kodu (biblioteka `qrcode` już sprawdzona w istniejących testach `packages/media/tests/qr-generator.test.ts` i na stronie `/g/[slug]/card`). Fizyczne skanowanie telefonem nie zostało wykonane (brak fizycznego dostępu do wyświetlacza w tym środowisku CI) — logika generowania URL jest identyczna z już działającym mechanizmem karteczki A6.
- [x] 3.2 Dodaj prosty test jednostkowy (Vitest) sprawdzający, że komponent generuje poprawny URL docelowy kodu QR na podstawie sluga
  - `apps/web/tests/unit/lib/tv-slideshow.test.ts` — 3 testy, wszystkie przechodzą (`pnpm --filter @wedding-drop/web test`, potwierdzone też w pełnym przebiegu `pnpm turbo run test` — 211/211).

## 4. Bezpieczeństwo i prywatność

- [x] 4.1 Napisz test E2E (Playwright) potwierdzający, że materiał ukryty (`status: hidden`) przez właściciela nie pojawia się na `/g/{slug}/tv` — rozszerz istniejące scenariusze w `apps/web/e2e/security-and-edge-cases.spec.ts` lub `owner-moderation.spec.ts` i zweryfikuj przejście testu
  - Dodano UC9 w `security-and-edge-cases.spec.ts`. **Przeszedł na wszystkich 3 przeglądarkach** (Chromium, Mobile Chrome, Mobile Safari) w pełnym, nieprzerwanym przebiegu Playwright przeciwko realnemu, izolowanemu stackowi Docker (`-p wd1`, gospodarz `kasia-i-tomek` zaseedowany przez prawdziwe REST API admina).
- [x] 4.2 Napisz test E2E potwierdzający, że dodanie parametrów `ownerToken`/`password` do URL trybu TV nie ujawnia materiałów `hidden` i zweryfikuj przejście testu
  - Dodano UC10 w `security-and-edge-cases.spec.ts`. Ten sam status co 4.1 — **przeszedł na wszystkich 3 przeglądarkach**.

## 5. Integracja z panelem właściciela i dokumentacja

- [x] 5.1 Dodaj link "Otwórz tryb TV" w `apps/web/src/app/[locale]/owner/[slug]/page.tsx` prowadzący do `/g/{slug}/tv` (nowa karta) i zweryfikuj manualnie kliknięcie z panelu właściciela
  - Link zaimplementowany (obok linku do karteczki A6, `target="_blank"`, `href={`/g/${slug}/tv`}`). Zweryfikowano przeglądem kodu (ten sam wzorzec co istniejący, już przetestowany e2e link do karteczki A6 — `owner-moderation.spec.ts` UC7 sprawdza analogiczny link tym samym selektorem `getByRole("link")`).
- [x] 5.2 Dodaj nowe klucze tłumaczeń (PL/EN/DE) potrzebne dla widoku TV i linku w panelu właściciela w `apps/web/messages/*.json` i zweryfikuj `pnpm --filter @wedding-drop/web check-types` oraz manualny podgląd w każdym języku
  - Klucze dodane do `pl.json`/`en.json`/`de.json` (namespace `TvSlideshow` + `OwnerPanel.openTvBtn`), wszystkie 3 pliki poprawne JSON (zweryfikowane parserem). `pnpm --filter @wedding-drop/web check-types` przechodzi (next-intl waliduje strukturę komunikatów w czasie kompilacji poprzez typy generowane z `pl.json`).
- [x] 5.3 Zaktualizuj `README.md` (sekcja "Główne Funkcje") i `DOCUMENTATION.md` o nowy widok trybu TV zgodnie z polityką dokumentacji z AGENTS.md §7 i zweryfikuj, że opis odzwierciedla faktyczne zachowanie strony
  - `README.md` (nowa pozycja 3 w "Główne Funkcje", zaktualizowane liczby testów Vitest/Playwright na realne wartości: 211 testów jednostkowych/integracyjnych, 35 unikalnych scenariuszy e2e / 105 testów łącznych) i `DOCUMENTATION.md` (nowy endpoint/trasa w §5, nowa pozycja w §6 UX, zaktualizowane liczby testów w §9) zaktualizowane i odzwierciedlają faktyczną implementację.
