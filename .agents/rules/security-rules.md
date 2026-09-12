# Reguły Bezpieczeństwa i Ochrony Prywatności

System WeddingDrop przetwarza prywatne zdjęcia i nagrania gości weselnych. Wszelkie modyfikacje kodu muszą bezwzględnie przestrzegać poniższych reguł bezpieczeństwa.

---

## 1. Sandbox Dyskowy i Ochrona przed Path Traversal

- Wszelkie statyczne serwowanie plików (zwłaszcza endpoint `/media-file/*` w `server.ts`) **musi** weryfikować pełną ścieżkę bezwzględną:
  ```typescript
  const resolvedPath = path.resolve(mediaStorageDir, requestedFile);
  if (!resolvedPath.startsWith(mediaStorageDir)) {
    res.statusCode = 403;
    res.end("Forbidden: Access outside storage directory");
    return;
  }
  ```
- Odrzucaj wszelkie próby przekazania `..`, separatorów wstecznych lub znaków specjalnych w ścieżkach zasobów.

---

## 2. Rygorystyczna Sanityzacja Slugów

- Identyfikator galerii (`slug`) determinuje nazwę folderu na dysku (`/data/galleries/{slug}/`).
- Dozwolone znaki w slugu to wyłącznie małe litery alfabetu łacińskiego, cyfry, myślnik i podkreślenie (`^[a-z0-9_-]+$`).
- Przed użyciem sluga w ścieżce dyskowej lub zapytaniu SQL zawsze stosuj:
  ```typescript
  const sanitizedSlug = rawSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!sanitizedSlug) {
    throw new Error("Invalid slug format");
  }
  ```

---

## 3. Autoryzacja i Ochrona przed Timing Attacks

- Tokeny logowania administratora bazują na podpisie kryptograficznym **HMAC-SHA256**:
  - Format: `admin_<timestamp>_<base64User>_<hmac>`
  - Ważność: maksymalnie 7 dni.
  - Porównywanie hashy/podpisów **zawsze** musi używać `crypto.timingSafeEqual(bufferA, bufferB)` z uprzednim sprawdzeniem równości długości buforów, aby zapobiec atakom czasowym (Timing Attacks).
- Hasła właścicieli galerii oraz administratora są haszowane przy użyciu `bcrypt` z odpowiednim czynnikiem kosztu (salt rounds).

---

## 4. Ochrona Statusów Mediów (Prywatność)

- Baza danych obsługuje trzy statusy multimediów:
  - `ready` – widoczne dla wszystkich gości w galerii.
  - `hidden` – ukryte przez parę młodą lub administratora.
  - `deleted` – usunięte (pliki fizyczne skasowane lub oczekujące na usunięcie).
- **ZAKAZ**: Zwracania mediów o statusie innym niż `ready` w publicznym API gościa (`/api/gallery/:slug/media`).
- Parametr `includeHidden=true` wymaga autoryzacji nagłówkiem `x-owner-password` lub poprawnym tokenem administratora. Brak uprawnień musi skutkować statusem **401 Unauthorized**.

---

## 5. Brak Indeksowania przez Wyszukiwarki (SEO / RODO)

- Każda odpowiedź HTTP HTML lub proxy brzegowe Caddy musi wysyłać nagłówek:
  ```http
  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
  ```
- Wszystkie strony w Next.js muszą zawierać meta tag:
  ```html
  <meta name="robots" content="noindex, nofollow, noarchive" />
  ```
