# 1. Etap przycinania monorepo (Turborepo Pruner)
FROM node:24-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @wedding-drop/web --docker

# 2. Etap instalacji zależności i budowy aplikacji
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++ ffmpeg
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Kopiowanie wyodrębnionych definicji pakietów
COPY --from=pruner /app/out/json/ .
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile

# Kopiowanie kodu źródłowego
COPY --from=pruner /app/out/full/ .
COPY packages/db/migrations ./packages/db/migrations
COPY turbo.json turbo.json
COPY biome.json biome.json

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Budowa produkcyjna Next.js przez pnpm / Turborepo
RUN pnpm --filter @wedding-drop/web build

# Odchudzenie warstwy /app przed przekopiowaniem do runnera
# 1. Usunięcie narzędzi developerskich z node_modules
RUN pnpm install --prod --ignore-scripts --prefer-offline
# 2. Usunięcie masywnych folderów z pamięcią podręczną
RUN rm -rf \
    .turbo \
    node_modules/.cache \
    apps/web/.next/cache \
    packages/*/.turbo \
    packages/*/node_modules/.cache

# 3. Etap produkcyjny (Minimalny Runner zoptymalizowany pod Intel N100)
FROM node:24-alpine AS runner
RUN apk add --no-cache ffmpeg libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app ./

RUN mkdir -p /app/data/galleries /app/data/tus_temp

EXPOSE 3000

# Bezpośrednie uruchomienie serwera bez ciężkiego managera procesów pnpm
# (natychmiastowa obsługa sygnałów SIGTERM i minimalne zużycie RAM na Intel N100)
WORKDIR /app/apps/web
CMD ["npx", "tsx", "server.ts"]
