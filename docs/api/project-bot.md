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

**Operation ID:** `post_api_projects_id_bot_restart_7fdf9e4f2326a50e`

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

Принимает массовый перезапуск running-ботов в фоне. Ответ **202** подтверждает только принятие задания, не успешный запуск ботов. Cookie/PAT и доступ к проекту обязательны. Повторный POST во время работы возвращает тот же `jobId`.

```json
{"jobId":"6c93054e-074a-4d15-9d72-c2e09f8eb7dc","projectId":42,"status":"queued","progress":{"phase":"queued","total":0,"completed":0,"stopped":0,"stopFailed":0,"attempted":0,"restarted":0,"failed":0,"results":[]},"createdAt":"2026-11-21T09:00:00.000Z","updatedAt":"2026-11-21T09:00:00.000Z"}
```

Ответы: 202 — принято; 400 — неверный ID; 401/403 — нет доступа; 409 — внутренний перезапуск уже идёт; 503 — очередь заполнена.

### `GET` /api/projects/{id}/bot/restart-all/jobs/{jobId}

Возвращает 200 с тем же снимком: `queued`, `running`, `completed` либо `failed`. Поле `progress.phase` меняется через `stopping`, `cooldown`, `starting`, `completed`. Завершённая работа содержит `result` (`ok`, `restarted`, `failed`, `results`, необязательный `message`); ошибка всего задания — безопасное поле `error`. `completed` не исключает ошибок отдельных токенов: проверяйте `result.failed`.

Доступ к проекту проверяется заново. Задания хранятся в памяти панели до часа, максимум 200. Ответ 404 `RESTART_JOB_NOT_FOUND` после перезапуска панели или истечения срока означает неизвестный исход: перечитайте статусы ботов, не запускайте повтор автоматически. Офлайн-боты не включаются в restart-all. Опрос не держит HTTP-запрос до окончания запуска.

**Клиент/MCP:** `restartAllBotsMutation`, `db_restart_all_bots`; после принятия требуется опрос задания.

### `POST` /api/projects/{id}/bot/start

Запустить бота

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Старт по `tokenId` (или default). Сырой `token` не принимается. **Клиент/MCP:** `use-bot-mutations`, `db_start_bot`.

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"tokenId":7}' 'http://localhost:5000/api/projects/42/bot/start'
```

**Operation ID:** `post_api_projects_id_bot_start_989a74f87fe7b3d5`

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

**Operation ID:** `post_api_projects_id_bot_start_offline_all_6805be7354e569c7`

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

**Operation ID:** `get_api_projects_id_bot_statuses_b754b8421736ad9d`

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

**Operation ID:** `post_api_projects_id_bot_stop_4db7dda481c7fee4`

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

**Operation ID:** `get_api_projects_projectId_bot_data_581f50fad75146b5`

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

**Operation ID:** `get_api_projects_projectId_bot_info_d2b431d85ba79141`

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
