# Telegram Bot Builder API — API Reference

REST API визуального конструктора Telegram-ботов. Авторизация: сессионная cookie или Bearer PAT. Документация: /admin (вход по ADMIN_API_KEY) → /admin/docs.

**Версия OpenAPI:** 2.2.0.5

> Сгенерировано из OpenAPI spec (`npm run docs:api`). Интерактивная документация: `/admin/docs`.

## Разделы

| Тег | Эндпоинтов |
|-----|------------|
| [admin](./admin.md) | 27 |
| [agent-tokens](./agent-tokens.md) | 3 |
| [auth](./auth.md) | 11 |
| [bot](./bot.md) | 24 |
| [bot-logs](./bot-logs.md) | 1 |
| [bots](./bots.md) | 1 |
| [config](./config.md) | 1 |
| [disabled-node-types](./disabled-node-types.md) | 1 |
| [health](./health.md) | 2 |
| [hooks](./hooks.md) | 5 |
| [launch](./launch.md) | 1 |
| [media](./media.md) | 14 |
| [project-bot](./project-bot.md) | 8 |
| [project-broadcasts](./project-broadcasts.md) | 12 |
| [project-dialogs](./project-dialogs.md) | 5 |
| [project-files](./project-files.md) | 4 |
| [project-groups](./project-groups.md) | 6 |
| [project-messages](./project-messages.md) | 4 |
| [project-tables](./project-tables.md) | 27 |
| [project-tokens](./project-tokens.md) | 30 |
| [project-users](./project-users.md) | 12 |
| [project-versions](./project-versions.md) | 6 |
| [projects](./projects.md) | 23 |
| [server](./server.md) | 1 |
| [setup](./setup.md) | 2 |
| [storage-configs](./storage-configs.md) | 5 |
| [support](./support.md) | 4 |
| [templates](./templates.md) | 9 |
| [tokens](./tokens.md) | 2 |
| [webhook](./webhook.md) | 1 |
| [workers](./workers.md) | 1 |
| [Диалоги](./Диалоги.md) | 3 |

## Авторизация

- **Cookie** — сессия после Telegram Login / Mini App / dev-login (`connect.sid`)
- **Bearer PAT** — персональный токен агента (MCP/CLI)
- **Admin cookie** — `/admin/login` (`ADMIN_API_KEY`)
- Публичные эндпоинты помечены «Публичный»
