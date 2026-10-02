/**
 * @fileoverview Авторизация Bot Manager API (`/api/bot/*` + PAT bot_manager)
 *
 * Как Studio управляется из Telegram-бота без дыры «любой telegram_id в query».
 * Контракт API: `docs/api/bot.md` (генерация через `npm run docs:api`).
 */

# Bot Manager API: PAT и actor

## Зачем

Шаблон **Bot Manager** управляет проектами Studio из Telegram: список проектов, токены, пользователи, импорт.

Раньше хендлеры `/api/bot/*` часто брали личность из query `telegram_id` — это было удобно боту, но небезопасно: любой залогиненный мог подставить чужой id.

Теперь личность всегда из **сессии или Bearer PAT**, а `telegram_id` — только «от чьего имени», с жёсткими правилами.

## Модель доступа

| Кто звонит | Actor (от чьего имени действие) |
|------------|----------------------------------|
| Session cookie `connect.sid` | `req.user.id`. Query `telegram_id`, если есть, **обязан совпасть**, иначе **403** |
| Обычный PAT (`read` / `read,write`) | То же: только свой id |
| PAT со scope **`bot_manager`** | Query `telegram_id` **обязателен** и становится actor (impersonation для Bot Manager) |

Без session/PAT → **401**.  
Доступ к проекту/токену проверяется уже для **actor** (`hasProjectAccess`).

## Как настроить Bot Manager

1. Создать PAT со scope `bot_manager` (в development может любой залогиненный; в production — только id из `BOT_MANAGER_ADMIN_IDS`):

```bash
curl -s -X POST http://localhost:5000/api/agent-tokens -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"label":"bot-manager","scopes":"read,write,bot_manager"}'
```

Сохранить секрет `mcp_…` (показывается один раз).

2. На сервере Studio в `.env`:

```env
STUDIO_BOT_MANAGER_TOKEN=mcp_...
# без этого бот не увидит переменную сервера ни в os.environ, ни через ${{…}}
WORKER_ENV_PASSTHROUGH=STUDIO_BOT_MANAGER_TOKEN
# production:
# BOT_MANAGER_ADMIN_IDS=123456789
```

3. В env бота Bot Manager (карточка токена → переменные):

```text
STUDIO_BOT_MANAGER_TOKEN=${{STUDIO_BOT_MANAGER_TOKEN}}
```

`${{…}}` подставляется при генерации `.env` бота только для имён из `WORKER_ENV_PASSTHROUGH`, не попавших в denylist (`server/bots/botEnvPolicy.ts`, см. [WORKER_DOCKER.md](../deployment/WORKER_DOCKER.md#серверные-переменные-и-боты-все-режимы)).

4. Перезапустить бота. HTTP-ноды шаблона шлют:

```http
Authorization: Bearer {STUDIO_BOT_MANAGER_TOKEN}
```

и `?telegram_id={user_id}` из апдейта Telegram.

## UI Studio

Часть UI всё ещё ходит в `/api/bot/...` (import проекта, collaborators) с cookie и **своим** `telegram_id` — это ок: actor = залогиненный пользователь.

Env-секреты в UI — через `/api/projects/.../env-variables`, не через `/api/bot/.../env`.

## Связанные файлы

| Что | Где |
|-----|-----|
| Middleware actor | `server/middleware/bot-api-actor.ts` |
| Маршруты `/api/bot/*` | `server/routes/setupUserProjectAndTokenRoutes.ts` |
| Шаблон | `server/templates/bot-manager.json` |
| OpenAPI | `docs/api/bot.md`, тег `bot` |
| Тесты | `server/middleware/bot-api-actor.test.ts` |

## См. также

- [Авторизация Studio](./studio-auth.md)
- [Agent tokens (API)](../api/agent-tokens.md)
- [Bot API (OpenAPI)](../api/bot.md)
- [Роадмап сценария Bot Manager](../futures/features/bot-manager-scenario-roadmap.md)
