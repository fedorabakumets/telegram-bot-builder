# project-versions

Эндпоинтов: **6**

### `GET` /api/projects/{id}/versions

Список версий проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Метаданные снимков **без** чтения `snapshot` из БД. Без query-параметров возвращается прежний массив. `limit=1..100` включает постраничный ответ `{items,nextCursor,total}`; `cursor` берётся из предыдущего ответа и используется вместе с `limit` для того же проекта. Порядок: createdAt DESC NULLS LAST, затем id DESC. `authorName` — из Telegram или «ИИ-агент» при `authorKind=agent`.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** VersionsPanel / `useProjectVersions`; MCP `db_list_versions`.

Полный снимок — `GET …/versions/{versionId}`.

```bash
curl -s http://localhost:5000/api/projects/42/versions -b cookies.txt
```

**Operation ID:** `get_api_projects_id_versions_31cd9f007b99014d`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `limit` | query | нет | — | — |
| `cursor` | query | нет | — | — |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив метаданных либо страница при указанном limit |
| 400 | Невалидный ID проекта, размер страницы или курсор |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 7,
    "projectId": 42,
    "label": "Добавил приветствие",
    "authorId": 123456789,
    "authorName": "Иван @ivan",
    "authorKind": null,
    "kind": "manual",
    "createdAt": "2026-08-11T12:00:00.000Z"
  },
  {
    "id": 6,
    "projectId": 42,
    "label": null,
    "authorId": null,
    "authorName": "ИИ-агент",
    "authorKind": "agent",
    "kind": "auto",
    "createdAt": "2026-08-11T11:30:00.000Z"
  }
]
```

### `DELETE` /api/projects/{id}/versions/{versionId}

Удалить одну версию

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Необратимо удаляет запись истории. Broadcast `versions-changed`.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** UI не вызывает. MCP `db_delete_version` / `deleteVersionInDb`.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/versions/7 \
  -b cookies.txt
```

**Operation ID:** `delete_api_projects_id_versions_versionId_6f181ffb26073c67`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `versionId` | path | да | Числовой ID версии | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Результат удаления |
| 400 | Невалидный id / versionId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Версия не найдена или чужой projectId |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "deleted": true
}
```

### `GET` /api/projects/{id}/versions/{versionId}

Версия со snapshot

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Полная запись включая тяжёлый `snapshot` (`project.data`). versionId должен принадлежать проекту, иначе 404.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** diff (`useProjectVersionSnapshot`); MCP restore читает snapshot отсюда и пишет через `PUT /api/projects/{id}`.

```bash
curl -s http://localhost:5000/api/projects/42/versions/7 -b cookies.txt
```

**Operation ID:** `get_api_projects_id_versions_versionId_7da2c2226e9f72ee`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `versionId` | path | да | Числовой ID версии | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Версия со snapshot |
| 400 | Невалидный id / versionId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Версия не найдена или чужой projectId |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "id": 7,
  "projectId": 42,
  "label": "Добавил приветствие",
  "authorId": 123456789,
  "authorName": "Иван @ivan",
  "authorKind": null,
  "kind": "manual",
  "createdAt": "2026-08-11T12:00:00.000Z",
  "snapshot": {
    "sheets": [
      {
        "id": "main",
        "name": "Основной",
        "nodes": [],
        "edges": []
      }
    ],
    "activeSheetId": "main"
  }
}
```

### `POST` /api/projects/{id}/versions/{versionId}/restore

Откатить проект к версии

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Пишет `version.snapshot` в `project.data`, sync `_content`, Redis `bot:table_updated`. Тело не требуется.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** VersionsPanel / `useRestoreProjectVersion`.

**MCP:** этот URL **не** вызывает — читает GET snapshot и делает `PUT /api/projects/{id}` (live + новый чекпоинт отката).

```bash
curl -s -X POST http://localhost:5000/api/projects/42/versions/7/restore \
  -b cookies.txt
```

**Operation ID:** `post_api_projects_id_versions_versionId_restore_3879345e814dca97`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `versionId` | path | да | Числовой ID версии | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённый проект после отката |
| 400 | Невалидный id / versionId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Версия или проект не найдены |
| 500 | Сбой отката |

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
  "updatedAt": "2026-08-11T12:00:00.000Z",
  "isArchivedForMe": false
}
```

### `POST` /api/projects/{id}/versions/commit

Создать ручной чекпоинт версии

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Снимок **текущего** `project.data` с `kind=manual`. Всегда создаётся (без дедупликации). Broadcast `versions-changed`.

**Тело:** `{ message }` — непустая строка после trim.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** CommitForm / `useCreateProjectCommit`. MCP-тула commit нет.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/versions/commit \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"message":"Добавил приветствие"}'
```

**Operation ID:** `post_api_projects_id_versions_commit_26855922d832f1a2`

**Тело запроса:** `VersionCommitRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "message": "Добавил приветствие"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Созданная версия (со snapshot) |
| 400 | Пустой message или невалидный id |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Проект не найден |
| 500 | Сбой создания чекпоинта |

#### Пример ответа `201`

```json
{
  "id": 7,
  "projectId": 42,
  "label": "Добавил приветствие",
  "authorId": 123456789,
  "authorName": "Иван @ivan",
  "authorKind": null,
  "kind": "manual",
  "createdAt": "2026-08-11T12:00:00.000Z",
  "snapshot": {
    "sheets": [
      {
        "id": "main",
        "name": "Основной",
        "nodes": [],
        "edges": []
      }
    ],
    "activeSheetId": "main"
  }
}
```

### `POST` /api/projects/{id}/versions/prune

Массово удалить версии (prune)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Необратимая чистка по фильтру. Broadcast `versions-changed`.

**Тело (все поля опциональны):** `keep` — сколько последних оставить; `kind` — `auto`|`manual`; `authorKind` — `agent`|`user`.

**Auth:** cookie / Bearer PAT + `requireProjectAccess`.

**Клиент:** UI нет. MCP `db_prune_versions`. Авто-prune при save (keep≈30) — отдельный серверный путь, не этот API.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/versions/prune \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"keep":30,"kind":"auto"}'
```

**Operation ID:** `post_api_projects_id_versions_prune_c4d8441128f90f0f`

**Тело запроса:** `VersionPruneRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "keep": 30,
  "kind": "auto"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Число удалённых версий |
| 400 | Невалидный ID проекта |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "deleted": 12
}
```
