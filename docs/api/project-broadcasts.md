# project-broadcasts

Эндпоинтов: **12**

### `GET` /api/projects/{projectId}/broadcast-campaigns

Список больших рассылок проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Кампании — «большие рассылки по нескольким ботам» проекта, новые первыми. Одна кампания = одно сообщение, ушедшее параллельно от нескольких ботов; счётчики в карточке — сумма по всем ботам. Обычные рассылки от одного бота сюда не попадают — они в `GET …/broadcasts`.

**Доступ:** `requireProjectAccess` — сессионная cookie или Bearer PAT плюс права на проект (владелец или коллаборатор). Кампания ищется по `campaignId`, но отдаётся только если `campaign.projectId` совпадает с `projectId` из пути — иначе 403, поэтому перебор чужих ID ничего не раскрывает.

**Клиенты Studio:** лента «Диалоги» → строка «Рассылка» (`use-broadcast-campaigns`).

```bash
curl -s -b cookies.txt \
  'http://localhost:5000/api/projects/42/broadcast-campaigns'
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
| 200 | Кампании проекта |
| 400 | Неверный ID проекта |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту или кампания другого проекта |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "campaigns": [
    {
      "id": 3,
      "projectId": 42,
      "name": "Акция августа",
      "messageText": "Привет! Скидка 20%.",
      "mediaUrls": [],
      "buttons": [],
      "buttonsPerRow": 0,
      "filters": {
        "tags": [
          "vip"
        ]
      },
      "tokenIds": [
        7,
        8
      ],
      "status": "running",
      "totalCount": 240,
      "sentCount": 120,
      "deliveredCount": 115,
      "failedCount": 5,
      "createdAt": "2026-08-12T01:48:00.000Z",
      "startedAt": "2026-08-12T01:48:01.000Z",
      "finishedAt": null
    }
  ]
}
```

### `DELETE` /api/projects/{projectId}/broadcast-campaigns/{campaignId}

Удалить большую рассылку у всех ботов

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Останавливает активные очереди, удаляет отправленные сообщения в Telegram по каждому боту и саму кампанию. Дочерние рассылки, их результаты и записи `bot_messages` уходят каскадом по `campaign_id`. Токены берутся только из этого проекта.

**Доступ:** `requireProjectAccess` — сессионная cookie или Bearer PAT плюс права на проект (владелец или коллаборатор). Кампания ищется по `campaignId`, но отдаётся только если `campaign.projectId` совпадает с `projectId` из пути — иначе 403, поэтому перебор чужих ID ничего не раскрывает.

**Клиенты Studio:** «Удалить у всех ботов» в пузыре рассылки в «Диалогах» (`use-delete-broadcast-campaign`).

```bash
curl -s -X DELETE -b cookies.txt \
  'http://localhost:5000/api/projects/42/broadcast-campaigns/3'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `campaignId` | path | да | ID кампании рассылки | `"3"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Кампания удалена |
| 400 | Неверные ID |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту или кампания другого проекта |
| 404 | Кампания не найдена |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "ok": true,
  "deleted": 231,
  "broadcasts": 2
}
```

### `GET` /api/projects/{projectId}/broadcast-campaigns/{campaignId}

Детали большой рассылки

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Карточка кампании и её дочерние рассылки — по одной на каждого бота, со своим статусом и счётчиками. Пока кампания идёт, Studio дополняет эти данные WS-событиями `broadcast-progress` (у дочерних событий есть `campaignId`).

**Доступ:** `requireProjectAccess` — сессионная cookie или Bearer PAT плюс права на проект (владелец или коллаборатор). Кампания ищется по `campaignId`, но отдаётся только если `campaign.projectId` совпадает с `projectId` из пути — иначе 403, поэтому перебор чужих ID ничего не раскрывает.

**Клиенты Studio:** экран прогресса мастера и пузырь большой рассылки в «Диалогах» (`use-broadcast-campaign-detail`).

```bash
curl -s -b cookies.txt \
  'http://localhost:5000/api/projects/42/broadcast-campaigns/3'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `campaignId` | path | да | ID кампании рассылки | `"3"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Кампания и её рассылки по ботам |
| 400 | Неверные ID |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту или кампания другого проекта |
| 404 | Кампания не найдена |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "campaign": {
    "id": 3,
    "projectId": 42,
    "name": "Акция августа",
    "messageText": "Привет! Скидка 20%.",
    "mediaUrls": [],
    "buttons": [],
    "buttonsPerRow": 0,
    "filters": {
      "tags": [
        "vip"
      ]
    },
    "tokenIds": [
      7,
      8
    ],
    "status": "running",
    "totalCount": 240,
    "sentCount": 120,
    "deliveredCount": 115,
    "failedCount": 5,
    "createdAt": "2026-08-12T01:48:00.000Z",
    "startedAt": "2026-08-12T01:48:01.000Z",
    "finishedAt": null
  },
  "broadcasts": [
    {
      "id": 15,
      "projectId": 42,
      "campaignId": 3,
      "tokenId": 7,
      "name": "Акция августа",
      "messageText": "Привет! Скидка 20%.",
      "status": "running",
      "totalCount": 120,
      "sentCount": 60,
      "deliveredCount": 58,
      "failedCount": 2,
      "mediaUrls": [],
      "buttons": [],
      "buttonsPerRow": 0,
      "filters": {
        "tags": [
          "vip"
        ]
      },
      "createdAt": "2026-08-12T01:48:00.000Z",
      "startedAt": "2026-08-12T01:48:01.000Z",
      "finishedAt": null
    },
    {
      "id": 16,
      "projectId": 42,
      "campaignId": 3,
      "tokenId": 8,
      "name": "Акция августа",
      "messageText": "Привет! Скидка 20%.",
      "status": "running",
      "totalCount": 120,
      "sentCount": 60,
      "deliveredCount": 57,
      "failedCount": 3,
      "mediaUrls": [],
      "buttons": [],
      "buttonsPerRow": 0,
      "filters": {
        "tags": [
          "vip"
        ]
      },
      "createdAt": "2026-08-12T01:48:00.000Z",
      "startedAt": "2026-08-12T01:48:01.000Z",
      "finishedAt": null
    }
  ]
}
```

### `PUT` /api/projects/{projectId}/broadcast-campaigns/{campaignId}

Изменить текст большой рассылки у всех ботов

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Обновляет `messageText` кампании и правит уже отправленные сообщения через `editMessageText` во всех ботах кампании (throttle ~25/с на бота). Текст 1…4096 после trim. В ответе — сводка и разбивка по ботам.

**Доступ:** `requireProjectAccess` — сессионная cookie или Bearer PAT плюс права на проект (владелец или коллаборатор). Кампания ищется по `campaignId`, но отдаётся только если `campaign.projectId` совпадает с `projectId` из пути — иначе 403, поэтому перебор чужих ID ничего не раскрывает.

**Клиенты Studio:** правка текста в пузыре большой рассылки в «Диалогах» (`use-edit-broadcast-campaign`).

```bash
curl -s -X PUT -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"messageText":"Обновлённый текст"}' \
  'http://localhost:5000/api/projects/42/broadcast-campaigns/3'
```

**Тело запроса:** `EditBroadcastCampaignRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `campaignId` | path | да | ID кампании рассылки | `"3"` |
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
| 200 | Сколько сообщений отредактировано по всем ботам |
| 400 | Валидация тела запроса |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту или кампания другого проекта |
| 404 | Кампания не найдена |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "ok": true,
  "edited": 221,
  "failed": 9,
  "perBot": [
    {
      "broadcastId": 15,
      "tokenId": 7,
      "edited": 113,
      "failed": 5
    },
    {
      "broadcastId": 16,
      "tokenId": 8,
      "edited": 108,
      "failed": 4
    }
  ]
}
```

### `POST` /api/projects/{projectId}/broadcast-campaigns/{campaignId}/stop

Остановить большую рассылку у всех ботов

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Выставляет флаг остановки всем дочерним рассылкам со статусом `running` и пересчитывает агрегаты кампании. Очередь читает флаг между батчами, поэтому уже начатый батч может дойти до конца. Уже отправленные сообщения остаются у получателей — удалить их можно только через DELETE.

**Доступ:** `requireProjectAccess` — сессионная cookie или Bearer PAT плюс права на проект (владелец или коллаборатор). Кампания ищется по `campaignId`, но отдаётся только если `campaign.projectId` совпадает с `projectId` из пути — иначе 403, поэтому перебор чужих ID ничего не раскрывает.

**Клиенты Studio:** кнопка «⏸ Остановить у всех ботов» в мастере и в пузыре рассылки в «Диалогах» (`use-stop-broadcast-campaign`).

```bash
curl -s -X POST -b cookies.txt \
  'http://localhost:5000/api/projects/42/broadcast-campaigns/3/stop'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `campaignId` | path | да | ID кампании рассылки | `"3"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Кампания и ID остановленных рассылок |
| 400 | Неверные ID |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту или кампания другого проекта |
| 404 | Кампания не найдена |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "campaign": {
    "id": 3,
    "projectId": 42,
    "name": "Акция августа",
    "messageText": "Привет! Скидка 20%.",
    "mediaUrls": [],
    "buttons": [],
    "buttonsPerRow": 0,
    "filters": {
      "tags": [
        "vip"
      ]
    },
    "tokenIds": [
      7,
      8
    ],
    "status": "stopped",
    "totalCount": 240,
    "sentCount": 120,
    "deliveredCount": 115,
    "failedCount": 5,
    "createdAt": "2026-08-12T01:48:00.000Z",
    "startedAt": "2026-08-12T01:48:01.000Z",
    "finishedAt": "2026-08-12T01:50:00.000Z"
  },
  "stopped": [
    15,
    16
  ]
}
```

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

Создать и запустить рассылку (один бот или несколько)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Создаёт рассылку со статусом `running` и запускает очередь отправки. Текст ≤4096, media ≤10, buttons ≤100. `name` необязательно (пустое → дата + начало текста сообщения).

**Выбор ботов.** `tokenIds` (1…100 ID токенов проекта) задаёт «большую рассылку по нескольким ботам»: создаётся кампания, на каждого бота — своя дочерняя рассылка, очереди стартуют параллельно, ответ `{ campaignId, broadcastIds }`. Один элемент в `tokenIds` или обычный `tokenId` (query/body) — рассылка от одного бота, ответ `{ broadcastId }`. Без обоих полей берётся default-токен проекта.

**Безопасность:** каждый ID из `tokenIds` проверяется на принадлежность проекту; чужой или несуществующий токен → 400 «Токены не принадлежат этому проекту: …». Группы: `groupsByTokenId` (tokenId → chat_id[]) — у каждого бота свои чаты; `filters.groupIds` — для одного бота / дочерней рассылки. Сервер проверяет, что чат виден этому токену (`bot_groups` / `bot_messages`).

**Клиенты Studio:** мастер «Новая рассылка» (`use-create-broadcast`).

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"messageText":"Привет!","tokenIds":[7,8],"groupsByTokenId":{"7":["-1001"],"8":["-1002"]},"filters":{}}' \
  'http://localhost:5000/api/projects/42/broadcasts'
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
  },
  "tokenIds": [
    7,
    8
  ]
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Рассылка создана и запущена |
| 400 | Валидация, нет токена или чужой tokenId |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 500 | Внутренняя ошибка |

#### Пример ответа `201`

```json
{
  "campaignId": 3,
  "broadcastIds": [
    15,
    16
  ]
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

Считает получателей по `filters` (+ до 3 примеров). Не создаёт рассылку.

**Один бот:** `tokenId` в query/body (или default-токен) — `count`, `perBot` из одного элемента, `overlapEstimate: 0`.

**Большая рассылка по нескольким ботам:** `tokenIds` — аудитория считается по каждому боту. `count`/`total` — сколько сообщений уйдёт всего (сумма с дублями), `uniqueCount` — уникальных людей, `overlapEstimate` — сколько человек получат сообщение более чем от одного бота (Studio показывает это предупреждением в мастере).

**Безопасность:** токены из `tokenIds`, не принадлежащие проекту, → 400.

**Клиенты Studio:** шаги «Аудитория» и «Подтверждение» мастера (`use-audience-preview`).

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"filters":{"tags":["vip"]},"tokenIds":[7,8]}' \
  'http://localhost:5000/api/projects/42/broadcasts/preview-audience'
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
  },
  "tokenIds": [
    7,
    8
  ]
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Количество, разбивка по ботам и sample |
| 400 | Валидация, нет токена или чужой tokenId |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "count": 90,
  "sample": [
    {
      "userId": "123456789",
      "userName": "ivan",
      "firstName": "Иван",
      "lastName": "Петров"
    }
  ],
  "total": 90,
  "uniqueCount": 86,
  "perBot": [
    {
      "tokenId": 7,
      "count": 42
    },
    {
      "tokenId": 8,
      "count": 48
    }
  ],
  "overlapEstimate": 4
}
```
