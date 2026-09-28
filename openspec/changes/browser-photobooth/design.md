# Design

## Context

Zobacz `proposal.md` — sekcja „Why”. Dzisiejszy `UploaderDrawer.tsx` obsługuje tylko wybór istniejących plików (`<input type="file" multiple>`) i wysyła je przez `tus-js-client` do `/api/upload/tus`, skąd `packages/media/src/tus-server.ts` przekazuje je do `scheduleMediaProcessing` (kolejka `p-queue(2)`). Kolory motywu wesela (`primaryColor`, `accentColor`) są już przechowywane w tabeli `card_settings` i czytane bez uwierzytelnienia właściciela przez istniejący, publiczny endpoint `GET /api/gallery/[slug]/card/pdf` (generator winietki), więc nie jest to nowa ekspozycja danych.

## Goals / Non-Goals

**Goals:**
- Zdjęcie zrobione w przeglądarce musi przejść przez identyczny punkt wejścia uploadu (`tus.Upload`) co plik z dysku — zero rozgałęzień w `tus-server.ts`/`media-processor.ts`.
- Kompozycja ramki dzieje się w 100% po stronie klienta (canvas), zero nowego obciążenia serwera N100.

**Non-Goals:**
- Brak przetwarzania obrazu po stronie serwera specyficznego dla zdjęć z photobooth (te trafiają do Sharp dokładnie tak samo jak każde inne zdjęcie).
- Brak wsparcia dla starszych przeglądarek bez `getUserMedia`/`MediaDevices` — zwykły wybór pliku pozostaje działającym fallbackiem.

## Decisions

- **Nowy komponent kliencki `CameraCapture` używany wewnątrz `UploaderDrawer`, a nie osobna strona/trasa.** Zachowuje istniejący przepływ (podpis → wybór źródła zdjęcia → wysyłka) i całą logikę TUS z `UploaderDrawer.tsx` bez duplikacji.
- **Zrzut z `<video>` na `<canvas>`, kompozycja ramki na tym samym canvasie, eksport przez `canvas.toBlob("image/jpeg", 0.92)`.** Wynikowy `Blob` opakowany w obiekt `File` (z wygenerowaną nazwą, np. `photobooth_<timestamp>.jpg`) i podany do tego samego `startUpload`/`tus.Upload`, którego dziś używa wybór pliku — zero zmian w kontrakcie API TUS (te same pola metadanych: `gallerySlug`, `uploaderName`, `originalName`, `fileType`).
- **Kolory ramki pobierane przez lekkie query do istniejących danych `card_settings` (przez nowy, minimalny odczyt w publicznym endpoincie galerii, analogiczny do już publicznego `card/pdf`), zamiast duplikować dane w nowym miejscu.** Jeśli galeria nie ma zapisanych ustawień, komponent używa tych samych domyślnych kolorów co generator winietek (`#1E293B` / `#D4AF37`), więc zachowanie jest spójne z istniejącą funkcją.
- **Brak przełącznika przód/tył kamery w tej iteracji — używany jest domyślny aparat wskazany przez przeglądarkę** (`facingMode: "user"` jako preferencja, bez wymuszania), zgodnie z Non-Goals w proposal.md.

## Risks / Trade-offs

- [Ryzyko: `getUserMedia` wymaga bezpiecznego kontekstu (HTTPS)] → Mitigacja: produkcja już działa za Caddy z automatycznym Let's Encrypt (patrz `README.md` — sekcja SSL); jedyny przypadek bez HTTPS to lokalny dev na `http://localhost`, który przeglądarki i tak traktują jako bezpieczny kontekst.
- [Ryzyko: różne przeglądarki mobilne (Safari iOS vs Chrome Android) mają subtelnie inne zachowania `getUserMedia`/orientacji wideo] → Mitigacja: komponent odczytuje faktyczne wymiary strumienia wideo (`videoWidth`/`videoHeight`) przy rysowaniu na canvas zamiast zakładać stałą orientację, oraz posiada prosty fallback "nie udało się uruchomić aparatu — użyj zwykłego wyboru pliku".
- [Ryzyko: duży, nieskompresowany zrzut z kamery (np. 4K na nowszych telefonach) generuje cięższy plik niż typowe zdjęcie z galerii] → Mitigacja: eksport przez `canvas.toBlob` z jakością JPEG 0.92 i ewentualnym ograniczeniem rozdzielczości canvasu (np. maks. 1920px po dłuższym boku) — plik i tak trafia do tej samej kompresji WebP na miniaturkę po stronie serwera, więc wpływ na przechowywanie oryginałów jest porównywalny do zwykłego zdjęcia z telefonu.
