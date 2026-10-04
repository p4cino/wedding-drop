# Proposal

## Why

Obecnie aplikacja wyświetla standardowe teksty (np. imiona pary) i domyślne style wizualne dla każdej galerii. Dodanie opcji personalizacji (własne logo oraz tło) pozwoli właścicielom (parom młodym) na nadanie galerii indywidualnego charakteru, dzięki czemu interfejs gościa będzie wyglądał bardziej profesjonalnie i unikatowo podczas ich najważniejszego dnia.

## What Changes

- Utworzenie nowej tabeli w bazie danych `gallery_branding` powiązanej z tabelą `galleries`.
- Dodanie API (`POST` oraz `DELETE` pod `/api/owner/[slug]/branding`) pozwalającego na wgranie i usunięcie logo oraz tła za pomocą standardowego `multipart/form-data`.
- Aktualizacja interfejsu gościa (strona główna, nawigacja) tak, by wyświetlało się wgrane logo zamiast tekstu z imionami pary, jeśli zostało zdefiniowane.
- Aktualizacja layoutu gościa tak, by dodane tło wyświetlało się pod siatką zdjęć.
- Dodanie sekcji "Wygląd galerii" w panelu właściciela umożliwiającej zarządzanie plikami brandingowymi.

## Non-goals / Poza zakresem

- Obsługa własnych domen zewnętrznych (Custom URL typu `mojslub.pl` z automatycznymi certyfikatami).
- Rozbudowane narzędzia do edycji zdjęć tła czy dodawanie filtrów na logo.
- Zaawansowane motywy kolorystyczne poza podmianą logo i tła.
- Używanie kolejki TUS do wgrywania tych zasobów (małe pliki rzędu max 5MB wgrywane są standardowym protokołem HTTP dla ułatwienia).

## Capabilities

### New Capabilities

- `gallery/custom-branding`: Obsługa niestandardowych opcji wizualnych galerii (własne logo, tło) definiowanych przez właściciela.

### Modified Capabilities

- 

## Impact

- **Baza danych**: Dodanie nowej tabeli `gallery_branding` z relacją do `galleries`.
- **API**: Nowy endpoint obsługujący przesyłanie plików brandingowych, niezależny od kolejki wgrywania dużych plików multimedialnych. Pliki systemowe nie naruszają logiki TUS.
- **Frontend**: Aktualizacja layoutu widoku gościa oraz dodanie nowej sekcji w panelu właściciela.
- **Bezpieczeństwo**: Należy zadbać o weryfikację rozszerzeń/typów MIME (tylko obrazki) oraz nałożenie limitów wielkości (np. 5MB) na pliki z logo i tłem.
- **N100 Constraints**: Nowy mechanizm przesyłania plików omija TUS/p-queue (ponieważ są to sporadyczne, małe uploady), dzięki czemu nie blokuje kolejki roboczej na mikroserwerze z procesorem N100. Należy użyć walidacji ścieżek (`path.posix.join` oraz bezpieczne sprawdzanie przed opuszczeniem `/data`), aby uniknąć Path Traversal. Zapis i serwowanie tych plików nie wpływają na wydajność przetwarzania multimediów przez Sharp/FFmpeg.
