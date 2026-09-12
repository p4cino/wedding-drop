# Konfiguracja Google Drive API w Google Cloud Console

Poniższa instrukcja krok po kroku wyjaśnia, jak poprawnie skonfigurować projekt w Google Cloud Console, aby Para Młoda mogła bez przeszkód podłączyć swój Dysk Google.

---

## Krok 1: Utworzenie Projektu w Google Cloud
1. Otwórz konsolę [Google Cloud Console](https://console.cloud.google.com/).
2. W górnym menu kliknij listę projektów i wybierz **New Project** (Nowy projekt).
3. Podaj nazwę projektu (np. `WeddingDrop`) i zatwierdź przyciskiem **Create**.

---

## Krok 2: Aktywacja Google Drive API
1. Przejdź do sekcji **APIs & Services > Library**.
2. W polu wyszukiwania wpisz **Google Drive API**.
3. Kliknij wynik wyszukiwania i wciśnij przycisk **Enable** (Włącz).

---

## Krok 3: Konfiguracja Ekranu Zgody (OAuth Consent Screen)
1. Przejdź do **APIs & Services > OAuth consent screen**.
2. Wybierz typ użytkowników: **External** i kliknij **Create**.
3. Wypełnij podstawowe dane:
   - **App name**: `WeddingDrop`
   - **User support email**: Twój adres e-mail
   - **Developer contact information**: Twój adres e-mail
4. W zakładce **Scopes** (Zakresy) kliknij **Add or Remove Scopes** i dodaj:
   - `https://www.googleapis.com/auth/drive.file` (Tworzenie i zarządzanie plikami utworzonymi przez aplikację)
   - `https://www.googleapis.com/auth/userinfo.email` (Wyświetlanie podłączonego e-maila w panelu)
5. Kliknij **Save and Continue**.
6. **Bardzo Ważne (Tryb Produkcyjny)**:
   - Wróć do zakładki **OAuth consent screen** i w sekcji **Publishing status** kliknij **PUBLISH APP**.
   - Spowoduje to przejście ze statusu *Testing* do *In Production*.
   - Ponieważ zakres `drive.file` jest bezpieczny (nie wymaga weryfikacji ograniczonej/wrażliwej), tokeny `refresh_token` nie wygasają po 7 dniach.

---

## Krok 4: Utworzenie Poświadczeń (Credentials)
1. Przejdź do **APIs & Services > Credentials**.
2. Kliknij **Create Credentials** na górnym pasku i wybierz **OAuth client ID**.
3. Wybierz typ aplikacji: **Web application**.
4. W polu **Name** wpisz np. `WeddingDrop Web Client`.
5. W sekcji **Authorized redirect URIs** kliknij **Add URI** i dodaj:
   - Środowisko produkcyjne: `https://slub.twojadomena.pl/api/auth/google/callback`
   - Środowisko deweloperskie: `http://localhost:3000/api/auth/google/callback`
6. Kliknij **Create**.
7. Skopiuj **Client ID** oraz **Client Secret** do pliku `.env`:
   ```env
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```
