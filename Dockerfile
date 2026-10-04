# 1. Etap przycinania monorepo (Turborepo Pruner)
FROM node:24-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @wedding-drop/web --docker

# 2. Etap instalacji WSZYSTKICH zależności i budowy aplikacji
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++ ffmpeg
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Kopiowanie wyodrębnionych definicji pakietów
COPY --from=pruner /app/out/json/ .
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile --ignore-scripts

# Kopiowanie kodu źródłowego
COPY --from=pruner /app/out/full/ .
COPY packages/db/migrations ./packages/db/migrations
COPY turbo.json turbo.json
COPY biome.json biome.json

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SERWIST_SUPPRESS_TURBOPACK_WARNING=1

# Budowa produkcyjna Next.js przez pnpm / Turborepo
RUN pnpm --filter @wedding-drop/web build

# 3. Etap instalacji TYLKO zależności produkcyjnych
FROM node:24-alpine AS prod-deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=pruner /app/out/json/ .
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# 4. Etap produkcyjny (Minimalny Runner zoptymalizowany pod Intel N100)
FROM node:24-alpine AS runner
# ffmpeg z apk (nie statyczny binarny z johnvansickle.com) - ten host throttluje/blokuje
# zapytania z adresow IP hostowanych runnerow CI (w tym GitHub Actions).
# Usuwamy zbędne globalne pakiety npm/yarn oraz czyścimy cache apk, aby usunąć podatności.
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat ffmpeg su-exec && \
    rm -rf /usr/local/lib/node_modules/npm /opt/yarn* /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn* /var/cache/apk/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0

# Kopiowanie node_modules (tylko produkcyjne) z uprawnieniami node:node
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=prod-deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --chown=node:node --from=prod-deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --chown=node:node --from=prod-deps /app/packages/media/node_modules ./packages/media/node_modules

# Kopiowanie wygenerowanych plików aplikacji
COPY --chown=node:node --from=builder /app/apps/web/.next/standalone/apps/web/server.js ./apps/web/
COPY --chown=node:node --from=builder /app/apps/web/.next/standalone/apps/web/.next ./apps/web/.next
COPY --chown=node:node --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --chown=node:node --from=builder /app/apps/web/public ./apps/web/public
COPY --chown=node:node --from=builder /app/apps/web/dist ./apps/web/dist
COPY --chown=node:node --from=builder /app/packages/db/migrations ./packages/db/migrations
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Przygotowanie katalogów danych z uprawnieniami dla nieuprzywilejowanego użytkownika node
RUN mkdir -p /app/data/galleries /app/data/tus_temp && \
    chown -R node:node /app/data

# Start jako root tylko po to, by entrypoint naprawil wlasciciela wolumenu /app/data
# (stare wolumeny maja pliki roota) i zrzucil uprawnienia do uzytkownika node (su-exec).
EXPOSE 3000

WORKDIR /app/apps/web
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
