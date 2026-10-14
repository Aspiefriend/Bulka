# ─── Stage 1: сборка фронта ───
FROM node:24-slim AS client-build

WORKDIR /client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ─── Stage 2: финальный образ ───
FROM node:24-slim

RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Собранный фронт из первой стадии
COPY --from=client-build /client/dist ./client/dist

ENV PORT=3000
ENV NODE_ENV=production
ENV DB_PATH=/app/data/bulka.db

EXPOSE 3000

CMD ["sh", "-c", "node init-db.js && node server.js"]