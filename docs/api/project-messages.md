# project-messages

Эндпоинтов: **4**

### `GET` /api/projects/{id}/messages/activity

Активность сообщений по времени

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

С `granularity` (1m|5m|1h|1d|7d|30d): короткие окна — `bot_messages` + `generate_series` (fill gaps); дневные — `message_activity_daily`. Без granularity — legacy `period` (7d|30d|90d, default 30d) через `queryActivityFromDailyPeriod`.

`split=true` → `[{date, incoming, outgoing}]`, иначе `[{date, count}]`.

**Auth:** `requireApiAuth` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `use-messages-activity` → Analytics/Stats.

```bash
curl -s 'http://localhost:5000/api/projects/42/messages/activity?granularity=1h&split=true&tokenId=7' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | Опциональный ID токена бота. Без него — все токены. | `"7"` |
| `granularity` | query | нет | — | `"1h"` |
| `period` | query | нет | — | `"30d"` |
| `split` | query | нет | true — разбивка incoming/outgoing | `"true"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Ряд точек активности |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "date": "2026-08-11T13:00:00.000Z",
    "count": 4
  },
  {
    "date": "2026-08-11T14:00:00.000Z",
    "count": 12
  }
]
```

### `GET` /api/projects/{id}/messages/all

Все сообщения проекта (усечённый список)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Выборка из `bot_messages`: id, userId, messageType, messageText (SUBSTRING 100), chatType, chatId, createdAt. Сортировка `created_at DESC`. Default limit=200, offset=0.

**Auth:** `requireApiAuth` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `use-system-tables`.

```bash
curl -s 'http://localhost:5000/api/projects/42/messages/all?limit=50&tokenId=7' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | Опциональный ID токена бота. Без него — все токены. | `"7"` |
| `limit` | query | нет | Лимит записей (default 200) | `"200"` |
| `offset` | query | нет | Смещение пагинации (default 0) | `"0"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив сообщений |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 501,
    "userId": "123456789",
    "messageType": "bot",
    "messageText": "Привет! Чем могу помочь?",
    "chatType": "private",
    "chatId": "123456789",
    "createdAt": "2026-08-11T15:00:00.000Z"
  },
  {
    "id": 500,
    "userId": "123456789",
    "messageType": "user",
    "messageText": "/start",
    "chatType": "private",
    "chatId": "123456789",
    "createdAt": "2026-08-11T14:59:00.000Z"
  }
]
```

### `DELETE` /api/projects/{projectId}/messages/{messageId}

Удалить сообщение (Telegram + БД)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Сначала `deleteMessage` в Telegram, при успехе — DELETE из `bot_messages`, затем WS `message-deleted`. Без `telegramMessageId` или при отказе Telegram — 400, БД не трогается.

`tokenId` (query) → `resolveEffectiveProjectToken`.

**Auth:** `requireApiAuth` + `requireProjectAccess`.

**Клиент:** `use-delete-message` (диалоги).

```bash
curl -s -X DELETE 'http://localhost:5000/api/projects/42/messages/501?tokenId=7' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `messageId` | path | да | ID сообщения в bot_messages | `"501"` |
| `tokenId` | query | нет | ID токена бота; иначе default/first токен проекта | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалено в Telegram и БД |
| 400 | Неверные ID / нет telegramMessageId / нет токена / Telegram reject |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту или message.projectId mismatch |
| 404 | Сообщение не найдено |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "success": true,
  "deletedFromTelegram": true
}
```

### `PATCH` /api/projects/{projectId}/messages/{messageId}

Редактировать сообщение бота (Telegram + БД)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Только `messageType=bot` с `telegramMessageId`. Telegram `editMessageText`/`editMessageCaption`, затем UPDATE БД, WS `message-edited`. Пустой `buttons` снимает inline-клавиатуру.

`tokenId` (query) → `resolveEffectiveProjectToken`.

**Auth:** `requireApiAuth` + `requireProjectAccess`.

**Клиент:** `use-edit-message`.

```bash
curl -s -X PATCH 'http://localhost:5000/api/projects/42/messages/501?tokenId=7' \
  -H 'Content-Type: application/json' \
  -d '{"messageText":"Обновлённый текст"}' \
  -b cookies.txt
```

**Тело запроса:** `EditMessageRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `messageId` | path | да | ID сообщения в bot_messages | `"501"` |
| `tokenId` | query | нет | ID токена бота; иначе default/first токен проекта | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "messageText": "Обновлённый текст сообщения",
  "buttons": [],
  "buttonsPerRow": 0
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Отредактировано в Telegram и БД |
| 400 | Пустой текст / не bot / нет telegramMessageId / нет токена / Telegram reject |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту или message.projectId mismatch |
| 404 | Сообщение не найдено |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "success": true,
  "editedInTelegram": true
}
```
