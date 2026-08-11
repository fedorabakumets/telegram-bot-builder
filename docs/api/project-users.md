# project-users

Эндпоинтов: **10**

### `DELETE` /api/projects/{id}/users

Удалить всех пользователей и сообщения проекта

**Авторизация:** Cookie (`connect.sid`)

Wipe: DELETE из `bot_users` и `bot_messages` по project_id (и token_id, если задан). `deletedCount` — сумма rowCount обеих таблиц.

**UI:** очистка базы (`use-delete-all-users`). Не путать с DELETE …/users/{userId}.

```bash
curl -s -X DELETE 'http://localhost:5000/api/projects/42/users?tokenId=7' -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | Опциональный token_id бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Данные очищены |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка удаления |

#### Пример ответа `200`

```json
{
  "message": "All user data deleted successfully",
  "deleted": true,
  "deletedCount": 250
}
```

### `GET` /api/projects/{id}/users

Список пользователей и диалогов проекта

**Авторизация:** Cookie (`connect.sid`)

Вкладки «Диалоги» / «Пользователи». С `limit` — `{ users, total, hasMore }`; без `limit` — плоский массив. `dialogKind` фильтрует личные/группы/каналы.

**Auth:** cookie / Bearer PAT (`requireApiAuth`) + проверка доступа к проекту.

**Клиент:** список диалогов, `use-system-tables` (таблица «Пользователи»).

```bash
curl -s 'http://localhost:5000/api/projects/42/users?limit=50&tokenId=7' -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | — | `"7"` |
| `limit` | query | нет | — | `"50"` |
| `offset` | query | нет | — | `"0"` |
| `search` | query | нет | — | `"иван"` |
| `filterActive` | query | нет | — | — |
| `sortBy` | query | нет | — | `"lastInteraction"` |
| `sortDir` | query | нет | — | `"desc"` |
| `dialogKind` | query | нет | — | `"all"` |
| `includeGroups` | query | нет | — | `"true"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Пагинированный список или массив |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
{
  "users": [
    {
      "id": 1,
      "userId": "123456789",
      "userName": "ivan",
      "firstName": "Иван",
      "lastName": "Петров",
      "isActive": true,
      "isGroup": false,
      "interactionCount": 12,
      "lastInteraction": "2026-08-10T12:00:00.000Z"
    }
  ],
  "total": 120,
  "hasMore": true
}
```

### `GET` /api/projects/{id}/users/growth

Прирост пользователей по времени

**Авторизация:** Cookie (`connect.sid`)

С `granularity` (1m|5m|1h|1d|7d|30d) — ряд слотов `generate_series`, date в ISO. Без него — legacy `period` (7d|30d|90d, default 30d), date как YYYY-MM-DD; пустой результат — fallback на 90 дней.

**Клиент:** `use-growth` (всегда шлёт granularity).

```bash
curl -s 'http://localhost:5000/api/projects/42/users/growth?granularity=1d&tokenId=7' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | Опциональный token_id бота | `"7"` |
| `granularity` | query | нет | — | `"1d"` |
| `period` | query | нет | — | `"30d"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив [{ date, count }] |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "date": "2026-08-01T00:00:00.000Z",
    "count": 5
  },
  {
    "date": "2026-08-02T00:00:00.000Z",
    "count": 3
  }
]
```

### `GET` /api/projects/{id}/users/growth-by-source

Прирост пользователей по источникам

**Авторизация:** Cookie (`connect.sid`)

`granularity` обязателен (иначе 400). Ключи `sources` — `COALESCE(deep_link_param,'direct')`. Для 5m — особый truncate минут.

**Клиент:** `use-growth-by-source`.

```bash
curl -s 'http://localhost:5000/api/projects/42/users/growth-by-source?granularity=1d&tokenId=7' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | Опциональный token_id бота | `"7"` |
| `granularity` | query | да | — | `"1d"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив [{ date, sources }] |
| 400 | Нет granularity |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "date": "2026-08-01T00:00:00.000Z",
    "sources": {
      "direct": 3,
      "instagram": 2
    }
  },
  {
    "date": "2026-08-02T00:00:00.000Z",
    "sources": {
      "direct": 1
    }
  }
]
```

### `GET` /api/projects/{id}/users/popular-buttons

Топ-10 популярных inline-кнопок

**Авторизация:** Cookie (`connect.sid`)

Нажатия из `bot_messages` (`message_type=user`, `message_data.button_clicked=true`). Label — `button_text` или `callback_data`. Окно по `granularity` (default как 1d → 30 days).

**Клиент:** `use-popular-buttons`.

```bash
curl -s 'http://localhost:5000/api/projects/42/users/popular-buttons?granularity=1d&tokenId=7' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | Опциональный token_id бота | `"7"` |
| `granularity` | query | нет | — | `"1d"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | До 10 элементов [{ label, count }] |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "label": "Купить",
    "count": 42
  },
  {
    "label": "Помощь",
    "count": 18
  }
]
```

### `GET` /api/projects/{id}/users/stats

Агрегированная статистика пользователей

**Авторизация:** Cookie (`connect.sid`)

Счётчики из `bot_users` + `totalInteractions` из `bot_messages` (COUNT входящих и исходящих). Опциональный `tokenId`.

**Auth:** cookie / Bearer PAT; при известном owner — `hasProjectAccess`.

**Клиент:** `use-stats`, карточки дашборда базы пользователей.

```bash
curl -s 'http://localhost:5000/api/projects/42/users/stats?tokenId=7' -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | Опциональный token_id бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Агрегаты (числа после parseInt на сервере) |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "totalUsers": 150,
  "activeUsers": 120,
  "blockedUsers": 30,
  "premiumUsers": 12,
  "usersWithResponses": 45,
  "totalInteractions": 3200,
  "avgInteractionsPerUser": 21,
  "uniqueLanguages": 5,
  "deepLinkUsers": 40,
  "referralUsers": 18
}
```

### `GET` /api/projects/{id}/users/traffic

Источники трафика и языки пользователей

**Авторизация:** Cookie (`connect.sid`)

`sources` — группировка по `COALESCE(deep_link_param,'direct')` с %. `languages` — топ-20 `language_code` (NULL исключены) с %.

**Клиент:** `use-traffic` (нормализует count/percentage в number).

```bash
curl -s 'http://localhost:5000/api/projects/42/users/traffic?tokenId=7' -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | Опциональный token_id бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | sources + languages |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "sources": [
    {
      "param": "direct",
      "count": 80,
      "percentage": 53.3
    },
    {
      "param": "instagram",
      "count": 40,
      "percentage": 26.7
    }
  ],
  "languages": [
    {
      "code": "ru",
      "count": 100,
      "percentage": 66.7
    },
    {
      "code": "en",
      "count": 50,
      "percentage": 33.3
    }
  ]
}
```

### `GET` /api/projects/{id}/users/variables

Переменные user_data как таблица

**Авторизация:** Cookie (`connect.sid`)

Пользователи с непустым `user_data`. `columns` = user_id, username + ключи user_data (без `_`/`waiting_`/`input_`). Значения — строки.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** `use-system-tables` (таблица «Переменные»).

```bash
curl -s 'http://localhost:5000/api/projects/42/users/variables?limit=200&tokenId=7' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `tokenId` | query | нет | Опциональный token_id бота | `"7"` |
| `limit` | query | нет | — | `"200"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | { columns, rows } |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту (requireProjectAccess) |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "columns": [
    "user_id",
    "username",
    "city",
    "age"
  ],
  "rows": [
    {
      "user_id": "123",
      "username": "ivan",
      "city": "Москва",
      "age": "25"
    }
  ]
}
```

### `DELETE` /api/projects/{projectId}/users/{userId}

Удалить одного пользователя и его сообщения

**Авторизация:** Cookie (`connect.sid`)

**UI:** удаление пользователя в редакторе.

Удаляет `bot_messages` и строку `bot_users` для (user_id, project_id, token_id).

Не путать с `DELETE /api/projects/{id}/users` — wipe всех пользователей.

```bash
curl -s -X DELETE 'http://localhost:5000/api/projects/42/users/123456789?tokenId=7' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id | `"123456789"` |
| `tokenId` | query | нет | Опциональный token_id бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешное удаление |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Пользователь не найден |
| 503 | Сервис не настроен (setupGuard) |

#### Пример ответа `200`

```json
{
  "message": "User data deleted successfully"
}
```

### `PUT` /api/projects/{projectId}/users/{userId}

Обновить статус активности пользователя

**Авторизация:** Cookie (`connect.sid`)

**UI:** активен / неактивен в базе пользователей.

Обновляет `is_active` и `last_interaction`. `tokenId` — в query. Токен через `resolveEffectiveProjectTokenId`.

```bash
curl -s -X PUT 'http://localhost:5000/api/projects/42/users/123456789?tokenId=7' \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"isActive":1}'
```

**Тело запроса:** `UpdateBotUserRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id | `"123456789"` |
| `tokenId` | query | нет | Опциональный token_id бота | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "isActive": 1
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённая строка bot_users |
| 400 | Нет полей для обновления |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Пользователь не найден |
| 503 | Сервис не настроен (setupGuard) |

#### Пример ответа `200`

```json
{
  "user_id": "123456789",
  "project_id": 42,
  "token_id": 7,
  "username": "ivan",
  "first_name": "Иван",
  "is_active": 1
}
```
