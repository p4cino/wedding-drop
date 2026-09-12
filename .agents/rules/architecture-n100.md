# Reguły Architektoniczne: Optymalizacja pod Procesor Intel N100

Procesor **Intel N100** (lub zbliżone jednostki energooszczędne, np. N95, N200) posiada wyłącznie 4 energooszczędne rdzenie Gracemont bez technologii Hyper-Threading. Niewłaściwe zarządzanie współbieżnością procesów graficznych lub wideo może doprowadzić do 100% obciążenia CPU (starvation), zablokowania obsługi ruchu sieciowego HTTP dla gości weselnych oraz ubicia kontenera przez systemowy OOM Killer.

---

## 1. Ograniczenie Współbieżności Kolejki (`p-queue`)

- Wszelka asynchroniczna obróbka multimediów wywoływana z poziomu hooka TUS `POST_FINISH` musi trafiać do globalnej kolejki `p-queue`.
- Maksymalna dopuszczalna współbieżność to **`concurrency: 2`**.
- Nigdy nie modyfikuj wartości współbieżności w górę bez wyraźnego polecenia użytkownika i testów obciążeniowych.

```typescript
// Prawidłowy wzorzec w kodzie:
const mediaQueue = new PQueue({ concurrency: 2 });
```

---

## 2. Watchdog FFmpeg (25s Timeout & SIGKILL)

- Pliki wideo przesyłane z telefonów mogą być uszkodzone, niedokończone lub posiadać egzotyczne kodeki powodujące zapętlenie FFmpeg.
- Każde wywołanie procesu `ffmpeg` (np. wycięcie klatki miniatury) **musi** być objęte twardym limitem czasowym (watchdog) wynoszącym maksymalnie **25 sekund**.
- W przypadku przekroczenia czasu proces potomny musi zostać bezwzględnie ubity sygnałem `SIGKILL` (`kill("SIGKILL")`), a błąd zarejestrowany w logach bez przerywania działania serwera.

---

## 3. Strumieniowanie Archiwów ZIP (`archiver`)

- Galerie ślubne mogą zawierać dziesiątki gigabajtów zdjęć i filmów.
- Przy generowaniu archiwum ZIP (np. w endpointach `/api/gallery/:slug/zip`):
  - **ZAKAZ**: Tworzenia tymczasowych plików ZIP na dysku lub buforowania całego archiwum w pamięci RAM (`Buffer`).
  - **NAKAZ**: Strumieniowania pakietów bezpośrednio z dysku do odpowiedzi HTTP (`res.setHeader('Transfer-Encoding', 'chunked')`, `archive.pipe(res)`).
  - Prawidłowo obsługuj zdarzenia błędów strumienia (`archive.on('error', ...)`) oraz przedwczesne rozłączenie klienta (`req.on('close', ...)`).

---

## 4. Oszczędność Pamięci RAM i Wolumenu

- Miniatury zdjęć generowane przez bibliotekę `Sharp` powinny być skalowane do formatu **WebP** z ograniczeniem wymiarów (np. 500x500 px z zachowaniem proporcji) oraz kompresją jakościową na poziomie 80-85%.
- Tymczasowe chunki TUS w katalogu `tus_temp` muszą być czyszczone po zakończeniu uploadu (`POST_FINISH`).
