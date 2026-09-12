---
name: wedding-media-pipeline
description: >-
  Use this skill when the user asks to modify, debug, or understand the media upload pipeline, TUS 1.0.0 protocol, Sharp thumbnailing, FFmpeg video frame extraction, queue throttling (Intel N100), or the SSE real-time event bus.
---

# WeddingDrop Media Pipeline: TUS, Sharp, FFmpeg & SSE

Ten skill dokumentuje potok przetwarzania multimediów od momentu wrzucenia przez gościa weselnego aż po wyemitowanie zdarzenia na telefony pozostałych gości.

---

## 1. Architektura Potoku Przetwarzania

Potok składa się z 5 kluczowych etapów:
1. **Klient (`UploaderDrawer.tsx`)**: Inicjalizuje upload za pomocą `tus-js-client`. Pobiera origin z `window.location.origin`, eliminując błędy protokołów HTTP/HTTPS za proxy.
2. **Serwer TUS (`server.ts` & `@tus/server`)**: Odbiera chunki po 5 MB z weryfikacją nagłówków, zapisuje je tymczasowo w `data/tus_temp/`.
3. **Hook Zakończenia (`POST_FINISH`)**: Po skompletowaniu pliku przenosi go do folderu galerii (`/data/galleries/{slug}/raw/`) i dodaje zadanie do kolejki `mediaQueue`.
4. **Kolejka z Throttlingiem (`p-queue`)**:
   - `concurrency: 2` – chroni procesor Intel N100 przed wyczerpaniem zasobów.
   - **Zdjęcia**: `Sharp` odczytuje orientację EXIF i tworzy miniaturę WebP 500x500 px.
   - **Filmy**: `FFmpeg` wycina klatkę z 1. sekundy filmu pod nadzorem watchdoga (25s timeout z `SIGKILL`).
5. **SSE Event Bus (`__wedding_sse_bus__`)**: Emisja zdarzenia `new-media` oraz zapis metadanych w PostgreSQL.

Szczegółowy diagram i parametry znajdziesz w dokumencie [pipeline-architecture.md](./references/pipeline-architecture.md).

---

## 2. Kluczowe Pliki Źródłowe

- `server.ts`: Konfiguracja serwera `@tus/server`, obsługa tras `/api/upload/tus/*` oraz bezpieczne serwowanie `/media-file/*`.
- `src/components/UploaderDrawer.tsx`: Komponent kliencki React z obsługą kolejkowania plików, paskiem postępu i wznawianiem.
- `src/app/api/gallery/[slug]/live/route.ts`: Endpoint SSE subskrybujący zdarzenia z globalnego singletonu `globalThis.__wedding_sse_bus__`.

---

## 3. Typowe Zagadnienia i Rozwiązywanie Problemów

### A. Zdjęcia z iPhone'a obrócone o 90 stopni (Brak orientacji EXIF)
Biblioteka `Sharp` automatycznie koryguje orientację, o ile wywołano metodę `.rotate()` przed resize:
```typescript
await sharp(inputPath)
  .rotate() // Automatyczny odczyt EXIF Orientation
  .resize(500, 500, { fit: "inside", withoutEnlargement: true })
  .webp({ quality: 80 })
  .toFile(thumbPath);
```

### B. Uszkodzone pliki wideo blokujące kolejkę
Jeżeli gość wgra plik z uszkodzonym kontenerem MP4/MOV, FFmpeg mógłby zawiesić się w nieskończonej pętli. Watchdog automatycznie przerywa proces po 25 sekundach:
```typescript
const ffmpegProcess = spawn("ffmpeg", args);
const timer = setTimeout(() => {
  ffmpegProcess.kill("SIGKILL");
}, 25000);
```

### C. Resetowanie widoku Lightbox przy nowym zdjęciu
W `src/components/GalleryGrid.tsx` / `LightboxModal.tsx` indeks aktywnego zdjęcia bazuje na unikalnym identyfikatorze `id` multimedium, a nie jego pozycji w tablicy, co chroni użytkownika przeglądającego powiększone zdjęcie przed nieoczekiwanym przeskokiem przy nadejściu zdarzenia SSE.
