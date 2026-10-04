# Tasks

## 1. Konwersja komponentów przesyłania

- [x] 1.1 Zmigrować klasy Tailwind (np. w `div`, `span`) na użycie funkcji `css({...})` w pliku `apps/web/src/components/upload/UploadFileRow.tsx`. Weryfikacja: brak paska błędu podczas uruchamiania i podglądu pliku.
- [x] 1.2 Zmigrować wszystkie pozostałe klasy Tailwind w pliku `apps/web/src/components/upload/FilePickerDropzone.tsx`. Weryfikacja: poprawny wygląd strefy upuszczania (bez "zepsutych" paddingów i układu).

## 2. Konwersja paneli administracyjnych i galerii

- [x] 2.1 Zamienić klasy Tailwind na Panda CSS w komponencie `apps/web/src/components/AdminPlaceholderAlert.tsx`. Weryfikacja: poprawny wygląd banera/alertu.
- [x] 2.2 Zmigrować klasy w komponencie `apps/web/src/components/admin/GalleryTable.tsx` na `css({...})`. Weryfikacja: tabela wyświetla się poprawnie i kompiluje się.
- [x] 2.3 Zmigrować klasy Tailwind w `apps/web/src/components/CardPreview.tsx`. Weryfikacja: podgląd kart ślubnych renderuje poprawne marginesy i layout.

## 3. Konwersja pozostałych stron i fragmentów UI

- [x] 3.1 Zaktualizować strony z panelu (np. `apps/web/src/app/[locale]/admin/page.tsx`, `apps/web/src/app/[locale]/g/[slug]/card/page.tsx`, `apps/web/src/app/[locale]/owner/[slug]/page.tsx`) usuwając z nich resztki Tailwinda na rzecz dyrektyw `css({...})`. Weryfikacja: widoki panelu wyświetlają ułożone obok siebie elementy poprawnie.
- [x] 3.2 Zaktualizować strony poboczne (legal/polityka-prywatnosci/regulamin/offline, np. `LegalFooterLinks.tsx`, `RefreshButton.tsx`, `app/[locale]/~offline/page.tsx`, `app/[locale]/(legal)/.../page.tsx`). Weryfikacja: stopki i proste strony renderują się prawidłowo po usunięciu Tailwinda.

## 4. Weryfikacja konfiguracji i testy E2E

- [x] 4.1 Uruchomić weryfikację lintera, polecenie `pnpm biome check apps/web/src/` i zweryfikować brak błędów.
- [x] 4.2 Uruchomić pełny build web app `pnpm --filter @wedding-drop/web build` w celu upewnienia się, że Panda poprawnie przeanalizowała wszystkie zaktualizowane pliki.
- [x] 4.3 Uruchomić testy E2E Playwright, aby zweryfikować czy wizualne usunięcie Tailwinda nie popsuło np. widoczności przycisków w krytycznych ścieżkach użytkownika.
