# project-messages

Эндпоинтов: **4**

### `GET` /api/projects/{id}/messages/activity

График активности сообщений

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Точки для графика в Analytics / Stats: сколько сообщений за интервалы времени.

**granularity** (предпочтительно): `1m` / `5m` / `1h` — короткие окна с заполнением пустых слотов нулями; `1w` / `1d` / `7d` / `30d` — дневные агрегаты (не зависят от удаления старых сообщений).

**period** (legacy, если нет granularity): `7d` / `30d` / `90d` (по умолчанию 30d).

**split=true** — отдельно входящие (от пользователей) и исходящие (от бота), иначе одно поле `count`.

Опционально `tokenId` — только этот бот.

**Auth:** cookie или Bearer PAT + доступ к проекту.

**Клиент:** `use-messages-activity` → Analytics / Stats.

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

Список сообщений проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Лента всех сообщений бота в проекте (системная таблица «Сообщения» в Database). Текст обрезается до 100 символов; полный диалог — через `…/users/{userId}/messages`.

Новые сверху. Можно ограничить токеном (`tokenId`), пагинация: `limit` (по умолчанию 200) и `offset`.

**Auth:** cookie или Bearer PAT + доступ к проекту.

**Клиент:** панель Database → системные таблицы (`use-system-tables`).

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

Удалить сообщение из чата и базы

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет одно сообщение из панели Диалогов: сначала в Telegram, при успехе — из нашей БД, затем обновление UI по WebSocket.

Нужен Telegram message id у записи. Если Telegram отклонил запрос — запись в БД не трогаем (400).

Query `tokenId` — каким ботом слать `deleteMessage` (иначе дефолтный/первый токен проекта).

**Auth:** cookie или Bearer PAT + доступ к проекту.

**Клиент:** диалоги → `use-delete-message`.

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

Редактировать текст сообщения бота

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Правит исходящее сообщение бота в диалоге: сначала в Telegram, потом у нас в БД, UI обновляется по WebSocket.

Только сообщения бота (не пользователя) с известным Telegram id. Тело: обязательный `messageText`; опционально `buttons` / `buttonsPerRow` (пустой массив кнопок снимает клавиатуру).

Query `tokenId` — каким ботом слать edit (иначе дефолтный/первый токен проекта).

**Auth:** cookie или Bearer PAT + доступ к проекту.

**Клиент:** диалоги → `use-edit-message`.

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
