# Proposal

## Why

Evolly pozwala połączyć profesjonalne zdjęcia fotografa/kamerzysty z uploadami gości w jednej, wspólnej galerii i chronologii. WeddingDrop dziś obsługuje wyłącznie ścieżkę "gość wgrywa ze swojego telefonu" — Para Młoda nie ma sposobu na dołożenie do tej samej galerii materiałów otrzymanych później od zawodowego fotografa/kamerzysty, więc te dwa zbiory zostają rozdzielone (np. osobny link od fotografa, osobny folder).

## What Changes

- W panelu Pary Młodej (`/owner/[slug]`) nowa sekcja "Importuj zdjęcia/filmy fotografa" — masowy, wznawialny upload (ten sam mechanizm TUS co goście) dostępny wyłącznie po zalogowaniu właściciela.
- Zaimportowane materiały trafiają do tej samej galerii, tego samego potoku przetwarzania (miniatury WebP, klatki wideo) i tej samej chronologii co zdjęcia gości, ale są oznaczone jako pochodzące od fotografa (nowe pole `source: "guest" | "photographer"` w `media_items`).
- W siatce galerii (gościa i właściciela) materiały fotografa mają odróżniającą odznakę/etykietę zamiast zwykłego podpisu gościa.
- Import respektuje istniejący limit powierzchni dyskowej galerii (`maxStorageBytes`), jeśli został ustawiony przez administratora.

## Capabilities

### New Capabilities

- `photographer-media-import`: możliwość masowego, wznawialnego zaimportowania przez właściciela galerii materiałów od profesjonalnego fotografa/kamerzysty do tej samej galerii i chronologii co uploady gości, z wizualnym rozróżnieniem źródła.

### Modified Capabilities

(brak — żaden istniejący, archiwizowany kontrakt specyfikacji nie istnieje jeszcze dla `media_items`/galerii gościa w tym repozytorium OpenSpec; ta zmiana rozszerza istniejącą tabelę `media_items` o nową kolumnę, ale nie zmienia zachowania opisanego w innych, równolegle tworzonych wnioskach)

## Impact

- Nowa kolumna `source` w `media_items` (`packages/db/src/schema.ts`, domyślnie `"guest"`) + migracja Drizzle.
- Rozszerzenie `tusUploadMetadataDto` o opcjonalne pole `source` oraz poświadczenia właściciela (token/hasło), weryfikowane w `onUploadCreate`/`POST_FINISH` w `packages/media/src/tus-server.ts` — import fotografa wymaga poprawnej autoryzacji właściciela, w przeciwieństwie do zwykłego uploadu gościa.
- Nowy komponent UI w panelu właściciela (masowy wybór plików + pasek postępu, na wzór istniejącego `UploaderDrawer.tsx`, ale bez pola podpisu gościa).
- Reużycie istniejącej kolejki `p-queue(2)` i watchdoga FFmpeg bez żadnych zmian — import nie omija ograniczeń sprzętowych N100, więc masowy import dużej liczby plików może chwilowo spowolnić przetwarzanie bieżących uploadów gości (patrz Ryzyka w design.md).

## Non-goals / Poza zakresem

- Brak automatycznego pobierania zdjęć z zewnętrznych usług fotografa (Google Drive, Dropbox, linki WeTransfer) w tej iteracji — import odbywa się wyłącznie przez ręczny wybór plików z dysku/urządzenia właściciela.
- Brak osobnego limitu/priorytetu w kolejce przetwarzania dla importu fotografa — celowo dzieli tę samą, ograniczoną kolejkę co goście, zgodnie z niezmiennikiem `p-queue concurrency: 2`.
- Brak możliwości edycji/usunięcia oznaczenia `source` po imporcie z poziomu UI (jednorazowe oznaczenie przy wgraniu).
- **Uwaga dot. istniejącego stanu**: `maxStorageBytes` istnieje dziś w schemacie i jest ustawiane przez administratora, ale nie jest jeszcze nigdzie egzekwowane (brak takiego sprawdzenia w obecnym potoku uploadu). Ta zmiana wprowadza pierwsze faktyczne wymuszenie tego limitu, ale **wyłącznie dla ścieżki importu fotografa** — nie zmienia (i nie naprawia) braku egzekwowania limitu dla zwykłych uploadów gości, co pozostaje osobnym, nieobjętym tu zagadnieniem.
