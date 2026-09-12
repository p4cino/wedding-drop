FROM node:22-alpine AS base

# Instalacja FFmpeg i narzędzi wymaganych do obróbki wideo i natywnych modułów
RUN apk add --no-cache ffmpeg libc6-compat python3 make g++

WORKDIR /app

# Kopiowanie zależności
COPY package.json ./
RUN npm install

# Kopiowanie kodu źródłowego i konfiguracji testów
COPY tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs drizzle.config.ts server.ts vitest.config.ts playwright.config.ts ./
COPY src ./src
COPY tests ./tests
COPY e2e ./e2e

# Budowa produkcyjna Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Folder na dane
RUN mkdir -p /app/data/galleries /app/data/tus_temp

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["npm", "run", "start"]
