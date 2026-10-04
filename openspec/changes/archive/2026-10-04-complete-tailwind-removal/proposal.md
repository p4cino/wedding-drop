# Proposal

## Why

Podczas rozwiązywania konfliktów po scaleniu gałęzi (w trakcie migracji na Park UI/Panda CSS w commicie `6edd43a`) w 15 plikach frontendu powróciły osierocone klasy z usuniętego frameworka Tailwind CSS. Ponieważ sam Tailwind został ostatecznie usunięty z projektu, komponenty te utraciły swoje style (np. w `UploadFileRow.tsx`, `GalleryTable.tsx` czy `AdminPlaceholderAlert.tsx`). Musimy oczyścić ten dług technologiczny i dokończyć konwersję na poprawny system `css({...})` w Panda CSS. Zmiana jest czysto estetyczna i refaktoryzacyjna (nie modyfikuje samej logiki i zachowań opisanych w specyfikacjach funkcjonalnych).

## What Changes

- Zamiana wszystkich wystąpień klas Tailwind CSS (np. `className="flex items-center gap-3 p-2"`) na odpowiadające im funkcje Panda CSS `css({...})` z użyciem nowo zdefiniowanych tokenów.
- Dotkniętych zostanie 15 zidentyfikowanych plików, w tym:
  - Komponenty przesyłania plików: `UploadFileRow.tsx`, `FilePickerDropzone.tsx`
  - Widoki galerii i panelu: `AdminPlaceholderAlert.tsx`, `GalleryTable.tsx`, `CardPreview.tsx`
  - Wybrane strony: `app/[locale]/admin/page.tsx`, `app/[locale]/g/[slug]/card/page.tsx`, `app/[locale]/~offline/page.tsx` oraz podstrony w `app/[locale]/(legal)/*`
- Usunięcie wszelkich pozostałości po imporcie Tailwind, jeśli przypadkiem wróciły, lub potwierdzenie integracji `globals.css` dla ładowania czystej Pandy.

## Capabilities

### New Capabilities

- Brak.

### Modified Capabilities

- Brak (czysty refaktoryzacyjny zabieg, stąd `skip_specs: true` w `.openspec.yaml`).

## Poza zakresem / Non-goals

- Projektowanie nowych komponentów Park UI.
- Zmiana funkcjonalności biznesowej istniejących komponentów.
- Zmiany w pakietach `packages/db` oraz `packages/media`.

## Impact

- **UI/UX**: Przywrócenie pierwotnego, zamierzonego wyglądu (marginesów, układu, kolorów) we wcześniej popsutych komponentach.
- Brak wpływu na logikę backendu, ograniczenia procesora (Intel N100) lub inne krytyczne polityki bezpieczeństwa.
