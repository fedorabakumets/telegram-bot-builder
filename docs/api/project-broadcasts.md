# project-broadcasts

Эндпоинтов: **7**

### `GET` /api/projects/{projectId}/broadcasts

Список рассылок проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

История рассылок (Broadcast panel) с пагинацией. `tokenId` фильтрует по боту.

**Auth:** cookie или Bearer PAT + доступ к проекту. **Клиент:** `use-broadcasts`.

```bash
curl -s -b cookies.txt \
  'http://localhost:5000/api/projects/42/broadcasts?page=1&tokenId=7'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `tokenId` | query | нет | ID токена бота | `"7"` |
| `page` | query | нет | — | `"1"` |
| `limit` | query | нет | — | `"20"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Страница рассылок |
| 400 | Неверный projectId |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "broadcasts": [
    {
      "id": 15,
      "projectId": 42,
      "tokenId": 7,
      "name": "Акция августа",
      "messageText": "Привет! Скидка 20%.",
      "status": "done",
      "totalCount": 120,
      "sentCount": 120,
      "deliveredCount": 115,
      "failedCount": 5,
      "mediaUrls": [],
      "buttons": [],
      "buttonsPerRow": 0,
      "filters": {
        "tags": [
          "vip"
        ]
      },
      "createdAt": "2026-08-10T10:00:00.000Z",
      "startedAt": "2026-08-10T10:00:01.000Z",
      "finishedAt": "2026-08-10T10:05:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### `POST` /api/projects/{projectId}/broadcasts

Создать и запустить рассылку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Создаёт рассылку со статусом `running` и запускает очередь отправки. `tokenId` — query или body; иначе default токен. Текст ≤4096, media ≤10, buttons ≤100.

**Клиент:** `use-create-broadcast`.

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"name":"Акция","messageText":"Привет!","filters":{}}' \
  'http://localhost:5000/api/projects/42/broadcasts?tokenId=7'
```

**Тело запроса:** `CreateBroadcastRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `tokenId` | query | нет | ID токена бота | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Акция августа",
  "messageText": "Привет! Скидка 20%.",
  "mediaUrls": [],
  "buttons": [],
  "buttonsPerRow": 0,
  "filters": {
    "tags": [
      "vip"
    ]
  }
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Рассылка создана и запущена |
| 400 | Валидация / нет токена |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 500 | Внутренняя ошибка |

#### Пример ответа `201`

```json
{
  "broadcastId": 15
}
```

### `DELETE` /api/projects/{projectId}/broadcasts/{broadcastId}

Удалить рассылку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет сообщения в Telegram (если есть `telegramMessageId`), запись рассылки и связанные `bot_messages`. Токен только своего проекта.

**Клиент:** `broadcast-dialog-panel`.

```bash
curl -s -X DELETE -b cookies.txt \
  'http://localhost:5000/api/projects/42/broadcasts/15'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `broadcastId` | path | да | ID рассылки | `"15"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалено |
| 400 | Неверные ID |
| 401 | Нет session / PAT |
| 403 | Нет доступа |
| 404 | Не найдена |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "ok": true,
  "deleted": 115
}
```

### `GET` /api/projects/{projectId}/broadcasts/{broadcastId}

Детали рассылки

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Карточка рассылки + результаты с ошибками (`status ≠ sent`). Чужой projectId → 403.

**Клиент:** `use-broadcast-detail`.

```bash
curl -s -b cookies.txt \
  'http://localhost:5000/api/projects/42/broadcasts/15'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `broadcastId` | path | да | ID рассылки | `"15"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Рассылка и ошибки доставки |
| 400 | Неверные ID |
| 401 | Нет session / PAT |
| 403 | Рассылка другого проекта / нет доступа |
| 404 | Не найдена |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "broadcast": {
    "id": 15,
    "projectId": 42,
    "tokenId": 7,
    "name": "Акция августа",
    "messageText": "Привет! Скидка 20%.",
    "status": "done",
    "totalCount": 120,
    "sentCount": 120,
    "deliveredCount": 115,
    "failedCount": 5,
    "mediaUrls": [],
    "buttons": [],
    "buttonsPerRow": 0,
    "filters": {
      "tags": [
        "vip"
      ]
    },
    "createdAt": "2026-08-10T10:00:00.000Z",
    "startedAt": "2026-08-10T10:00:01.000Z",
    "finishedAt": "2026-08-10T10:05:00.000Z"
  },
  "results": [
    {
      "id": 901,
      "broadcastId": 15,
      "userId": "987654321",
      "status": "blocked",
      "errorMessage": "Forbidden: bot was blocked by the user",
      "telegramMessageId": null,
      "sentAt": "2026-08-10T10:01:00.000Z"
    }
  ]
}
```

### `PUT` /api/projects/{projectId}/broadcasts/{broadcastId}

Редактировать текст рассылки

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Обновляет `messageText` в БД и через `editMessageText` у получателей (throttle ~25/s). Текст 1…4096 после trim.

**Клиент:** `broadcast-dialog-panel`.

```bash
curl -s -X PUT -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"messageText":"Обновлённый текст"}' \
  'http://localhost:5000/api/projects/42/broadcasts/15'
```

**Тело запроса:** `EditBroadcastRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `broadcastId` | path | да | ID рассылки | `"15"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "messageText": "Обновлённый текст рассылки"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сколько сообщений отредактировано |
| 400 | Валидация body |
| 401 | Нет session / PAT |
| 403 | Нет доступа |
| 404 | Не найдена |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "ok": true,
  "edited": 110,
  "failed": 5
}
```

### `POST` /api/projects/{projectId}/broadcasts/{broadcastId}/stop

Остановить рассылку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Ставит флаг остановки очереди. Только для `status=running`.

**Клиент:** `use-stop-broadcast`.

```bash
curl -s -X POST -b cookies.txt \
  'http://localhost:5000/api/projects/42/broadcasts/15/stop'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `broadcastId` | path | да | ID рассылки | `"15"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Рассылка остановлена |
| 400 | Не запущена / неверные ID |
| 401 | Нет session / PAT |
| 403 | Чужой проект |
| 404 | Не найдена |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "broadcast": {
    "id": 15,
    "projectId": 42,
    "tokenId": 7,
    "name": "Акция августа",
    "messageText": "Привет! Скидка 20%.",
    "status": "stopped",
    "totalCount": 120,
    "sentCount": 120,
    "deliveredCount": 115,
    "failedCount": 5,
    "mediaUrls": [],
    "buttons": [],
    "buttonsPerRow": 0,
    "filters": {
      "tags": [
        "vip"
      ]
    },
    "createdAt": "2026-08-10T10:00:00.000Z",
    "startedAt": "2026-08-10T10:00:01.000Z",
    "finishedAt": "2026-08-10T10:05:00.000Z"
  }
}
```

### `POST` /api/projects/{projectId}/broadcasts/preview-audience

Предпросмотр аудитории рассылки

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Считает получателей по `filters` (+ до 3 примеров). `tokenId` — query/body. Не создаёт рассылку.

**Клиент:** `use-audience-preview`.

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"filters":{"tags":["vip"]}}' \
  'http://localhost:5000/api/projects/42/broadcasts/preview-audience?tokenId=7'
```

**Тело запроса:** `PreviewAudienceRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `tokenId` | query | нет | ID токена бота | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "filters": {
    "tags": [
      "vip"
    ]
  }
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Количество и sample |
| 400 | Валидация / нет токена |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "count": 42,
  "sample": [
    {
      "userId": "123456789",
      "userName": "ivan",
      "firstName": "Иван",
      "lastName": "Петров"
    }
  ]
}
```
