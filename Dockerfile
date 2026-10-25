# 1. Etap przycinania monorepo (Turborepo Pruner)
FROM node:24-alpine AS pruner
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @wedding-drop/web --docker

# 2. Etap instalacji WSZYSTKICH zależności i budowy aplikacji
FROM node:24-alpine AS builder
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

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

# 3. Etap instalacji TYLKO zależności produkcyjnych i oczyszczenia artefaktów czasu budowy
FROM node:24-alpine AS prod-deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
COPY --from=pruner /app/out/json/ .
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    rm -rf node_modules/.pnpm/@next+swc-* \
           node_modules/.pnpm/@swc+core-* \
           node_modules/.pnpm/next-intl-swc-plugin-* \
           node_modules/.pnpm/playwright* \
           node_modules/.pnpm/@playwright* \
           node_modules/.pnpm/@types+* \
           node_modules/.pnpm/lucide-react* \
           node_modules/.pnpm/@ark-ui* \
           node_modules/.pnpm/caniuse-lite* \
           node_modules/.pnpm/next@*/node_modules/next/dist/esm \
           node_modules/.pnpm/next@*/node_modules/next/dist/docs \
           node_modules/.pnpm/next@*/node_modules/next/dist/bundle-analyzer \
           node_modules/.pnpm/next@*/node_modules/next/dist/next-devtools \
           node_modules/.pnpm/next@*/node_modules/next/dist/compiled/react-dom-experimental && \
    find node_modules \( -name "*.map" -o -name "*.d.ts" -o -name "*.d.mts" -o -name "*.runtime.dev.js" \) -delete

# 4. Etap produkcyjny (Minimalny Runner zoptymalizowany pod Intel N100, 0 CVE w Docker Scout)
FROM node:24-alpine AS runner
# Aktualizacja pakietów systemowych i biblioteki musl (>= 1.2.6-r6, CVE-2026-107891)
# oraz usunięcie menedżerów pakietów npm/yarn/corepack zbędnych w runtime.
RUN apk update && apk upgrade --no-cache && \
    apk upgrade --no-cache --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main musl musl-utils && \
    apk add --no-cache libc6-compat su-exec && \
    rm -rf /usr/local/lib/node_modules /opt/yarn* /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn* /usr/local/bin/corepack /var/cache/apk/*

# Statyczna binarka FFmpeg z obrazu mwader/static-ffmpeg (Docker Hub)
# - brak throttlingu johnvansickle.com na GitHub Actions
# - brak 80+ dynamicznych bibliotek z apk add ffmpeg (cjson, libxml2, libsndfile, libvpx, librav1e, libdovi) -> 0 CVE w Docker Scout
COPY --from=mwader/static-ffmpeg:latest /ffmpeg /usr/local/bin/ffmpeg

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0

# Kopiowanie node_modules (tylko produkcyjne, oczyszczone z kompilatorów czasu budowy)
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
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    mkdir -p /app/data/galleries /app/data/tus_temp && \
    chown -R node:node /app/data

# Start jako root tylko po to, by entrypoint naprawil wlasciciela wolumenu /app/data
# (stare wolumeny maja pliki roota) i zrzucil uprawnienia do uzytkownika node (su-exec).
EXPOSE 3000

WORKDIR /app/apps/web
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
