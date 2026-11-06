# ─── Stage 1: сборка фронта ───
FROM node:24-slim AS client-build

WORKDIR /client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_YMAPS_APIKEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_YMAPS_APIKEY=$VITE_YMAPS_APIKEY
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
RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

CMD ["sh", "-c", "node db/init-db.js && node server.js"]