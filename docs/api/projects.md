# projects

Эндпоинтов: **16**

### `GET` /api/projects

Полный список проектов (со сценарием data)

**Авторизация:** Cookie (`connect.sid`)

Сырые записи `bot_projects` владельца/коллаборатора, **включая** `data` (весь сценарий). Может содержать устаревшее поле `botToken`.

**Параметры:** path/query/body нет. Auth — cookie или Bearer PAT.

**Клиент:** сайдбар редактора (`use-projects-query`), canvas, bot-queries.

Для списков в UI предпочтительнее `GET /api/projects/list`; полный сценарий — `GET /api/projects/{id}`.

```bash
curl -s http://localhost:5000/api/projects -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив полных BotProject |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 42,
    "ownerId": 123456789,
    "name": "Мой бот",
    "description": "Приветственный бот",
    "data": {
      "sheets": [
        {
          "id": "main",
          "name": "Основной",
          "nodes": [],
          "edges": []
        }
      ]
    },
    "botToken": null,
    "sessionId": null,
    "userDatabaseEnabled": 1,
    "sortOrder": 0,
    "adminIds": null,
    "createdAt": "2026-08-01T10:00:00.000Z",
    "updatedAt": "2026-08-11T12:00:00.000Z"
  }
]
```

### `POST` /api/projects

Создать проект

**Авторизация:** Cookie (`connect.sid`)

Создаёт проект для текущего пользователя. **`ownerId` берётся из сессии**, поле в body игнорируется. После insert создаётся таблица `_content`, шлётся live-событие `projects-changed`.

**Тело:** `name` обязателен; `data` — опциональный стартовый сценарий.

**Клиент:** home, сайдбар, NoProjectsScreen, импорт.

```bash
curl -s -X POST http://localhost:5000/api/projects -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"name":"Мой бот"}'
```

**Тело запроса:** `CreateProjectRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Мой бот",
  "description": "Приветственный бот",
  "data": {
    "sheets": [
      {
        "id": "main",
        "nodes": [],
        "edges": []
      }
    ]
  },
  "userDatabaseEnabled": 1,
  "sortOrder": 0
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Проект создан |
| 400 | Ошибка валидации Zod |
| 401 | Гость без Telegram-сессии (ownerId === null) |
| 500 | Ошибка БД / создания |

#### Пример ответа `201`

```json
{
  "id": 42,
  "ownerId": 123456789,
  "name": "Мой бот",
  "description": "Приветственный бот",
  "data": {
    "sheets": [
      {
        "id": "main",
        "name": "Основной",
        "nodes": [],
        "edges": []
      }
    ]
  },
  "botToken": null,
  "sessionId": null,
  "userDatabaseEnabled": 1,
  "sortOrder": 0,
  "adminIds": null,
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-11T12:00:00.000Z"
}
```

### `DELETE` /api/projects/{id}

Удалить проект

**Авторизация:** Cookie (`connect.sid`)

Останавливает бота, удаляет токены, медиа, user data и проект. Шлёт `projects-changed` (deleted) членам команды.

**Auth:** cookie / Bearer PAT + `requireProjectAccess` (владелец или collaborator).

**Клиент:** сайдбар / удаление проекта.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42 -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Проект удалён |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет прав на удаление |
| 404 | Проект не найден |
| 500 | Сбой очистки связанных данных |

#### Пример ответа `200`

```json
{
  "message": "Проект успешно удалён"
}
```

### `GET` /api/projects/{id}

Получить проект по ID

**Авторизация:** Cookie (`connect.sid`)

Полная запись проекта (включая `data` сценария). Доступ: владелец или collaborator (`requireProjectAccess`).

**Параметры:** path `id` — числовой ID проекта.

**Клиент:** редактор (`use-project-loader`), сохранение, MCP.

```bash
curl -s http://localhost:5000/api/projects/42 -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Данные проекта |
| 400 | id не число |
| 401 | Нет session cookie и Bearer PAT |
| 404 | Проект не найден или нет доступа |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "id": 42,
  "ownerId": 123456789,
  "name": "Мой бот",
  "description": "Приветственный бот",
  "data": {
    "sheets": [
      {
        "id": "main",
        "name": "Основной",
        "nodes": [],
        "edges": []
      }
    ]
  },
  "botToken": null,
  "sessionId": null,
  "userDatabaseEnabled": 1,
  "sortOrder": 0,
  "adminIds": null,
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-11T12:00:00.000Z"
}
```

### `PUT` /api/projects/{id}

Обновить проект

**Авторизация:** Cookie (`connect.sid`)

Частичное обновление полей. При изменении `data` — синхронизация `_content`, снимок версии, Redis `bot:table_updated`, canvas-sync.

**Тело:** partial `insertBotProject` + `commitMessage`, `agentEdit`, `agentSessionId`, `agentDisplayName`, `restartOnUpdate`.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** редактор (save), MCP live-edit.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42 -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"name":"Новое имя"}'
```

**Тело запроса:** `UpdateProjectRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Новое имя"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённый проект |
| 400 | Невалидный id или тело (Zod) |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Проект не найден |

#### Пример ответа `200`

```json
{
  "id": 42,
  "ownerId": 123456789,
  "name": "Мой бот",
  "description": "Приветственный бот",
  "data": {
    "sheets": [
      {
        "id": "main",
        "name": "Основной",
        "nodes": [],
        "edges": []
      }
    ]
  },
  "botToken": null,
  "sessionId": null,
  "userDatabaseEnabled": 1,
  "sortOrder": 0,
  "adminIds": null,
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-11T12:00:00.000Z"
}
```

### `GET` /api/projects/{id}/admin-ids

Список ADMIN_IDS проекта

**Авторизация:** Cookie (`connect.sid`)

Читает ID администраторов бота. Сначала `bot_projects.admin_ids`, если пусто — fallback на `ADMIN_IDS` в `.env` папки бота.

**Параметры:** path `id`. Auth — cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** `BotAdminIds` / `use-admin-ids`, генератор кода, шаблон «Менеджер ботов» (HTTP GET).

```bash
curl -s http://localhost:5000/api/projects/42/admin-ids -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Список админов (может быть пустым) |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка чтения БД / .env |

#### Пример ответа `200`

```json
{
  "adminIds": "123456789,987654321",
  "items": [
    {
      "id": "123456789"
    },
    {
      "id": "987654321"
    }
  ],
  "count": 2
}
```

### `PUT` /api/projects/{id}/admin-ids

Заменить ADMIN_IDS проекта

**Авторизация:** Cookie (`connect.sid`)

Полностью перезаписывает список админов в БД. Если есть папка бота — синхронизирует `ADMIN_IDS` в `.env`.

**Тело:** `{ adminIds: "id1,id2" }` — строка через запятую.

**Клиент:** сохранение в профиле бота, панель env, «Менеджер ботов» (добавление админа через PUT).

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/admin-ids -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"adminIds":"123456789,987654321"}'
```

**Тело запроса:** `UpdateAdminIdsRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "adminIds": "123456789,987654321"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Список сохранён |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка записи БД / .env |

#### Пример ответа `200`

```json
{
  "success": true,
  "adminIds": "123456789,987654321"
}
```

### `POST` /api/projects/{id}/admin-ids/remove

Удалить одного администратора из ADMIN_IDS

**Авторизация:** Cookie (`connect.sid`)

Убирает один Telegram ID из списка. Body `adminId` — число или `del_admin_{id}` (callback из шаблона «Менеджер ботов»).

Обновляет БД и `.env` при наличии. Studio UI обычно делает `PUT` с новым списком; этот эндпоинт — для HTTP из бота-менеджера.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/admin-ids/remove \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"adminId":"del_admin_987654321"}'
```

**Тело запроса:** `RemoveAdminIdRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "adminId": "del_admin_987654321"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Админ удалён, возвращён новый список |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка удаления |

#### Пример ответа `200`

```json
{
  "success": true,
  "adminIds": "123456789"
}
```

### `POST` /api/projects/{id}/duplicate

Дублировать проект

**Авторизация:** Cookie (`connect.sid`)

Копия сценария без `botToken`. Имя из body или «{имя} (копия)». Создаёт `_content`, шлёт `projects-changed` (created).

**Ответ:** безопасный `ProjectListItem` (без секретов).

**Auth:** cookie / Bearer PAT + `requireProjectAccess`; гость → 401.

**Клиент:** сайдбар / MCP `db_duplicate_project`.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/duplicate \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"name":"Мой бот (копия)"}'
```

**Тело запроса:** `DuplicateProjectRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Мой бот (копия)"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Копия создана |
| 401 | Гость без Telegram-сессии |
| 403 | Нет доступа к проекту-источнику |
| 404 | Проект-источник не найден |
| 500 | Ошибка создания копии |

#### Пример ответа `201`

```json
{
  "id": 42,
  "ownerId": 123456789,
  "name": "Мой бот",
  "description": "Приветственный бот",
  "userDatabaseEnabled": 1,
  "sortOrder": 0,
  "adminIds": null,
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-11T12:00:00.000Z",
  "nodeCount": 12,
  "sheetsCount": 2
}
```

### `POST` /api/projects/{id}/export

Экспорт Python-кода бота (простой)

**Авторизация:** Cookie (`connect.sid`)

Генерирует код без кэша media `file_id` и без флагов токена. `userDatabaseEnabled` берётся из проекта (`=== 1`). Тело запроса не нужно.

**Ответ:** `{ code }` — строка Python.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** MCP `db_export_project` (`exportProjectInDb`). Полная генерация с media — `POST …/generate`.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/export -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сгенерированный код |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Проект не найден |
| 500 | Ошибка генерации |

#### Пример ответа `200`

```json
{
  "code": "import asyncio\nfrom aiogram import Bot, Dispatcher\n# ...\n"
}
```

### `POST` /api/projects/{id}/generate

Сгенерировать Python-код бота (полный)

**Авторизация:** Cookie (`connect.sid`)

Собирает сценарий проекта в Python. На сервере подтягиваются флаги первого токена (`catchAllHandlers`, `protectContent`, `contentCache`) и кэшированные Telegram `file_id` / обложки медиа из `/uploads/`.

**Тело:** `{ userDatabaseEnabled?, enableLogging? }` — остальное не из body.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** Code panel (`use-code-generator`, mode=server).

Проще экспорт без media/file_ids — `POST …/export`.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/generate -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"userDatabaseEnabled":true,"enableLogging":false}'
```

**Тело запроса:** `GenerateCodeRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "userDatabaseEnabled": true,
  "enableLogging": false
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Код, число строк и timestamp |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Проект не найден |
| 500 | Сбой генератора |

#### Пример ответа `200`

```json
{
  "code": "import asyncio\nfrom aiogram import Bot, Dispatcher\n# ...\n",
  "lines": 2157,
  "generatedAt": 1723392000000
}
```

### `GET` /api/projects/{id}/launches/all

История запусков ботов проекта

**Авторизация:** Cookie (`connect.sid`)

До 100 записей `bot_launch_history` по всем токенам проекта: `status`, `startedAt`, `stoppedAt`, `errorMessage` (до 100 символов). Сортировка по `started_at` DESC.

**Параметры:** path `id`. Query `tokenId` UI может слать, хендлер его не фильтрует.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** системная таблица «Запуски» (`use-system-tables`).

При ошибке БД — **200** с `[]`.

```bash
curl -s http://localhost:5000/api/projects/42/launches/all -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив запусков (или [] при ошибке БД) |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
[
  {
    "status": "stopped",
    "startedAt": "2026-08-08T19:55:00.000Z",
    "stoppedAt": "2026-08-08T20:10:00.000Z",
    "errorMessage": null
  },
  {
    "status": "error",
    "startedAt": "2026-08-07T12:00:00.000Z",
    "stoppedAt": "2026-08-07T12:01:00.000Z",
    "errorMessage": "Token revoked"
  }
]
```

### `GET` /api/projects/{id}/logs/all

Системные логи бота проекта

**Авторизация:** Cookie (`connect.sid`)

Укороченные строки `bot_logs`: `level` (= type), `message` (до 150 символов content), `createdAt` (= timestamp). Сортировка DESC.

**Query:** `limit` (default 200), опционально `tokenId`.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** системная таблица «Логи» (`use-system-tables`).

При ошибке БД хендлер отвечает **200** с `[]` (не 500).

```bash
curl -s 'http://localhost:5000/api/projects/42/logs/all?limit=200&tokenId=7' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `limit` | query | нет | Лимит записей (default 200) | `"200"` |
| `tokenId` | query | нет | Опциональный фильтр bot_logs.token_id | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив логов (или [] при ошибке БД) |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
[
  {
    "level": "stdout",
    "message": "Bot started successfully",
    "createdAt": "2026-08-08T20:00:00.000Z"
  },
  {
    "level": "stderr",
    "message": "Warning: deprecated handler",
    "createdAt": "2026-08-08T19:59:50.000Z"
  }
]
```

### `GET` /api/projects/{projectId}/collaborators

Участники проекта (владелец + коллабораторы)

**Авторизация:** Cookie (`connect.sid`)

Read-only список для Files UI: владелец и приглашённые с именем и аватаркой, без дублей. Не путать с CRUD `/api/bot/projects/{id}/collaborators`.

**Параметры:** path `projectId`. Auth — cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** `use-project-collaborators` — фильтр «Сотрудник», колонка аватара.

```bash
curl -s http://localhost:5000/api/projects/42/collaborators -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | Числовой ID проекта | `"42"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив CollaboratorInfo (может быть пустым) |
| 400 | projectId не число |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Проект не найден |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "userId": 123456789,
    "name": "Иван Иванов",
    "photoUrl": "https://t.me/i/userpic/320/example.jpg"
  },
  {
    "userId": 987654321,
    "name": "@collaborator",
    "photoUrl": null
  }
]
```

### `GET` /api/projects/list

Лёгкий список проектов (без секретов и data)

**Авторизация:** Cookie (`connect.sid`)

Метаданные проектов владельца и коллаборатора: id, name, sortOrder, `nodeCount` / `sheetsCount`. **Без** `data`, `botToken`, `sessionId` (whitelist DTO `toProjectListItem`).

**Параметры:** path/query/body нет. Auth — cookie `connect.sid` или Bearer PAT.

**Клиент:** `App`, home, `use-project-loader`, MCP `db_list_projects`.

Предпочтительнее тяжёлого `GET /api/projects` для списков в UI.

```bash
curl -s http://localhost:5000/api/projects/list -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив ProjectListItem (может быть пустым) |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка БД / маппинга |

#### Пример ответа `200`

```json
[
  {
    "id": 42,
    "ownerId": 123456789,
    "name": "Мой бот",
    "description": "Приветственный бот",
    "userDatabaseEnabled": 1,
    "sortOrder": 0,
    "adminIds": null,
    "createdAt": "2026-08-01T10:00:00.000Z",
    "updatedAt": "2026-08-11T12:00:00.000Z",
    "nodeCount": 12,
    "sheetsCount": 2
  }
]
```

### `PUT` /api/projects/reorder

Изменить порядок проектов в списке

**Авторизация:** Cookie (`connect.sid`)

Задаёт `sortOrder` по порядку ID в теле. После успеха шлёт live-событие `projects-changed` (reordered) владельцу.

**Тело:** `{ projectIds: number[] }` — непустой массив положительных целых. Каждый ID должен быть доступен текущему пользователю (владелец или collaborator); иначе **403** (защита от IDOR).

**Клиент:** drag-and-drop в сайдбаре, MCP `db_reorder_projects`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/reorder -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"projectIds":[42,7,15]}'
```

**Тело запроса:** `ReorderProjectsRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "projectIds": [
    42,
    7,
    15
  ]
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Порядок сохранён |
| 400 | Пустой или невалидный projectIds |
| 401 | Нет session cookie и Bearer PAT / нет личности |
| 403 | Нет доступа хотя бы к одному projectId |
| 500 | Ошибка БД при сохранении порядка |

#### Пример ответа `200`

```json
{
  "success": true
}
```
