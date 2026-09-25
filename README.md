# 🥖 Булка

Интернет-магазин булочной «Булка» — учебный проект.

## 📋 О проекте

Веб-приложение для заказа свежей выпечки с доставкой.

**Стек:**
- **Backend:** Node.js + Express
- **БД:** SQLite (better-sqlite3)
- **Frontend:** HTML + CSS + JavaScript *(в разработке)*

## 🗂 Структура БД

9 таблиц:

- `users` — пользователи
- `addresses` — адреса доставки
- `categories` — категории товаров
- `products` — товары
- `orders` — заказы
- `order_items` — позиции заказов
- `reviews` — отзывы
- `favorites` — избранное
- `notifications` — уведомления

## 🚀 Запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Создание БД

```bash
node init-db.js
```

### 3. Запуск сервера

```bash
node server.js
```

Сервер: http://localhost:3000

## 📡 API

| Метод | URL | Описание |
|---|---|---|
| GET | `/` | Информация о API |
| GET | `/api/categories` | Все категории |
| GET | `/api/products` | Все товары |
| GET | `/api/products/:id` | Один товар |

## 📝 Автор

**Караблин Иван**

- НАТК им. Б.C.Галущака
- Специальность: «Информационные системы и программирование»

## 🐳 Docker

### Сборка и запуск локально

Собрать образ из Dockerfile:

```bash
docker build -t bulka .
```

Запустить контейнер:

```bash
docker run --rm -p 3000:3000 bulka
```

### Запуск готового образа из GHCR

Скачать готовый образ из GitHub Container Registry:

```bash
docker pull ghcr.io/aspiefriend/bulka:latest
```

Запустить:

```bash
docker run --rm -p 3000:3000 ghcr.io/aspiefriend/bulka:latest
```

### Проверка

После запуска открой в браузере:

http://localhost:3000/api/products

## 🔄 CI/CD

Проект использует GitHub Actions для автоматизации:

- Тесты — проверка синтаксиса при push в main и pull request
- Сборка — автоматическая сборка Docker-образа
- Публикация — образ публикуется в GitHub Container Registry

Файл workflow: .github/workflows/build.yml

## 📄 Лицензия

Учебный проект — 2026