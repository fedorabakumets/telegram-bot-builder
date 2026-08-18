# project-bot

Эндпоинтов: **8**

### `POST` /api/projects/{id}/bot/restart

Перезапустить бота

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Stop → cooldown → start. С `tokenId` — конкретный бот; без — legacy (инстанс + default). **MCP:** `db_restart_bot`.

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"tokenId":7}' 'http://localhost:5000/api/projects/42/bot/restart'
```

**Тело запроса:** `ProjectBotTokenBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Перезапущен |
| 401 | Нет session / PAT |
| 403 | Нет доступа / чужой tokenId |

#### Пример ответа `200`

```json
{
  "message": "Бот успешно перезапущен",
  "processId": "12345"
}
```

### `POST` /api/projects/{id}/bot/restart-all

Перезапустить всех running ботов

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Останавливает все running-токены проекта, cooldown, затем start со stagger. Офлайн не трогает (для них — start-offline-all).

**Клиент/MCP:** `restartAllBotsMutation`, `db_restart_all_bots`.

```bash
curl -s -X POST -b cookies.txt 'http://localhost:5000/api/projects/42/bot/restart-all'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сводка перезапуска |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 404 | Нет токенов |

#### Пример ответа `200`

```json
{
  "restarted": 2,
  "results": [
    {
      "tokenId": 7,
      "success": true,
      "processId": "12345"
    },
    {
      "tokenId": 8,
      "success": true,
      "processId": "12346"
    }
  ]
}
```

### `POST` /api/projects/{id}/bot/start

Запустить бота

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Старт по `tokenId` (или default). Сырой `token` не принимается. **Клиент/MCP:** `use-bot-mutations`, `db_start_bot`.

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"tokenId":7}' 'http://localhost:5000/api/projects/42/bot/start'
```

**Тело запроса:** `ProjectBotTokenBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Запущен |
| 400 | Уже running / нет токена / сырой token |
| 401 | Нет session / PAT |
| 403 | Нет доступа / чужой tokenId |

#### Пример ответа `200`

```json
{
  "message": "Бот успешно запущен",
  "processId": "12345",
  "tokenUsed": true
}
```

### `POST` /api/projects/{id}/bot/start-offline-all

Запустить всех офлайн-ботов проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Последовательно запускает токены проекта со status !== running и действительным токеном. Уже running и токены с isActive=0 (Telegram отклонил) не трогает (в отличие от restart-all).

**Доступ:** `requireProjectAccess`.

**Side-effects:** WS `bot-started`, `start-offline-progress` (без секретов; см. docs/api/realtime-events.md).

**Клиент:** `use-bot-mutations` / BotManagement. MCP: `db_start_offline_bots`.

При большом числе токенов HTTP долгий (пауза ~400ms между стартами).

```bash
curl -s -X POST http://localhost:5000/api/projects/1/bot/start-offline-all -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сводка запуска |
| 400 | Неверный ID проекта |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |
| 404 | Токены не найдены |

#### Пример ответа `200`

```json
{
  "started": 2,
  "failed": 0,
  "skippedRunning": 1,
  "results": [
    {
      "tokenId": 7,
      "success": true,
      "processId": "12345"
    },
    {
      "tokenId": 8,
      "success": true,
      "processId": "12346"
    }
  ]
}
```

### `GET` /api/projects/{id}/bot/statuses

Статусы всех ботов проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Один ответ вместо N запросов `GET /api/tokens/{tokenId}/bot-status`. Сверка с worker pool / in-memory процессом. `instance` без сырого token. `Cache-Control: no-store`.

**Auth:** `requireProjectAccess` — только свои/коллабораторские проекты (не IDOR по чужим tokenId).

Одиночный статус: `GET /api/tokens/{tokenId}/bot-status` (MCP: `db_bot_status`).

```bash
curl -s http://localhost:5000/api/projects/42/bot/statuses -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Статусы токенов проекта |
| 400 | Неверный ID проекта |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
{
  "statuses": [
    {
      "tokenId": 7,
      "status": "running",
      "instance": {
        "id": 1,
        "projectId": 42,
        "tokenId": 7,
        "status": "running",
        "processId": "worker_42",
        "startedAt": "2026-08-18T13:42:04.555Z",
        "stoppedAt": null,
        "errorMessage": null
      }
    },
    {
      "tokenId": 8,
      "status": "stopped",
      "instance": null
    }
  ]
}
```

### `POST` /api/projects/{id}/bot/stop

Остановить бота

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Остановка по обязательному `tokenId`. **Клиент/MCP:** `use-bot-mutations`, `db_stop_bot`.

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"tokenId":7}' 'http://localhost:5000/api/projects/42/bot/stop'
```

**Тело запроса:** `ProjectBotTokenBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Остановлен |
| 400 | Нет tokenId |
| 401 | Нет session / PAT |
| 403 | Нет доступа / чужой tokenId |

#### Пример ответа `200`

```json
{
  "message": "Бот успешно остановлен"
}
```

### `GET` /api/projects/{projectId}/bot/data

Данные бота для диалогов

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Кэш профиля default-токена в формате, совместимом с bot_users (аватар/username для панели Database → диалоги).

**Клиент:** `use-bot-data`.

```bash
curl -s -b cookies.txt 'http://localhost:5000/api/projects/42/bot/data'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Профиль или null |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
{
  "id": "123456789",
  "userId": "123456789",
  "avatarUrl": "AgACAgIAAxkBAA",
  "userName": "my_support_bot",
  "firstName": "Support Bot",
  "isBot": true
}
```

### `GET` /api/projects/{projectId}/bot/info

Профиль бота (getMe)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Telegram getMe для токена проекта (`tokenId` или default). `photoUrl: true` — фото есть (клиент грузит через avatar proxy). Без токена: `{ hasToken: false }`.

Имя/описание менять через `PUT …/tokens/{tokenId}/bot-info`.

**Клиент:** `use-bot-queries` / карточки ботов.

```bash
curl -s -b cookies.txt 'http://localhost:5000/api/projects/42/bot/info?tokenId=7'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | getMe или hasToken:false |
| 401 | Нет session / PAT |
| 403 | Нет доступа / чужой tokenId |

#### Пример ответа `200`

```json
{
  "id": 123456789,
  "is_bot": true,
  "first_name": "Support Bot",
  "username": "my_support_bot",
  "photoUrl": true,
  "tokenId": 7
}
```
