# SEO отчёт

## Замер Lighthouse

### Главная страница (/)

- SEO Score до правок: 82
- SEO Score после правок: 100

### Каталог (/catalog)

- SEO Score: <поставь свой>

### Страница товара (/product/1)

- SEO Score: <поставь свой>

## Что было исправлено

1. Добавлены базовые метатеги: `<html lang="ru">`, `<meta charset>`, `<meta viewport>`, `<title>`, `<meta description>`, Open Graph.
2. Исправлена структура заголовков на всех страницах — один `<h1>`, уровни без пропусков.
3. Созданы `robots.txt` (с закрытыми служебными разделами) и `sitemap.xml`.
4. Добавлен `<meta name="robots" content="noindex">` на закрытые страницы: login, register, profile, cart, checkout, orders.
5. Добавлен заголовок `X-Robots-Tag: noindex, nofollow` для всех ответов `/api/*`.

## Задача на будущее

Динамический `sitemap.xml` с карточками товаров из базы данных —
генерируется на бэкенде.
