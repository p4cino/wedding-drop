# Proposal

## Why

Podczas migracji z Tailwind CSS do Panda CSS (w ramach poprzedniej zmiany) uszkodzono układ i wygląd interfejsu panelu do konfiguracji "Karteczki na Stolik". Elementy sterujące kolorami tekstu/QR i złotej ramki stały się pionowo ściśnięte i nieestetyczne. Naprawa układu formularzy oraz wizualnych elementów (swatche kolorów) jest konieczna dla przywrócenia poprawnego UX ("Rozjebany jest panel customizacji kartki").

## What Changes

- Naprawa klas CSS (Panda) w panelu wyboru opcji karteczki.
- Przywrócenie proporcji etykiet tekstowych, elementów radio, oraz wejść dla kolorów w formularzu.
- Zapewnienie, że swatche kolorów tekstowych oraz kółeczka nie są ściśnięte ani zniekształcone.
- **skip_specs: true**: Ta zmiana to wyłącznie poprawka wizualna do istniejącej logiki biznesowej; specyfikacja wymagań biznesowych (scenariusze, akcje) się nie zmienia.

## Capabilities

### New Capabilities
- Brak

### Modified Capabilities
- Brak

## Poza zakresem (Non-goals)
- Modyfikacja mechaniki generowania samej kartki PDF.
- Przebudowa logiki state'u konfiguratora.
- Zmiany w widoku dla gości.

## Impact

- Poprawki w pliku / komponentach interfejsu panelu admina związanych z konfiguracją kartki (`CardCustomizer` / `CardPreview` / itd).
- Brak wpływu na ograniczenia Intel N100 (concurrency, FFmpeg, ZIP), jako że modyfikowany jest tylko CSS UI.
