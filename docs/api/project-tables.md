# project-tables

Эндпоинтов: **13**

### `GET` /api/projects/{id}/tables

Список таблиц контента проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Пользовательские таблицы `bot_tables` для панели Database в редакторе.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s http://localhost:5000/api/projects/42/tables -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив таблиц |
| 400 | Некорректный ID проекта |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 1,
    "projectId": 42,
    "name": "Товары",
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
]
```

### `POST` /api/projects/{id}/tables

Создать таблицу контента

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Создаёт `bot_tables` с полем `name`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tables -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"name":"Товары"}'
```

**Тело запроса:** `CreateBotTableBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Товары"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Созданная таблица |
| 400 | Нет name или некорректный ID проекта |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `201`

```json
{
  "id": 1,
  "projectId": 42,
  "name": "Товары",
  "createdAt": "2026-08-01T10:00:00.000Z"
}
```

### `DELETE` /api/projects/{id}/tables/{tableId}

Удалить таблицу

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет таблицу и связанные колонки/строки (CASCADE).

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/tables/1 -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалено |
| 400 | Некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `PUT` /api/projects/{id}/tables/{tableId}

Переименовать таблицу

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Обновляет `name`. API есть; UI-хук `useRenameTable` в TablesPanel не подключён.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api.renameTable`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tables/1 -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"name":"Услуги"}'
```

**Тело запроса:** `RenameBotTableBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Услуги"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённая таблица |
| 400 | Нет name или некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "id": 1,
  "projectId": 42,
  "name": "Услуги",
  "createdAt": "2026-08-01T10:00:00.000Z"
}
```

### `GET` /api/projects/{id}/tables/{tableId}/columns

Список колонок таблицы

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Колонки `bot_table_columns` для панели Database.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s http://localhost:5000/api/projects/42/tables/1/columns -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив колонок |
| 400 | Некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 3,
    "tableId": 1,
    "name": "Цена",
    "position": 0
  },
  {
    "id": 4,
    "tableId": 1,
    "name": "Название",
    "position": 1
  }
]
```

### `POST` /api/projects/{id}/tables/{tableId}/columns

Создать колонку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Тело: `{ name, position? }` — `position` по умолчанию `0`.

**Auth:** `requireDbReady` + `requireProjectAccess`.

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tables/1/columns \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"name":"Цена","position":0}'
```

**Тело запроса:** `CreateBotTableColumnBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Цена",
  "position": 0
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Созданная колонка |
| 400 | Нет name или некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `201`

```json
{
  "id": 3,
  "tableId": 1,
  "name": "Цена",
  "position": 0
}
```

### `DELETE` /api/projects/{id}/tables/{tableId}/columns/{columnId}

Удалить колонку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет колонку таблицы.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/tables/1/columns/3 \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `columnId` | path | да | ID колонки bot_table_columns | `"3"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалено |
| 400 | Некорректный columnId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Колонка не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `PUT` /api/projects/{id}/tables/{tableId}/columns/{columnId}

Переименовать колонку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Обновляет `name` колонки `bot_table_columns`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tables/1/columns/3 \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"name":"Стоимость"}'
```

**Тело запроса:** `RenameBotTableColumnBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `columnId` | path | да | ID колонки bot_table_columns | `"3"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Стоимость"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённая колонка |
| 400 | Нет name или некорректный columnId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Колонка не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "id": 3,
  "tableId": 1,
  "name": "Стоимость",
  "position": 0
}
```

### `GET` /api/projects/{id}/tables/{tableId}/rows

Список строк таблицы

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Строки `bot_table_rows` с `data: Record<string,string>`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s http://localhost:5000/api/projects/42/tables/1/rows -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив строк |
| 400 | Некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 10,
    "tableId": 1,
    "rowIndex": 0,
    "data": {
      "3": "100",
      "4": "Товар A"
    }
  }
]
```

### `POST` /api/projects/{id}/tables/{tableId}/rows

Создать строки (батч)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Тело `{ rows: [{ rowIndex?, data? }] }` — массив **непустой**. Без `rowIndex` берётся индекс в массиве; `data` по умолчанию `{}`.

**Auth:** `requireDbReady` + `requireProjectAccess`.

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tables/1/rows \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"rows":[{"rowIndex":0,"data":{"3":"100"}}]}'
```

**Тело запроса:** `CreateBotTableRowsBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "rows": [
    {
      "rowIndex": 0,
      "data": {
        "3": "100",
        "4": "Товар A"
      }
    }
  ]
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Созданные строки |
| 400 | Пустой rows или некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `201`

```json
[
  {
    "id": 10,
    "tableId": 1,
    "rowIndex": 0,
    "data": {
      "3": "100",
      "4": "Товар A"
    }
  }
]
```

### `DELETE` /api/projects/{id}/tables/{tableId}/rows/{rowId}

Удалить строку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет строку `bot_table_rows`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/tables/1/rows/10 \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `rowId` | path | да | ID строки bot_table_rows | `"10"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалено |
| 400 | Некорректный rowId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Строка не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `PUT` /api/projects/{id}/tables/{tableId}/rows/{rowId}

Обновить строку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Тело `{ data: object }`. Side-effects: если таблица `_content` — `syncTableToScenario`; Redis `bot:table_updated:{projectId}` с JSON `{tableId}`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tables/1/rows/10 \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"data":{"3":"150","4":"Товар A"}}'
```

**Тело запроса:** `UpdateBotTableRowBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `rowId` | path | да | ID строки bot_table_rows | `"10"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "data": {
    "3": "150",
    "4": "Товар A"
  }
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённая строка |
| 400 | Нет data или некорректный rowId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Строка не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "id": 10,
  "tableId": 1,
  "rowIndex": 0,
  "data": {
    "3": "150",
    "4": "Товар A"
  }
}
```

### `POST` /api/projects/{id}/tables/{tableId}/rows/reindex

Переиндексировать строки

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Пересчитывает `rowIndex` строк таблицы. В Express регистрируется **до** `/rows/:rowId`, чтобы `reindex` не воспринимался как rowId.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tables/1/rows/reindex \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Индексы обновлены |
| 400 | Некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "success": true
}
```
