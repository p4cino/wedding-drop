---
name: wedding-gdrive
description: >-
  Use this skill when the user asks to configure, debug, test, or modify the Google Drive integration, OAuth 2.0 flow, offline refresh token handling, Google Cloud Console setup, or the background export process.
---

# WeddingDrop Google Drive: Integracja OAuth 2.0 i Eksport Danych

Ten skill zawiera kompletny przewodnik konfiguracji oraz diagnostyki integracji z **Google Drive API** dla par młodych.

---

## 1. Architektura Integracji

Integracja umożliwia Parze Młodej z poziomu panelu właściciela (`/owner/[slug]`):
1. Podłączenie własnego konta Google za pomocą bezpiecznego protokołu **OAuth 2.0**.
2. Zapisanie tokena odświeżania (`refresh_token`) w bazie danych.
3. Asynchroniczne uruchomienie w tle eksportu wszystkich zdjęć i filmów do dedykowanego katalogu na Dysku Google (np. `WeddingDrop - Kasia i Tomek`).
4. Śledzenie statusu postępu (liczba wyeksportowanych plików, bajtów i link do folderu na Dysku).
5. Bezpieczne odłączenie konta i usunięcie tokenów z bazy.

Szczegółową instrukcję rejestracji aplikacji w Google Cloud Console znajdziesz w dokumencie [gdrive-setup.md](./references/gdrive-setup.md).

---

## 2. Kluczowe Endpointy i Moduły

- `packages/media/src/google-drive.ts`: Inicjalizacja klienta `google.auth.OAuth2`, generowanie linku autoryzacyjnego ze stanem HMAC oraz odświeżanie tokenów.
- `packages/media/src/gdrive-exporter.ts`: Moduł asynchronicznego eksportu multimediów w tle z logowaniem statusu transferu.
- `apps/web/src/app/api/auth/google/route.ts`: Endpoint inicjalizujący przekierowanie do Google OAuth.
- `apps/web/src/app/api/auth/google/callback/route.ts`: Obsługa powrotu z Google, weryfikacja integralności tokena HMAC, wymiana kodu autoryzacji na `refresh_token`.
- `apps/web/src/app/api/owner/route.ts`: Akcje `start-gdrive-export`, `disconnect-gdrive`, `get-gdrive-status`.

---

## 3. Zmienne Środowiskowe (`.env`)

```env
GOOGLE_CLIENT_ID=twoj_klient_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=twoj_klient_secret
```

---

## 4. Typowe Zagadnienia i Diagnostyka

### A. Wygasanie tokena po 7 dniach
- **Przyczyna**: Aplikacja w Google Cloud Console znajduje się w trybie "Testing". W trybie testowym Google unieważnia tokeny odświeżania po 7 dniach.
- **Rozwiązanie**: W Google Cloud Console w sekcji **OAuth consent screen** kliknij **PUBLISH APP** (przełącz na "In Production"). Ponieważ używany zakres to wyłącznie `https://www.googleapis.com/auth/drive.file`, weryfikacja Google nie wymaga długiego ani płatnego audytu bezpieczeństwa.

### B. Błąd `redirect_uri_mismatch`
- **Przyczyna**: Adres podany w polu **Authorized redirect URIs** w Google Cloud Console nie pokrywa się dokładnie z adresem wywołującym.
- **Rozwiązanie**: Upewnij się, że podano pełną ścieżkę uwzględniającą protokół HTTPS:
  `https://slub.twojadomena.pl/api/auth/google/callback`
  Dla środowiska lokalnego: `http://localhost:3000/api/auth/google/callback`.

### C. Duże pliki wideo przerywające eksport
- Biblioteka `gdrive-exporter.ts` wykorzystuje strumieniowane przesyłanie wielkich plików za pomocą `drive.files.create({ media: { body: fs.createReadStream(...) } })`.
