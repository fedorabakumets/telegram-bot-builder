# project-tables

Эндпоинтов: **13**

### `GET` /api/projects/{id}/tables

Список таблиц контента проекта

**Авторизация:** Cookie (`connect.sid`)

Пользовательские таблицы `bot_tables` для панели Database в редакторе.

**Тег:** `project-tables` (вместе с CRUD tables/rows/columns).

**Доступ:** `requireProjectAccess` (владелец / collaborator).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s http://localhost:5000/api/projects/42/tables -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без cookie и без PAT — 401. | `"s%3Axxxx.yyyy"` |

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

POST /api/projects/{id}/tables

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `DELETE` /api/projects/{id}/tables/{tableId}

DELETE /api/projects/{id}/tables/{tableId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `PUT` /api/projects/{id}/tables/{tableId}

PUT /api/projects/{id}/tables/{tableId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{id}/tables/{tableId}/columns

GET /api/projects/{id}/tables/{tableId}/columns

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/projects/{id}/tables/{tableId}/columns

POST /api/projects/{id}/tables/{tableId}/columns

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `DELETE` /api/projects/{id}/tables/{tableId}/columns/{columnId}

DELETE /api/projects/{id}/tables/{tableId}/columns/{columnId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `PUT` /api/projects/{id}/tables/{tableId}/columns/{columnId}

PUT /api/projects/{id}/tables/{tableId}/columns/{columnId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{id}/tables/{tableId}/rows

GET /api/projects/{id}/tables/{tableId}/rows

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/projects/{id}/tables/{tableId}/rows

POST /api/projects/{id}/tables/{tableId}/rows

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `DELETE` /api/projects/{id}/tables/{tableId}/rows/{rowId}

DELETE /api/projects/{id}/tables/{tableId}/rows/{rowId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `PUT` /api/projects/{id}/tables/{tableId}/rows/{rowId}

PUT /api/projects/{id}/tables/{tableId}/rows/{rowId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/projects/{id}/tables/{tableId}/rows/reindex

POST /api/projects/{id}/tables/{tableId}/rows/reindex

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |
