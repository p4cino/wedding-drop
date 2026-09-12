---
name: wedding-ops
description: >-
  Use this skill when the user asks to manage, deploy, configure, backup, restore, or monitor the WeddingDrop infrastructure, Docker Compose containers, PostgreSQL database, Drizzle ORM migrations, or Caddy reverse proxy with automatic SSL.
---

# WeddingDrop Operations: Zarządzanie Infrastrukturą, Dockerem i Bazą Danych

Ten skill zawiera procedury operacyjne i wdrożeniowe dla aplikacji **WeddingDrop**.

---

## 1. Architektura Kontenerowa (Docker Compose)

Stos produkcyjny składa się z 3 współpracujących kontenerów:
1. **`wedding_postgres`**: Baza danych PostgreSQL 16 Alpine z dedykowanymi indeksami złożonymi i wolumenem `postgres_data`.
2. **`wedding_web`**: Node.js 24 Alpine, Next.js 16 (`apps/web`), serwer TUS, Sharp, FFmpeg z limitem `concurrency: 2` i wolumenem danych `app_data`. Zbudowany z wieloetapowego Dockerfile z wykorzystaniem `turbo prune`.
3. **`wedding_caddy`**: Reverse proxy Caddy v2 z automatycznym certyfikatem HTTPS Let's Encrypt i nagłówkami `noindex`.

Szczegóły sieci i konfiguracji Caddyfile znajdziesz w dokumencie [docker-caddy.md](./references/docker-caddy.md).

---

## 2. Uruchamianie i Zarządzanie Kontenerami

```bash
# Budowanie i uruchamianie całego stosu w tle
docker compose up -d --build

# Sprawdzanie statusu kontenerów
docker compose ps

# Podgląd logów w czasie rzeczywistym
docker compose logs -f web
docker compose logs -f postgres
docker compose logs -f caddy

# Restart pojedynczej usługi
docker compose restart web

# Zatrzymanie wszystkich usług
docker compose down
```

---

## 3. Zarządzanie Bazą Danych i Drizzle ORM

Schemat bazodanowy zdefiniowany jest w `packages/db/src/schema.ts`, a konfiguracja w `packages/db/drizzle.config.ts`.

```bash
# Generowanie plików migracji na podstawie zmian w schema.ts
pnpm --filter @wedding-drop/db db:generate

# Bezpośrednie wdrożenie zmian schematu do aktywnej bazy danych
pnpm --filter @wedding-drop/db db:push

# Bezpośredni dostęp do konsoli psql w kontenerze
docker exec -it wedding_postgres psql -U wedding -d wedding_drop
```

---

## 4. Procedury Kopiowania Zapasowego (Backup & Restore)

Wszystkie istotne dane aplikacji znajdują się w dwóch wolumenach Dockera: `postgres_data` oraz `app_data`.

### Wykonanie Kopii Zapasowej (Backup):
```bash
# 1. Eksport bazy danych PostgreSQL
docker exec -t wedding_postgres pg_dump -U wedding wedding_drop > wedding_backup_$(date +%F).sql

# 2. Archiwizacja fizycznych plików ze zdjęciami i miniaturami
docker run --rm -v wedding-drop_app_data:/data -v $(pwd):/backup alpine tar -czf /backup/media_backup_$(date +%F).tar.gz -C /data .
```

### Odtwarzanie z Kopii Zapasowej (Restore):
```bash
# 1. Odtworzenie bazy danych
cat wedding_backup_YYYY-MM-DD.sql | docker exec -i wedding_postgres psql -U wedding -d wedding_drop

# 2. Przywrócenie plików multimedialnych
docker run --rm -v wedding-drop_app_data:/data -v $(pwd):/backup alpine tar -xzf /backup/media_backup_YYYY-MM-DD.tar.gz -C /data
```

### Opcja zintegrowana przez skrypt TypeScript:
```bash
npx tsx .agents/scripts/ops-helper.ts backup
npx tsx .agents/scripts/ops-helper.ts status
```

---

## 5. Konfiguracja Domeny i Certyfikatu SSL (Caddy)

1. W pliku `.env` ustaw domenę publiczną:
   ```env
   APP_DOMAIN=slub.twojadomena.pl
   ```
2. Upewnij się, że porty 80 i 443 na routerze/serwerze są przekierowane na maszynę z Dockerem.
3. Przeładuj Caddy:
   ```bash
   docker compose restart caddy
   ```
   Caddy automatycznie wygeneruje i odnowi certyfikat SSL z Let's Encrypt lub ZeroSSL.
