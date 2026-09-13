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
# 3. Etap produkcyjny (Minimalny Runner zoptymalizowany pod Intel N100)
FROM node:24-alpine AS runner
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat

# Pobranie statycznie skompilowanego FFmpeg w celu ominięcia setek pakietów i podatności Alpine (CVE)
RUN wget -qO- https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar Jx && \
    cp ffmpeg-*-static/ffmpeg /usr/local/bin/ && \
    cp ffmpeg-*-static/ffprobe /usr/local/bin/ && \
    rm -rf ffmpeg-*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_PATH=/app/node_modules:/app/apps/web/node_modules:/app/apps/web/.next/node_modules

# Kopiowanie wysoce zoptymalizowanego trybu standalone Next.js (tylko to co niezbędne)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/dist ./apps/web/dist

RUN mkdir -p /app/data/galleries /app/data/tus_temp

EXPOSE 3000

# Bezpośrednie uruchomienie serwera bez ciężkiego managera procesów pnpm
# (natychmiastowa obsługa sygnałów SIGTERM i minimalne zużycie RAM na Intel N100)
WORKDIR /app/apps/web
CMD ["node", "dist/server.js"]
