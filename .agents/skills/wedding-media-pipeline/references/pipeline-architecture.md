# Szczegółowy Przepływ Potoku Multimediów (Media Pipeline)

```mermaid
sequenceDiagram
    autonumber
    participant Guest as Gość (UploaderDrawer.tsx)
    participant Caddy as Caddy Proxy
    participant Tus as Serwer TUS (server.ts)
    participant Disk as Wolumen /app/data
    participant Queue as PQueue (Limit = 2)
    participant Workers as Sharp / FFmpeg (Watchdog 25s)
    participant DB as PostgreSQL (Drizzle)
    participant SSE as SSE Event Bus
    participant OtherGuests as Inni Goście (Live Gallery)

    Guest->>Caddy: Upload TUS chunk (5MB)
    Caddy->>Tus: Proxy do /api/upload/tus/*
    Tus->>Disk: Zapis w tus_temp/
    Tus-->>Guest: 204 No Content / Upload-Offset
    
    Note over Guest,Tus: Plik w całości przesłany
    Tus->>Disk: Przeniesienie tus_temp -> galleries/{slug}/raw/
    Tus->>Queue: Dodaj zadanie obróbki (concurrency: 2)
    
    activate Queue
    Queue->>Workers: Konwersja miniatury WebP
    Workers->>Disk: Zapis w galleries/{slug}/thumbs/
    Workers->>DB: INSERT into media_items (storage_path, thumb_path, status: 'ready')
    Workers->>SSE: Emit 'new-media' (gallery_slug, media_id)
    deactivate Queue

    SSE->>OtherGuests: Server-Sent Events push
    OtherGuests->>OtherGuests: Renderuj nowy kafelek (Masonry Grid)
```

---

## Parametry Techniczne

| Element | Wartość | Cel |
|---|---|---|
| Rozmiar chunka TUS | 5 MB (`5 * 1024 * 1024`) | Optymalny transfer przez niestabilne Wi-Fi/LTE |
| Limit współbieżności | 2 zadania równoległe | Ochrona 4 rdzeni procesora Intel N100 |
| Timeout FFmpeg | 25 sekund (`SIGKILL`) | Zabezpieczenie przed zapętleniem uszkodzonych plików |
| Format miniatury | WebP, jakość 80 | Zmniejszenie transferu danych gości |
| Wymiary miniatury | max 500x500 px | Szybkie renderowanie na urządzeniach mobilnych |
| Fallback polling | 1s, 2.5s, 5s | Cicha weryfikacja w tle na wypadek przerwania SSE |
