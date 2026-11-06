# Отчет по практическому занятию: Репетиция деплоя проекта «Булка»

## 1. Схема архитектуры проекта

graph TD
Client[Browser] -->|HTTPS 443| Nginx[Nginx]

    subgraph Docker Container: app
        Express[Express API]
        React[React Build]
    end

    Nginx -->|"Проксирует все запросы на порт 3000"| Express
    Express -->|"Отдает статику"| React
    Express -->|"SQL"| DB[(SQLite DB)]
