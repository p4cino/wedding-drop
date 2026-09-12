# Architektura Sieciowa i Konfiguracja Caddy / Docker

## 1. Topologia Kontenerów (`docker-compose.yml`)

```text
[Internet / Goście weselni]
           │
           ▼ Porty 80 & 443
┌────────────────────────────────────────┐
│  wedding_caddy (Caddy v2 Alpine)       │
│  - Automatyczny TLS Let's Encrypt      │
│  - X-Robots-Tag: noindex, nofollow     │
│  - flush_interval -1 (SSE live stream) │
└───────────────────┬────────────────────┘
                    │ Sieć wewnętrzna: wedding_net
                    ▼ Port 3000
┌────────────────────────────────────────┐
│  wedding_web (Next.js 14 + Node HTTP)  │
│  - App Router & API                    │
│  - TUS Server 1.0.0                    │
│  - Media Queue (PQueue Concurrency: 2) │
│  - Wolumen: /app/data                  │
└───────────────────┬────────────────────┘
                    │ Sieć wewnętrzna: wedding_net
                    ▼ Port 5432
┌────────────────────────────────────────┐
│  wedding_postgres (PostgreSQL 16)      │
│  - Drizzle ORM tables & indexes        │
│  - Wolumen: postgres_data              │
└────────────────────────────────────────┘
```

---

## 2. Kluczowe Ustawienia Caddyfile

1. **Brak buforowania strumienia SSE**:
   Dla ścieżki `/api/gallery/*/live` ustawiony jest parametr `flush_interval -1`, co gwarantuje natychmiastowe wysyłanie ramek Server-Sent Events do telefonów gości bez opóźnień wprowadzanych przez bufor Caddy.
2. **Nagłówki Ochrony Prywatności**:
   ```caddyfile
   header {
       X-Robots-Tag "noindex, nofollow, noarchive, nosnippet"
       -Server
   }
   ```
3. **Obsługa Dużych Plików (TUS Chunked Upload)**:
   Limit rozmiaru pojedynczego żądania HTTP w Caddy jest dostosowany do chunków TUS (domyślnie 5 MB per chunk, co pozwala na płynne przesyłanie plików wideo o rozmiarach wielu gigabajtów).
