# Standardy Kodu i Dobre Praktyki: WeddingDrop

Poniższy dokument określa standardy programistyczne, architekturę kodu oraz konwencje stosowane w projekcie **WeddingDrop**.

---

## 1. Architektura Next.js 14 (App Router)

- **Klient vs Serwer**:
  - Domyślnie twórz komponenty serwerowe (RSC) dla pobierania danych i wstępnego renderowania HTML.
  - Dyrektywę `"use client"` stosuj wyłącznie dla komponentów z interakcją (LightBox, Drawer, formularze, nasłuchiwanie SSE, gesty dotykowe).
- **Route Handlery (`src/app/api/.../route.ts`)**:
  - Korzystaj ze standardowych metod HTTP (`export async function GET(request: NextRequest, ...)`).
  - Waliduj parametry zapytania oraz payloady JSON przed ich użyciem.
  - Zwracaj poprawne kody błędów HTTP (400 dla nieprawidłowych danych, 401 dla braku poświadczeń, 403 dla odmowy dostępu, 404 dla nieistniejących zasobów).

---

## 2. Baza Danych i Drizzle ORM

- Schemat bazy danych znajduje się w `src/db/schema.ts`.
- **Indeksy złożone**:
  - Tabela `media_items` posiada kluczowe indeksy wydajnościowe:
    1. `idx_media_items_gallery_status_created` na `(gallery_id, status, created_at DESC)`
    2. `idx_media_items_gallery_size` na `(gallery_id, file_size)`
  - **ZAKAZ**: Usuwania lub modyfikacji tych indeksów bez wcześniejszej analizy planu zapytań `EXPLAIN ANALYZE`.
- **Normalizacja ścieżek w bazie**:
  - Kolumny `storage_path` oraz `thumb_path` **zawsze** muszą zawierać ścieżki z separatorami uniksowymi (np. `galleries/para/raw/plik.jpg`).
  - Używaj `path.posix.join(...)` przed zapisem do bazy.

---

## 3. Standardy TypeScript i Jakość Kodu

- Projekt działa w trybie ścisłym (`strict: true` w `tsconfig.json`).
- Unikaj rzutowania na `any`. Definiuj precyzyjne interfejsy i typy dla modeli bazodanowych, payloadów API oraz zdarzeń SSE.
- Wszystkie edycje kodu muszą pomyślnie przechodzić walidację typów:
  ```bash
  npx tsc --noEmit
  ```

---

## 4. Mobile UX i Obsługa Gestów

- Aplikacja jest projektowana w podejściu **100% Mobile-First**.
- **LightboxModal**:
  - Obsługuje gesty przesunięcia palcem po ekranie (`onTouchStart`, `onTouchEnd` - Swipe lewo/prawo).
  - Obsługuje skróty klawiatury (Strzałka w lewo / prawo / Escape).
  - Odporność na SSE: nowe elementy dodawane do listy zdjęć nie mogą zakłócać indeksu aktualnie oglądanego zdjęcia w powiększeniu.
- **Dostępność i Semantyka**:
  - Wszystkie interaktywne przyciski i akcje muszą posiadać czytelne etykiety `aria-label`.
