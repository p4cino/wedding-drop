# Spec Delta

## Purpose

Zapewnia kompleksową ochronę punktów końcowych, serwowania plików multimedialnych, sesji HMAC, przesyłania TUS, strumieni SSE oraz integracji OAuth przed nieautoryzowanym dostępem, wyciekiem poświadczeń i nadużyciem zasobów.

## ADDED Requirements

### Requirement: Fail-closed media file serving and gallery visibility enforcement

Trasa `/media-file/*` MUST udostępniać wyłącznie pliki z katalogu `galleries/`, które posiadają aktywny rekord w tabeli `media_items`. Pliki nieposiadające rekordu w bazie danych MUST zwracać kod `404 Not Found`. Gdy galeria ma `allowGuestViewing: false` lub `isActive: false`, nieautoryzowany dostęp do `/media-file/*` oraz `/api/gallery/[slug]/zip` MUST być odrzucany kodem `403 Forbidden`.

#### Scenario: Odrzucenie pliku spoza tabeli media_items (np. tus_temp)

- **WHEN** klient wysyła żądanie `GET /media-file/tus_temp/upload_123.json` lub żądanie do pliku na dysku bez wpisu w `media_items`
- **THEN** serwer odrzuca żądanie kodem `403 Forbidden` lub `404 Not Found` i nie przesyła zawartości pliku

#### Scenario: Blokada pobierania mediów i archiwum ZIP przy wyłączonym podglądzie gości

- **WHEN** galeria ma ustawione `allowGuestViewing: false`, a gość bez tokenu właściciela lub administratora odpytuje `/media-file/galleries/<slug>/<plik>` lub `/api/gallery/<slug>/zip`
- **THEN** serwer zwraca odpowiedź `403 Forbidden`

### Requirement: TUS upload ID entropy and credential scrubbing

Serwer TUS MUST generować identyfikatory przesyłania przy użyciu kryptograficznie bezpiecznego generatora liczb losowych (`crypto.randomBytes`). Po weryfikacji poświadczeń fotografa w `onUploadCreate`, pole `ownerToken` MUST zostać usunięte ze zwracanych metadanych, a plik `.json` metadanych TUS MUST być usuwany podczas przenoszenia pliku do galerii.

#### Scenario: Usunięcie ownerToken z metadanych TUS po autoryzacji

- **WHEN** fotograf inicjuje przesyłanie TUS z poprawnym `ownerToken` w `Upload-Metadata`
- **THEN** `onUploadCreate` akceptuje przesyłanie, ale zwracany obiekt metadanych nie zawiera klucza `ownerToken`

### Requirement: Process-wide singleton for HMAC secret and token revocation

Sekret zapasowy HMAC oraz rejestr unieważnionych identyfikatorów tokenów (`revokedJtis`) MUST być przechowywane w `globalThis`, tak aby niestandardowy serwer HTTP (`server.ts`) oraz trasy Next.js App Router współdzieliły ten sam stan w obrębie procesu Node.js. Rotacja sesji właściciela (`GET /api/owner/[slug]/session`) MUST unieważniać dotychczasowy token.

#### Scenario: Natychmiastowa blokada wylogowanego tokenu w /media-file/*

- **WHEN** właściciel wylogowuje się przez `DELETE /api/owner/<slug>/session`, a następnie używa tego samego tokenu do pobrania ukrytego pliku przez `/media-file/*`
- **THEN** żądanie do `/media-file/*` zostaje odrzucone kodem `403 Forbidden`

### Requirement: Guest token binding to gallery password hash

Gdy galeria posiada ustawione hasło gościa (`guestPassword`), weryfikacja sesji gościa MUST uwzględniać skrót aktualnego hasła galerii, tak aby zmiana hasła gościa unieważniała wcześniej wydane tokeny sesyjne. Panel właściciela MUST umożliwiać całkowite wyczyszczenie hasła gościa.

#### Scenario: Unieważnienie sesji gościa po zmianie hasła galerii

- **WHEN** właściciel zmienia `guestPassword` galerii na nowe hasło
- **THEN** wcześniej wydane ciasteczko `wd_guest_<slug>` przestaje autoryzować dostęp do chronionych zasobów galerii

### Requirement: SSE pending media isolation and approval broadcast

Strumień SSE `GET /api/gallery/[slug]/live` MUST NOT wysyłać zdarzeń `new-media` dla plików o statusie `pending` lub `hidden` do klientów nieposiadających uprawnień właściciela lub administratora. Zatwierdzenie pliku (`POST /api/owner/[slug]/approval` z `action: "approve"`) MUST wyemitować zdarzenie `new-media` na szynie SSE.

#### Scenario: Brak emisji pliku pending do gościa i emisja po zatwierdzeniu

- **WHEN** gość przesyła zdjęcie do galerii z włączoną kolejką akceptacji (`isApprovalQueueEnabled: true`)
- **THEN** podłączony klient gościa nie otrzymuje zdarzenia `new-media` podczas przetwarzania, lecz otrzymuje je dopiero po zatwierdzeniu pliku przez właściciela

### Requirement: Rate limiter bucket isolation and storage quota enforcement

Limiter zapytań MUST izolować kubełki uwierzytelniania od kubełków publicznych o dużym wolumenie oraz resetować licznik po poprawnym uwierzytelnieniu hasłem właściciela. Walidacja limitu pojemności galerii (`maxStorageBytes`) MUST uwzględniać bajty aktywnie przesyłanych plików TUS oraz weryfikować limit ponownie przed zapisem pliku w `processMediaTask`.

#### Scenario: Ochrona limitu pojemności przed równoległymi uploadami TUS

- **WHEN** równoległe przesyłania TUS przekraczają łącznie `maxStorageBytes` galerii
- **THEN** nadmiarowe przesyłanie zostaje odrzucone kodem `413` lub usunięte przed zapisem do bazy danych

### Requirement: Single-use OAuth state and strict input validation

Podpisany parametr `state` w przepływie Google OAuth MUST być jednorazowy (ochrona przed powtórzeniem `nonce`) i powiązany z ciasteczkiem sesji inicjującej, jeśli jest obecne. Punkt końcowy `PUT /api/owner/[slug]/card` oraz generator kart PDF MUST walidować dane wejściowe względem schematu DTO i bezpiecznie transliterować znaki spoza WinAnsi.

#### Scenario: Odrzucenie powtórzonego użycia parametru state w Google OAuth

- **WHEN** ten sam podpisany parametr `state` zostanie użyty ponownie w `GET /api/auth/google/callback`
- **THEN** drugie żądanie zostaje odrzucone jako `invalid_or_expired_state`
