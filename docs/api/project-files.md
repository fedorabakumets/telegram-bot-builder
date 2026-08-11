# project-files

Эндпоинтов: **4**

### `DELETE` /api/projects/{projectId}/files

Удалить файлы проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Массовое удаление из «Файлы». Предпочтительно `{ items: [{ id, source }] }` (вкладка «Все»). Легаси: `{ ids, source }` (`source` ≠ all). `uploaded` — media_files+диск; incoming/outgoing — bot_messages.

**Клиент:** `use-file-delete-mutation`.

```bash
curl -s -X DELETE -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"items":[{"id":88,"source":"uploaded"}]}' \
  'http://localhost:5000/api/projects/42/files'
```

**Тело запроса:** `ProjectFilesDeleteRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "items": [
    {
      "id": 88,
      "source": "uploaded"
    },
    {
      "id": 501,
      "source": "incoming"
    }
  ]
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сколько записей удалено |
| 400 | Пустой/неверный body |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
{
  "success": true,
  "deleted": 2
}
```

### `GET` /api/projects/{projectId}/files

Список файлов проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Таблица «Файлы»: `uploaded` / входящие / исходящие / `all`. Фильтры: имя, даты, тип, сотрудник, размер, хранилище, `tokenId`. Пагинация `page`/`limit`.

**Auth:** cookie или Bearer PAT + доступ к проекту. **Клиент:** `use-project-files`.

```bash
curl -s -b cookies.txt \
  'http://localhost:5000/api/projects/42/files?category=uploaded&page=1'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `category` | query | нет | all | incoming | outgoing | uploaded | `"uploaded"` |
| `source` | query | нет | — | `"uploaded"` |
| `fileName` | query | нет | — | `"photo"` |
| `dateFrom` | query | нет | — | `"2026-08-01"` |
| `dateTo` | query | нет | — | `"2026-08-12"` |
| `mediaType` | query | нет | — | `"photo"` |
| `uploadedBy` | query | нет | — | `"1001"` |
| `sizeMin` | query | нет | — | `"1024"` |
| `sizeMax` | query | нет | — | `"10485760"` |
| `storageConfigId` | query | нет | — | `"local-default"` |
| `tokenId` | query | нет | — | `"7"` |
| `page` | query | нет | — | `"1"` |
| `limit` | query | нет | — | `"50"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Страница файлов |
| 400 | Нет/неверный category |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
{
  "files": [
    {
      "id": 88,
      "source": "uploaded",
      "mediaType": "photo",
      "fileId": "AgACAgIAAxkBAA",
      "fileName": "cover.jpg",
      "fileSize": 245760,
      "createdAt": "2026-08-11T12:00:00.000Z"
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 50
}
```

### `GET` /api/projects/{projectId}/storage-quota

Квота локального хранилища

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Занято байт по локальным бэкендам проекта, лимит (`STORAGE_LIMIT_GB`, null = безлимит) и мягкий флаг `quotaExceeded`. S3 в квоту не входит.

**Клиент:** `StorageQuotaBar` / `use-storage-quota`.

```bash
curl -s -b cookies.txt 'http://localhost:5000/api/projects/42/storage-quota'
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
| 200 | Квота |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
{
  "usedBytes": 52428800,
  "limitBytes": 1073741824,
  "quotaExceeded": false
}
```

### `GET` /api/projects/{projectId}/telegram-file

Прокси файла из Telegram CDN

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Стримит файл по `fileId` через бота проекта (токен не светится клиенту). Поддерживает Range. Cache-Control: private. Превью в таблице файлов, диалогах, медиа-карточках.

```bash
curl -s -o out.jpg -b cookies.txt \
  'http://localhost:5000/api/projects/42/telegram-file?fileId=AgAC&tokenId=7'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `fileId` | query | да | Telegram file_id | `"AgACAgIAAxkBAA"` |
| `tokenId` | query | нет | ID токена бота | `"7"` |
| `fileName` | query | нет | — | `"photo.jpg"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Байты файла (или 206 Partial Content) |
| 400 | Нет fileId / projectId |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 404 | Нет токена или файла в Telegram |
