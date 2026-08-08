# Telegram Bot Builder API — API Reference

REST API визуального конструктора Telegram-ботов. Авторизация: сессионная cookie или Bearer PAT. Документация: /admin (вход по ADMIN_API_KEY) → /admin/docs.

**Версия OpenAPI:** 2.2.0.5

> Сгенерировано из OpenAPI spec (`npm run docs:api`). Интерактивная документация: `/admin/docs`.

## Разделы

| Тег | Эндпоинтов |
|-----|------------|
| [admin](./admin.md) | 4 |
| [agent-tokens](./agent-tokens.md) | 3 |
| [auth](./auth.md) | 8 |
| [bot](./bot.md) | 24 |
| [bot-folders](./bot-folders.md) | 1 |
| [bot-logs](./bot-logs.md) | 1 |
| [bots](./bots.md) | 2 |
| [config](./config.md) | 1 |
| [database](./database.md) | 1 |
| [health](./health.md) | 1 |
| [launch](./launch.md) | 1 |
| [media](./media.md) | 13 |
| [projects](./projects.md) | 139 |
| [server](./server.md) | 1 |
| [setup](./setup.md) | 2 |
| [storage-configs](./storage-configs.md) | 5 |
| [templates](./templates.md) | 14 |
| [tokens](./tokens.md) | 4 |
| [webhook](./webhook.md) | 1 |
| [workers](./workers.md) | 1 |

## Авторизация

- **Cookie** — сессия после Telegram Login Widget (`connect.sid`)
- **Bearer PAT** — персональный токен агента (MCP/CLI)
- Публичные эндпоинты помечены «Публичный»
