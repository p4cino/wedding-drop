# Proposal

## Why

Konkurencja (Evolly, JustFilm.it) oferuje gościom możliwość zrobienia zdjęcia bezpośrednio w przeglądarce, z ramką w motywie wesela — nie tylko wgranie istniejącego zdjęcia z rolki. To dodatkowa zachęta do korzystania z aplikacji nawet dla gości, którzy nie mają jeszcze żadnych zdjęć z danej chwili, i naturalnie tworzy spójny wizualnie zestaw "kart pamiątkowych" z wesela.

## What Changes

- W drawerze uploadu (`UploaderDrawer.tsx`) nowa opcja "Zrób zdjęcie" obok istniejącego wyboru plików — otwiera podgląd z kamery urządzenia (`getUserMedia`), z przyciskiem spustu migawki.
- Zrobione zdjęcie jest komponowane na `<canvas>` z opcjonalną ramką dekoracyjną w kolorach motywu danego wesela (reużycie istniejących `card_settings.primaryColor`/`accentColor` z generatora winietek).
- Wynikowy obraz trafia do dokładnie tego samego potoku, co zwykły upload z galerii telefonu (TUS → `media-processor.ts` → miniatura WebP → wpis w `media_items` → SSE) — zero zmian w backendzie/przetwarzaniu.
- Jeśli przeglądarka/urządzenie nie udzieli dostępu do kamery lub jej nie ma, opcja jest po prostu niedostępna — istniejący wybór pliku z galerii pozostaje głównym sposobem dodawania zdjęć.

## Capabilities

### New Capabilities

- `browser-photobooth`: możliwość zrobienia zdjęcia bezpośrednio w przeglądarce gościa (bez aparatu systemowego) z opcjonalną ramką motywu wesela, wysyłanego tym samym potokiem co zwykły upload.

### Modified Capabilities

(brak — istniejący potok uploadu/przetwarzania pozostaje bez zmian; nowa funkcja tylko dostarcza mu dodatkowe źródło pliku)

## Impact

- Zmiana w `apps/web/src/components/UploaderDrawer.tsx` (nowy tryb "aparat w przeglądarce" obok wyboru plików, reużywa istniejący kod startu uploadu TUS).
- Nowy mały komponent kliencki do obsługi `getUserMedia` + `<canvas>` (kompozycja ramki), bez żadnych zmian w `packages/media` czy schemacie bazy danych.
- Zero wpływu na ograniczenia N100 — capture i kompozycja dzieją się w przeglądarce gościa, a wynikowy plik trafia do już istniejącej, przepustowo ograniczonej kolejki `p-queue(2)` dokładnie tak samo jak dziś.
- Wymaga kontekstu bezpiecznego (HTTPS) dla `getUserMedia` — już spełnione przez Caddy w produkcji; w developmencie na `localhost` przeglądarki i tak traktują `http://localhost` jako bezpieczny kontekst.

## Non-goals / Poza zakresem

- Brak filtrów/efektów AR, przełącznika przedni/tylny aparat w pierwszej iteracji poza domyślnym zachowaniem przeglądarki, ani serii zdjęć (tylko pojedyncze ujęcie na "spust migawki").
- Brak drukowania zrobionego zdjęcia na miejscu (to już częściowo pokrywa istniejący generator winietek A6 dla innego celu).
- Brak edycji/przycinania zdjęcia po zrobieniu — jedno ujęcie, jedna ramka, wysyłka.
