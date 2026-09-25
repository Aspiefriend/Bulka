# Базовый образ — Node.js 24 (slim — с базовыми утилитами)
FROM node:24-slim

# Устанавливаем Python и компилятор для better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Рабочая директория
WORKDIR /app

# Копируем зависимости
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --omit=dev

# Копируем проект
COPY . .

# Переменные окружения
ENV PORT=3000
ENV NODE_ENV=production

# Открываем порт
EXPOSE 3000

# Запуск
CMD ["sh", "-c", "node init-db.js && node server.js"]