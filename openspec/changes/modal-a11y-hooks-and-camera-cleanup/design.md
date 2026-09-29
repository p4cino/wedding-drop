# Design

## Context

Lightbox ma kompletną implementację: zapamiętanie `document.activeElement`, pętla Tab, Escape, strzałki, swipe (`LightboxModal.tsx` ok. l. 44-129). Pozostałe modale mają tylko Escape (i to własną kopię). Test `LightboxModal.test.tsx` (337 linii) już pokrywa focus trap, więc logika może zostać przeniesiona zachowując testy.

## Goals / Non-Goals

**Goals:**
- Jedna, przetestowana implementacja każdego zachowania; brak regresji w lightboxie.

**Non-Goals:**
- Zewnętrzna biblioteka do modali, zmiana wyglądu.

## Decisions

- **`useFocusTrap(ref, isActive)`:** przy aktywacji zapisuje `document.activeElement`, przenosi fokus do pierwszego fokusowalnego elementu (selektor jak w lightboxie), nasłuchuje `keydown` Tab i zapętla; przy dezaktywacji/odmontowaniu przywraca fokus. Nasłuch na kontenerze, nie na `document`, gdzie to możliwe.
- **`useEscapeKey(isActive, onEscape)`:** pojedynczy listener na `document` zależny od `isActive`; warunek blokujący (`!isUploading`, `!exportLoading`) przekazywany przez `isActive`/callback.
- **`useSwipe({ onLeft, onRight, threshold })`:** zwraca `onTouchStart/Move/End`; próg taki jak dziś.
- **Kamera:** `stopStream()` (`streamRef.current?.getTracks().forEach(t => t.stop())`) wołane w gałęzi `catch` migawki i przy każdym `setStatus("error")`; cleanup efektu zostaje jako zabezpieczenie (idempotentne).
- **`video.play`:** w `tests/setup.ts` `HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)` (tylko w środowisku z `window`), a kod produkcyjny woła `await video.play()` w `try/catch` dla realnych odrzuceń autoplay.
- **`isCameraSupported()`** w `lib/photobooth.ts`: `typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia`.
- **Prywatność:** obraz z kamery pozostaje w przeglądarce do momentu wyboru „Wyślij do galerii"; zatrzymanie strumienia przy błędzie ogranicza czas aktywności kamery.

## Risks / Trade-offs

- [Ryzyko: focus trap w drawerze konfliktuje z dynamiczną zawartością (kolejka plików)] → Mitigacja: lista fokusowalnych elementów obliczana przy każdym Tab, nie raz przy montowaniu.
- [Ryzyko: regresja lightboxa] → Mitigacja: istniejące testy focus trap/Escape/swipe muszą przejść bez zmian asercji; dopiero potem usuwamy starą logikę.
- [Ryzyko: mock `play` w setup zaburza inne testy] → Mitigacja: mock wyłącznie na prototypie w środowisku jsdom, uruchomienie pełnego zestawu testów.
