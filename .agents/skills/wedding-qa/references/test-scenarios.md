# Wykaz Scenariuszy Testowych Playwright E2E

Pakiet testów E2E składa się z 32 unikalnych przypadków testowych, uruchamianych w 3 profilach przeglądarek (Desktop Chromium, Mobile Chrome, Mobile Safari), co daje łącznie **96 asercji systemowych**.

---

## 1. Moduł Administratora (`e2e/admin-management.spec.ts`)
1. **Prawidłowe logowanie admina**: Weryfikacja formularza pod adresem `/admin` danymi administratora, zapis tokena HMAC w cookies/storage.
2. **Obsługa błędnego hasła**: Weryfikacja komunikatu błędu i braku autoryzacji przy podaniu złego hasła.
3. **Tworzenie nowej galerii ślubnej**: Wypełnienie formularza (imiona, data, e-mail, hasło, slug) i weryfikacja dodania rekordu.
4. **Obsługa kolizji sluga**: Próba utworzenia wesela o istniejącym już slugu i sprawdzenie walidacji unikalności.
5. **Usuwanie galerii**: Skasowanie galerii z potwierdzeniem dialogu przeglądarki i weryfikacja jej zniknięcia z listy.
6. **Agregacja statystyk**: Sprawdzenie poprawności wyliczania liczby zdjęć i sumarycznego rozmiaru w MB.

---

## 2. Moduł Pary Młodej / Moderacja (`e2e/owner-moderation.spec.ts`)
1. **Logowanie do panelu właściciela**: Dostęp pod `/owner/[slug]` i logowanie hasłem pary.
2. **Ukrywanie zdjęcia (ready -> hidden)**: Kliknięcie przycisku "Ukryj" i weryfikacja natychmiastowej zmiany etykiety statusu.
3. **Przywracanie zdjęcia (hidden -> ready)**: Odkrycie zdjęcia i powrót do stanu publicznego.
4. **Usuwanie multimedium**: Trwałe usunięcie zdjęcia z panelu pary.
5. **Pobieranie archiwum ZIP ze zdjęciami ukrytymi**: Weryfikacja zapytania z hasłem właściciela (`/api/gallery/:slug/zip?password=...`).
6. **Filtrowanie zakładek**: Przełączanie widoku między "Wszystkie", "Widoczne" i "Ukryte".
7. **Przejście do konfiguratora winietki**: Sprawdzenie linku i przejścia do edytora karty A6.

---

## 3. Ścieżka Gościa & Mobile UX (`e2e/guest-journey.spec.ts`)
1. **Dostęp publiczny**: Otwarcie strony `/g/[slug]` bez wymogu logowania.
2. **Nagłówek i status na żywo**: Wyświetlenie imion pary, daty i wskaźnika połączenia SSE.
3. **Stan pusty galerii**: Informacja zachęcająca do dodania pierwszego zdjęcia.
4. **Drawer uploadu (TUS)**: Otwarcie dolnego panelu uploadu, wybór pliku i pasek postępu.
5. **Siatka zdjęć (Masonry)**: Renderowanie kafelków zdjęć z podpisami autorów.
6. **Lightbox (Pełny ekran)**: Otwarcie powiększenia po kliknięciu miniatury.
7. **Gesty Touch Swipe**: Przesuwanie palcem w lewo/prawo na urządzeniach mobilnych (Mobile Safari / Mobile Chrome) zmieniające aktywne zdjęcie.

---

## 4. Kreator Winietek Stolikowych A6 (`e2e/card-customizer.spec.ts`)
1. **Podgląd karty stołowej**: Weryfikacja renderowania elementu `#printable-card`.
2. **Dynamiczny kod QR**: Sprawdzenie, czy kod QR zawiera prawidłowy link do galerii gościa.
3. **Zmiana motywu kolorystycznego**: Wybór palety barwnej (np. butelkowa zieleń, złoto) i weryfikacja stylów ramki oraz tekstu.
4. **Edycja tekstów na żywo**: Modyfikacja nagłówka i instrukcji w formularzu z natychmiastowym odzwierciedleniem w podglądzie.
5. **Generowanie i pobieranie wektorowego PDF**: Weryfikacja linku pobrania dokumentu z parametrami URL przekazywanymi do silnika `pdf-lib`.

---

## 5. Bezpieczeństwo i Przypadki Brzegowe (`e2e/security-and-edge-cases.spec.ts`)
1. **Odmowa dostępu do zdjęć ukrytych**: Błąd 401 przy próbie odpytania `/api/gallery/:slug/media?includeHidden=true` bez autoryzacji.
2. **Obsługa nieistniejącej galerii (404)**: Próba wejścia na `/g/nie-istnieje` zwraca estetyczny ekran błędu 404.
3. **Sandbox Directory Traversal**: Próba odpytania `/media-file/../../etc/passwd` kończy się błędem 403 lub 404.
4. **Pobranie pustego ZIP**: Próba pobrania archiwum z galerii bez zdjęć zwraca kod 400 z czytelnym komunikatem.
5. **Fałszywy token HMAC administratora**: Próba użycia sfałszowanego nagłówka `Authorization` skutkuje błędem 401.
6. **Błędne logowanie właściciela do obcej galerii**: Brak możliwości zalogowania hasłem pary A do galerii pary B.
7. **Sanityzacja złośliwego sluga**: Próba utworzenia galerii ze slugiem zawierającym spacje i znaki path traversal (`zly slug!@# z path/../`) zostaje oczyszczona do `zlyslugzpath`.
