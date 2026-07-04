# Telegram Bot Builder API — API Reference

REST API визуального конструктора Telegram-ботов. Авторизация: сессионная cookie или Bearer PAT. Документация: /admin (вход по ADMIN_API_KEY) → /admin/docs.

**Версия OpenAPI:** 2.2.0

> Сгенерировано из OpenAPI spec (`npm run docs:api`). Интерактивная документация: `/admin/docs`.

## Разделы

| Тег | Эндпоинтов |
|-----|------------|
| [agent-tokens](./agent-tokens.md) | 3 |
| [auth](./auth.md) | 5 |
| [bot](./bot.md) | 24 |
| [bot-folders](./bot-folders.md) | 1 |
| [bot-logs](./bot-logs.md) | 1 |
| [bots](./bots.md) | 1 |
| [config](./config.md) | 1 |
| [database](./database.md) | 16 |
| [google-auth](./google-auth.md) | 2 |
| [health](./health.md) | 1 |
| [launch](./launch.md) | 1 |
| [media](./media.md) | 13 |
| [projects](./projects.md) | 147 |
| [push-to-github](./push-to-github.md) | 1 |
| [root](./root.md) | 1 |
| [server](./server.md) | 1 |
| [settings](./settings.md) | 1 |
| [setup](./setup.md) | 2 |
| [storage-configs](./storage-configs.md) | 5 |
| [telegram-auth](./telegram-auth.md) | 12 |
| [telegram-client](./telegram-client.md) | 1 |
| [telegram-settings](./telegram-settings.md) | 1 |
| [templates](./templates.md) | 16 |
| [tokens](./tokens.md) | 4 |
| [user](./user.md) | 12 |
| [users](./users.md) | 5 |
| [webhook](./webhook.md) | 1 |
| [workers](./workers.md) | 1 |

## Авторизация

- **Cookie** — сессия после Telegram Login Widget (`connect.sid`)
- **Bearer PAT** — персональный токен агента (MCP/CLI)
- Публичные эндпоинты помечены «Публичный»
