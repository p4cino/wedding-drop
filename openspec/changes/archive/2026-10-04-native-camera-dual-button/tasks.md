# Tasks

## 1. Usunięcie przestarzałego kodu kamery (WebRTC)

- [ ] 1.1 Usunięcie plików odpowiedzialnych za przeglądarkową obsługę kamery (np. `apps/web/src/components/CameraCapture.tsx` i dedykowanych dla niego hooków) oraz weryfikacja braku błędów kompilacji TypeScripcie (`pnpm -F @wedding-drop/web tsc`).
- [ ] 1.2 Usunięcie zależnych testów (np. `apps/web/tests/unit/components/CameraCapture.test.tsx`, `tests/unit/hooks/useCamera.test.ts` itp.) z weryfikacją poprawności zestawu testów `pnpm run test`.
- [ ] 1.3 Oczyszczenie pliku konfiguracyjnego TUS uploader (`UploaderDrawer.tsx` lub podobne) z niepotrzebnego stanu i referencji wideo w celu zapobiegania błędom lintera (`pnpm biome check apps/web`).

## 2. Implementacja Dual-Button UI

- [ ] 2.1 Stworzenie lub edycja komponentu wgrywania w UI gościa (`GuestUploadView.tsx` lub odpowiadający z `apps/web/src/app/[locale]/g/[slug]/page.tsx`), aby dodać dwa przyciski (np. ukryte elementy `<input type="file">` połączone z przyciskami "Zrób zdjęcie" oraz "Wybierz z urządzenia"). Weryfikacja wizualna na testowej stronie galerii pod kątem responsywności.
- [ ] 2.2 Podpięcie odpowiednich atrybutów (`accept="image/*,video/*" capture="environment"` dla aparatu oraz `accept="image/*,video/*"` dla galerii) z obsługą zdarzenia `onChange` przechwytującego nowo utworzony plik (`e.target.files[0]`). Sprawdzenie w testach jednostkowych (Vitest), czy pożądane funkcje call-backów są odpalane po podpięciu fake'owego eventu.
- [ ] 2.3 Skomunikowanie wyników z inputów bezpośrenio z logiką kolejki przesyłania TUS (przekazanie obiektu `File` do `useUploadQueue().addFiles([file])`). Weryfikacja E2E (Playwright - np. `guest-journey.spec.ts`) czy nowy plik dodaje się bezbłędnie do uploadera i trafia do szuflady postępu.

## 3. Aktualizacja dokumentacji E2E

- [ ] 3.1 Modyfikacja testu e2e gościa (`apps/web/e2e/guest-journey.spec.ts`), aby zamiast mockowania WebRTC "klikał" w przycisk galerii i ustawiał pliki wejściowe w `input type="file"`. Weryfikacja działania testu za pomocą lokalnego uruchomienia Playwright'a.
- [ ] 3.2 Zgodnie z AGENTS.md §7, aktualizacja dokumentacji `README.md` oraz ewentualnych wpisów dotyczących uploadu i wsparcia urządzeń. Weryfikacja poprawnego zapisu Markdowna.
