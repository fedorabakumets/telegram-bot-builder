# project-groups

Эндпоинтов: **6**

### `POST` /api/projects/{projectId}/bot/send-group-message

Отправить сообщение в группу

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Текст / медиа / кнопки в группу из панели диалогов. `groupId` в теле — chat_id; группа должна относиться к проекту. Пишется в историю + WS `new-message`. `tokenId` — от какого бота слать.

**Клиент:** `use-send-group-message`.

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"groupId":"-1001234567890","message":"Здравствуйте!"}' \
  'http://localhost:5000/api/projects/42/bot/send-group-message?tokenId=7'
```

**Operation ID:** `post_api_projects_projectId_bot_send_group_message_cc81c37dd127cc79`

**Тело запроса:** `SendGroupMessageRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "groupId": "-1001234567890",
  "message": "Здравствуйте!",
  "mediaUrls": [],
  "buttons": [],
  "buttonsPerRow": 0
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Отправлено и сохранено |
| 400 | Нет токена / пустое тело / Telegram отклонил |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 404 | Группа не привязана к проекту |

#### Пример ответа `200`

```json
{
  "message": "Сообщение успешно отправлено",
  "messageId": 98765
}
```

### `GET` /api/projects/{projectId}/groups

Список Telegram-групп проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Группы/каналы проекта (Database → группы, выбор аудитории рассылки). С `?tokenId=` — только группы этого бота (из `bot_groups` и чаты из `bot_messages`). Без `tokenId` — все группы проекта. Название и аватарка — через `…/sync`.

**Auth:** cookie или Bearer PAT + доступ к проекту. **Клиент:** `group-select`, `use-sync-groups`.

```bash
curl -s 'http://localhost:5000/api/projects/42/groups?tokenId=7' -b cookies.txt
```

**Operation ID:** `get_api_projects_projectId_groups_e8f0770cb84c0680`

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
| 200 | Массив групп |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 15,
    "projectId": 42,
    "groupId": "-1001234567890",
    "name": "Поддержка клиентов",
    "url": "https://t.me/support_chat",
    "isAdmin": 1,
    "isActive": 1,
    "avatarUrl": "/api/projects/42/telegram-file?fileId=AgAC&tokenId=7",
    "chatType": "supergroup",
    "createdAt": "2026-08-01T10:00:00.000Z",
    "updatedAt": "2026-08-11T12:00:00.000Z"
  }
]
```

### `GET` /api/projects/{projectId}/groups/{groupId}/messages

История сообщений группы

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Лента группового диалога (хронологически). Группа должна относиться к проекту (`bot_groups` или уже есть сообщения) — иначе 404. `tokenId` / `limit` (default 100).

**Клиент:** `dialog-panel` (режим группы).

```bash
curl -s -b cookies.txt \
  'http://localhost:5000/api/projects/42/groups/-1001234567890/messages?limit=50'
```

**Operation ID:** `get_api_projects_projectId_groups_groupId_messages_14f64f53dbaaa42b`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `groupId` | path | да | Telegram chat_id группы | `"-1001234567890"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `limit` | query | нет | Сколько последних сообщений вернуть (default 100) | `"100"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив сообщений (от старых к новым) |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 404 | Группа не привязана к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 880,
    "projectId": 42,
    "tokenId": 7,
    "userId": "-1001234567890",
    "messageType": "user",
    "messageText": "Нужна помощь с заказом",
    "messageData": null,
    "telegramMessageId": 101,
    "createdAt": "2026-08-11T14:00:00.000Z"
  },
  {
    "id": 881,
    "projectId": 42,
    "tokenId": 7,
    "userId": "-1001234567890",
    "messageType": "bot",
    "messageText": "Здравствуйте! Чем помочь?",
    "messageData": {
      "sentFromAdmin": true
    },
    "telegramMessageId": 102,
    "createdAt": "2026-08-11T14:01:00.000Z"
  }
]
```

### `POST` /api/projects/{projectId}/groups/{groupId}/sync

Синхронизировать группу из Telegram

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Актуализирует название, тип и аватарку через `getChat`. Нет записи — создаёт. `tokenId` — бот для Telegram. **Клиент:** `use-sync-groups`.

```bash
curl -s -X POST -b cookies.txt \
  'http://localhost:5000/api/projects/42/groups/-1001234567890/sync?tokenId=7'
```

**Operation ID:** `post_api_projects_projectId_groups_groupId_sync_cff8ec3800b1a8f5`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `groupId` | path | да | Telegram chat_id группы | `"-1001234567890"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Группа обновлена или создана |
| 400 | Нет токена или Telegram отклонил getChat |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "synced": true,
  "group": {
    "id": 15,
    "projectId": 42,
    "groupId": "-1001234567890",
    "name": "Поддержка клиентов",
    "url": "https://t.me/support_chat",
    "isAdmin": 1,
    "isActive": 1,
    "avatarUrl": "/api/projects/42/telegram-file?fileId=AgAC&tokenId=7",
    "chatType": "supergroup",
    "createdAt": "2026-08-01T10:00:00.000Z",
    "updatedAt": "2026-08-11T12:00:00.000Z"
  }
}
```

### `GET` /api/projects/{projectId}/groups/analytics/growth

Динамика первого сохранения групп

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `get_api_projects_projectId_groups_analytics_growth_15ba3ac74779edfa`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | — |
| `tokenId` | query | нет | — | — |
| `granularity` | query | нет | — | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Временной ряд |
| 401 | Нет авторизации |
| 403 | Нет доступа к проекту |

### `GET` /api/projects/{projectId}/groups/analytics/stats

Текущая сводка уникальных групп

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `get_api_projects_projectId_groups_analytics_stats_aa285e468c00104f`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | — |
| `tokenId` | query | нет | — | — |
| `granularity` | query | нет | — | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Счётчики групп |
| 401 | Нет авторизации |
| 403 | Нет доступа к проекту |
