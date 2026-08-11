# project-tokens

Эндпоинтов: **28**

### `GET` /api/projects/{id}/tokens

Список токенов (masked + botId)

**Авторизация:** Cookie (`connect.sid`)

`toPublicBotToken` + `botId` (префикс до `:`). Секреты вырезаны.

**Auth:** опционально `getOwnerIdFromRequest` — если сессия/PAT есть, проверяет `hasProjectAccess` (403/404); без auth всё равно отдаёт список.

**Клиент:** панель токенов проекта.

```bash
curl -s http://localhost:5000/api/projects/42/tokens -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив публичных токенов |
| 401 | Глобальный requireApiAuth (если включён) |
| 403 | Нет доступа (только при наличии ownerId) |
| 404 | Проект не найден (при auth) |

#### Пример ответа `200`

```json
[
  {
    "id": 7,
    "projectId": 42,
    "ownerId": 123456789,
    "name": "Основной бот",
    "token": "7123456789:••••••••",
    "isDefault": 1,
    "isActive": 1,
    "botUsername": "my_bot",
    "botFirstName": "My Bot",
    "messagesRetentionDays": 60,
    "autoRestart": 0,
    "maxRestartAttempts": 3,
    "logLevel": "WARNING",
    "protectContent": 0,
    "saveIncomingMedia": 0,
    "catchAllHandlers": 1,
    "contentCache": 1,
    "launchMode": "polling",
    "webhookBaseUrl": null,
    "webhookSecretToken": null,
    "userbotEnabled": 0,
    "userbotApiId": null,
    "userbotApiHash": null,
    "userbotSessionString": null,
    "botId": "7123456789"
  }
]
```

### `POST` /api/projects/{id}/tokens

Создать токен (или вернуть дубликат)

**Авторизация:** Cookie (`connect.sid`)

`insertBotTokenSchema`. `ownerId` из body игнорируется (сессия / owner проекта). При отсутствии `botUsername` — auto getMe. Дубликат того же `token` → **200** full. Новый → **201** full + WS `token-created`.

**Риск:** ответ содержит **сырой** Telegram token.

**Auth:** опционально `getOwnerIdFromRequest` + `hasProjectAccess` при сессии.

**Клиент:** модалка добавления бота.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tokens -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"name":"Основной","token":"7123…:AAH…"}'
```

**Тело запроса:** `CreateBotTokenBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Дубликат — существующая запись (полный token) |
| 201 | Создан (полный token) |
| 400 | Zod validation |
| 401 | Глобальный requireApiAuth |
| 403 | Нет доступа (при auth) |
| 404 | Проект не найден (при auth) |

#### Пример ответа `201`

```json
{
  "id": 7,
  "projectId": 42,
  "name": "Основной",
  "token": "7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
  "botUsername": "my_bot"
}
```

### `PUT` /api/projects/{id}/tokens/{tokenId}

Обновить токен (masked ответ)

**Авторизация:** Cookie (`connect.sid`)

`insertBotTokenSchema.partial()`. Маскированный/`••••` token **игнорируется** (`isMaskedOrPlaceholderToken`). Ответ — `toPublicBotToken`. WS `token-updated` (source=api).

**Auth:** опционально `getOwnerIdFromRequest` + `hasProjectAccess`; при auth также сверка `token.projectId`.

**Клиент:** редактирование карточки токена.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7 -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"name":"Новое имя"}'
```

**Тело запроса:** `UpdateBotTokenBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Публичный токен |
| 400 | Zod validation |
| 401 | Глобальный requireApiAuth |
| 403 | Нет доступа (при auth) |
| 404 | Проект/токен не найден |

#### Пример ответа `200`

```json
{
  "id": 7,
  "projectId": 42,
  "ownerId": 123456789,
  "name": "Основной бот",
  "token": "7123456789:••••••••",
  "isDefault": 1,
  "isActive": 1,
  "botUsername": "my_bot",
  "botFirstName": "My Bot",
  "messagesRetentionDays": 60,
  "autoRestart": 0,
  "maxRestartAttempts": 3,
  "logLevel": "WARNING",
  "protectContent": 0,
  "saveIncomingMedia": 0,
  "catchAllHandlers": 1,
  "contentCache": 1,
  "launchMode": "polling",
  "webhookBaseUrl": null,
  "webhookSecretToken": null,
  "userbotEnabled": 0,
  "userbotApiId": null,
  "userbotApiHash": null,
  "userbotSessionString": null
}
```

### `PUT` /api/projects/{id}/tokens/{tokenId}/bot-info

Обновить name/description бота в Telegram

**Авторизация:** Cookie (`connect.sid`)

Body `{ field, value }`. `field`: `name` → setMyName, `description` → setMyDescription, `shortDescription` → setMyShortDescription. Пишет в локальную БД после успеха Telegram.

**Auth:** `requireTokenOwnership` (владелец/collaborator + сверка projectId).

**Клиент:** настройки профиля бота.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/bot-info -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"field":"name","value":"Новое имя"}'
```

**Тело запроса:** `BotInfoUpdateRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлено |
| 400 | Нет field/value / Invalid field / Telegram error |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Токен не найден в проекте |

#### Пример ответа `200`

```json
{
  "success": true,
  "field": "name",
  "value": "Новое имя"
}
```

### `GET` /api/projects/{id}/tokens/first

Дефолтный токен для codegen (.env)

**Авторизация:** Cookie (`connect.sid`)

Дефолтный токен проекта (`getDefaultBotToken`, иначе любой). Ответ: `{ hasToken, id, token }` — **сырой** Telegram token + id.

**Риск:** не логировать тело. `Cache-Control: no-store`.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** `use-code-generator` (BOT_TOKEN + env-variables по `id`).

```bash
curl -s http://localhost:5000/api/projects/42/tokens/first -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сырой token + id, или hasToken=false |
| 400 | Невалидный id проекта |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
{
  "hasToken": true,
  "id": 7,
  "token": "7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
}
```

### `GET` /api/projects/{id}/tokens/list

Безопасный whitelist список токенов

**Авторизация:** Cookie (`connect.sid`)

Только `BotTokenListItem` (без token и прочих секретов). MCP/агенты.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** MCP `db_list_bot_tokens` (не UI; UI — `GET …/tokens`).

```bash
curl -s http://localhost:5000/api/projects/42/tokens/list -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Whitelist-массив |
| 400 | Невалидный id |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
[
  {
    "id": 7,
    "name": "Основной бот",
    "botUsername": "my_bot",
    "botFirstName": "My Bot",
    "isDefault": 1,
    "isActive": 1,
    "projectId": 42,
    "messagesRetentionDays": 60
  }
]
```

### `POST` /api/projects/{id}/tokens/parse

Распарсить bot token через Telegram getMe

**Авторизация:** Cookie (`connect.sid`)

Body `{ token }`. Вызывает `getMe`, `getMyDescription`, `getMyShortDescription`, опционально фото. **Нет** middleware `requireProjectAccess` / ownership — только глобальный `requireApiAuth` (если включён). `:id` в URL не влияет на Telegram.

**Клиент:** форма добавления токена (превью @username).

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tokens/parse -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"token":"7123…:AAH…"}'
```

**Тело запроса:** `ParseTokenRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Поля бота для формы |
| 400 | Нет token / Invalid bot token |
| 500 | Сеть / Telegram недоступен |

#### Пример ответа `200`

```json
{
  "botFirstName": "My Bot",
  "botUsername": "my_bot",
  "botDescription": "Описание бота",
  "botShortDescription": "Кратко",
  "botPhotoUrl": null,
  "botCanJoinGroups": 1,
  "botCanReadAllGroupMessages": 0,
  "botSupportsInlineQueries": 0,
  "botHasMainWebApp": 0
}
```

### `DELETE` /api/projects/{projectId}/tokens/{tokenId}

Удалить токен бота проекта

**Авторизация:** Cookie (`connect.sid`)

Останавливает бота и удаляет токен. Сверка `token.projectId` с `:projectId`.

**Auth:** `requireTokenOwnership` → `hasProjectAccess`.

**Side-effect:** WS `token-deleted`.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/tokens/7 -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Токен удалён |
| 400 | Некорректный projectId или tokenId |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту токена |
| 404 | Токен не найден в этом проекте |

#### Пример ответа `200`

```json
{
  "message": "Token deleted successfully"
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/auto-restart

Автоперезапуск бота

**Авторизация:** Cookie (`connect.sid`)

`autoRestart` 0|1, `maxRestartAttempts` 1–10.

**Auth:** `requireTokenOwnership`. WS `token-updated`. Часть флагов пишет `.env`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/auto-restart \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"autoRestart":1,"maxRestartAttempts":3}'
```

**Тело запроса:** `AutoRestartRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сохранено |
| 400 | Флаг не 0/1 или значение вне диапазона |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Токен не найден |

#### Пример ответа `200`

```json
{
  "success": true,
  "autoRestart": 1,
  "maxRestartAttempts": 3
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/catch-all-handlers

Catch-all обработчики (CATCH_ALL_HANDLERS)

**Авторизация:** Cookie (`connect.sid`)

`catchAllHandlers` 0|1 — генерация handle_unhandled_* / fallback_callback.

**Auth:** `requireTokenOwnership`. WS `token-updated`. В `.env` пишется 0/1.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/catch-all-handlers \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"catchAllHandlers":1}'
```

**Тело запроса:** `CatchAllHandlersRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сохранено |
| 400 | Флаг не 0/1 или значение вне диапазона |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Токен не найден |

#### Пример ответа `200`

```json
{
  "success": true,
  "catchAllHandlers": 1
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/content-cache

Живое обновление _content (CONTENT_CACHE)

**Авторизация:** Cookie (`connect.sid`)

`contentCache` 0|1 — load/reload_content / redis subscribe. get_content всегда.

**Auth:** `requireTokenOwnership`. WS `token-updated`. В `.env` пишется 0/1.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/content-cache \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"contentCache":1}'
```

**Тело запроса:** `ContentCacheRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сохранено |
| 400 | Флаг не 0/1 или значение вне диапазона |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Токен не найден |

#### Пример ответа `200`

```json
{
  "success": true,
  "contentCache": 1
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/env-batch

Batch-обновление env / системных ключей

**Авторизация:** Cookie (`connect.sid`)

`changes[]`: create/update/delete. Системные KEY → bot_tokens / project (BOT_TOKEN, ADMIN_IDS, USER_DATABASE, LOG_LEVEL, PROTECT_CONTENT, …). Остальные → bot_env_variables. WS `token-updated` при обновлении полей токена.

**Auth:** `requireTokenOwnership`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/env-batch \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"changes":[{"action":"update","key":"LOG_LEVEL","value":"WARNING"}]}'
```

**Тело запроса:** `ProjectTokenEnvBatchRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Применено |
| 400 | Пустой changes |
| 401 | Не авторизован |
| 403 | Нет владения |

#### Пример ответа `200`

```json
{
  "success": true,
  "applied": 1,
  "results": [
    "updated:LOG_LEVEL"
  ]
}
```

### `GET` /api/projects/{projectId}/tokens/{tokenId}/env-variables

Список env токена (секреты маскируются)

**Авторизация:** Cookie (`connect.sid`)

`{ items, count }`. Секреты → `••••••••`.

**Auth:** `requireTokenOwnership`. Reveal — отдельный path.

**Клиент:** `use-env-variables` / BotEnvRow.

```bash
curl -s http://localhost:5000/api/projects/42/tokens/7/env-variables -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Список |
| 401 | Не авторизован |
| 403 | Нет владения токеном |

#### Пример ответа `200`

```json
{
  "items": [
    {
      "id": 15,
      "tokenId": 7,
      "key": "API_KEY",
      "value": "••••••••",
      "isSecret": 1
    }
  ],
  "count": 1
}
```

### `POST` /api/projects/{projectId}/tokens/{tokenId}/env-variables

Создать env-переменную

**Авторизация:** Cookie (`connect.sid`)

`key` regex `^[A-Z][A-Z0-9_]*$`. 409 если ключ есть.

**Auth:** `requireTokenOwnership`. Reveal — отдельный path.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tokens/7/env-variables \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"key":"API_KEY","value":"secret","isSecret":1}'
```

**Тело запроса:** `ProjectTokenEnvCreateBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Создана (сырое value) |
| 400 | Некорректный key |
| 401 | Не авторизован |
| 403 | Нет владения |
| 409 | Ключ уже существует |

#### Пример ответа `201`

```json
{
  "id": 15,
  "tokenId": 7,
  "key": "API_KEY",
  "value": "secret",
  "isSecret": 1
}
```

### `DELETE` /api/projects/{projectId}/tokens/{tokenId}/env-variables/{id}

Удалить env-переменную

**Авторизация:** Cookie (`connect.sid`)

**Auth:** `requireTokenOwnership`.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/tokens/7/env-variables/15 \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `id` | path | да | ID переменной env | `"15"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалена |
| 401 | Не авторизован |
| 403 | Нет владения |
| 404 | Не найдена |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/env-variables/{id}

Обновить env-переменную

**Авторизация:** Cookie (`connect.sid`)

Partial `{ key?, value?, isSecret? }`. Чужой id → 404 (сверка tokenId).

**Auth:** `requireTokenOwnership`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/env-variables/15 \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"value":"new"}'
```

**Тело запроса:** `ProjectTokenEnvUpdateBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `id` | path | да | ID переменной env | `"15"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлена |
| 400 | Некорректный id/key |
| 401 | Не авторизован |
| 403 | Нет владения |
| 404 | Не найдена / чужой tokenId |
| 409 | Конфликт key |

### `GET` /api/projects/{projectId}/tokens/{tokenId}/env-variables/{id}/reveal

Раскрыть секретное значение env токена

**Авторизация:** Cookie (`connect.sid`)

**Риск:** ответ содержит **сырое** значение env. В списке секреты маскируются. Не логируйте тело ответа.

Сверка `variable.tokenId` с `:tokenId` (чужой id → 404).

**Auth:** `requireTokenOwnership` (владелец/collaborator + IDOR-check projectId).

**Клиент:** `use-env-variables` / BotEnvRow (кнопка «показать»).

```bash
curl -s http://localhost:5000/api/projects/42/tokens/7/env-variables/15/reveal \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `tokenId` | path | да | ID токена бота | `"7"` |
| `id` | path | да | ID переменной env | `"15"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сырое значение |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Не найдено / чужой tokenId |

#### Пример ответа `200`

```json
{
  "value": "super-secret-api-key"
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/launch-settings

Режим запуска polling/webhook

**Авторизация:** Cookie (`connect.sid`)

`launchMode` polling|webhook; опционально `webhookBaseUrl`, `webhookSecretToken`. При смене webhook→polling вызывается Telegram `deleteWebhook`. **Риск:** ответ может вернуть `webhookSecretToken`.

**Auth:** `requireTokenOwnership`. WS `token-updated`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/launch-settings \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"launchMode":"polling"}'
```

**Тело запроса:** `LaunchSettingsRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сохранено |
| 400 | Недопустимое значение |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Токен не найден |

#### Пример ответа `200`

```json
{
  "success": true,
  "launchMode": "polling",
  "webhookBaseUrl": null,
  "webhookSecretToken": null
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/log-level

Уровень логирования бота

**Авторизация:** Cookie (`connect.sid`)

`logLevel`: DEBUG|INFO|WARNING|ERROR. Пишет LOG_LEVEL в `.env`. WS `token-updated`.

**Auth:** `requireTokenOwnership`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/log-level \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"logLevel":"WARNING"}'
```

**Тело запроса:** `LogLevelRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сохранено |
| 400 | Недопустимое значение |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Токен не найден |

#### Пример ответа `200`

```json
{
  "success": true,
  "logLevel": "WARNING"
}
```

### `DELETE` /api/projects/{projectId}/tokens/{tokenId}/logs

Очистить live-логи токена

**Авторизация:** Cookie (`connect.sid`)

Удаляет live-логи (без launch_id) из БД и буфера.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/tokens/7/logs -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Очищено |
| 400 | Некорректные id |
| 401 | Не авторизован |
| 403 | Нет доступа |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `GET` /api/projects/{projectId}/tokens/{tokenId}/logs

Live-логи бота (bot_logs)

**Авторизация:** Cookie (`connect.sid`)

Последние строки `getLatestLaunchLogs` (default limit=500).

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** терминал логов бота.

```bash
curl -s 'http://localhost:5000/api/projects/42/tokens/7/logs?limit=100' -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `limit` | query | нет | Максимум строк логов (по умолчанию 500) | `"500"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив строк логов |
| 400 | Некорректные id |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
[
  {
    "id": 1001,
    "projectId": 42,
    "tokenId": 7,
    "launchId": null,
    "content": "Bot started successfully",
    "type": "stdout",
    "timestamp": "2026-08-11T12:00:00.000Z"
  }
]
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/messages-retention

Срок хранения сообщений диалога

**Авторизация:** Cookie (`connect.sid`)

Обновляет `messagesRetentionDays`. `0` — без автоочистки; иначе раз в час чистит `bot_messages` старше N дней. `message_activity_daily` не трогается.

**Auth:** `requireTokenOwnership`. **Side-effect:** WS `token-updated`.

**Клиент:** настройки токена / retention.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/messages-retention \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"messagesRetentionDays":60}'
```

**Тело запроса:** `UpdateMessagesRetentionRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Настройка сохранена |
| 400 | Неверный ID или значение вне whitelist |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту токена |
| 404 | Токен не найден |

#### Пример ответа `200`

```json
{
  "success": true,
  "messagesRetentionDays": 60
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/protect-content

Защита контента (PROTECT_CONTENT)

**Авторизация:** Cookie (`connect.sid`)

`protectContent` 0|1 → `.env` PROTECT_CONTENT=true/false.

**Auth:** `requireTokenOwnership`. WS `token-updated`. Часть флагов пишет `.env`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/protect-content \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"protectContent":1}'
```

**Тело запроса:** `ProtectContentRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сохранено |
| 400 | Флаг не 0/1 или значение вне диапазона |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Токен не найден |

#### Пример ответа `200`

```json
{
  "success": true,
  "protectContent": 1
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/save-incoming-media

Сохранять входящие медиа

**Авторизация:** Cookie (`connect.sid`)

`saveIncomingMedia` 0|1 → `.env` SAVE_INCOMING_MEDIA.

**Auth:** `requireTokenOwnership`. WS `token-updated`. Часть флагов пишет `.env`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/save-incoming-media \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"saveIncomingMedia":1}'
```

**Тело запроса:** `SaveIncomingMediaRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сохранено |
| 400 | Флаг не 0/1 или значение вне диапазона |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Токен не найден |

#### Пример ответа `200`

```json
{
  "success": true,
  "saveIncomingMedia": 1
}
```

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/userbot

Настройки Telethon userbot

**Авторизация:** Cookie (`connect.sid`)

Сохраняет `userbotEnabled` 0|1 и apiId/hash/session; пишет USERBOT_* в `.env`. WS `token-updated` (changedFields: userbotEnabled).

**Auth:** `requireTokenOwnership`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/userbot \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"userbotEnabled":1,"userbotApiId":"123","userbotApiHash":"abc","userbotSessionString":null}'
```

**Тело запроса:** `UserbotPutRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сохранено |
| 400 | userbotEnabled не 0/1 |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
| 404 | Токен не найден |

#### Пример ответа `200`

```json
{
  "success": true,
  "userbotEnabled": 1
}
```

### `POST` /api/projects/{projectId}/tokens/{tokenId}/userbot/send-code

Userbot auth: отправить код

**Авторизация:** Cookie (`connect.sid`)

Шаг 1: `{ apiId, apiHash, phone }` → Python `userbotAuth`.

**Auth:** `requireTokenOwnership`.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tokens/7/userbot/send-code \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"apiId":"123","apiHash":"abc","phone":"+79001234567"}'
```

**Тело запроса:** `UserbotSendCodeRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Результат send_code |
| 400 | Валидация body |
| 401 | Не авторизован |
| 403 | Нет владения токеном |

#### Пример ответа `200`

```json
{
  "ok": true
}
```

### `POST` /api/projects/{projectId}/tokens/{tokenId}/userbot/sign-in

Userbot auth: код из SMS/Telegram

**Авторизация:** Cookie (`connect.sid`)

Шаг 2: `{ phone, code }`. При `session_string` — сохраняет в БД + userbotEnabled=1.

**Auth:** `requireTokenOwnership`.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tokens/7/userbot/sign-in \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"phone":"+79001234567","code":"12345"}'
```

**Тело запроса:** `UserbotSignInRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Результат / needs_2fa / session |
| 400 | Валидация body |
| 401 | Не авторизован |
| 403 | Нет владения токеном |

### `POST` /api/projects/{projectId}/tokens/{tokenId}/userbot/sign-in-2fa

Userbot auth: пароль 2FA

**Авторизация:** Cookie (`connect.sid`)

Шаг 3: `{ password }`. При успехе сохраняет session + userbotEnabled=1.

**Auth:** `requireTokenOwnership`.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tokens/7/userbot/sign-in-2fa \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"password":"…"}'
```

**Тело запроса:** `UserbotSignIn2faRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | path | да | Числовой ID токена бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Результат 2FA |
| 400 | Валидация body |
| 401 | Не авторизован |
| 403 | Нет владения токеном |
