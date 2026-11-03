# media

Эндпоинтов: **14**

### `DELETE` /api/media/{id}

Удалить медиафайл

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

`requireMediaOwnership`. **Клиент:** `use-media`.

```bash
curl -s -X DELETE http://localhost:5000/api/media/10 -b cookies.txt
```

**Operation ID:** `delete_api_media_id_19c3cd63827c601d`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи media_files | `"10"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалён |
| 401 | Не авторизован |
| 403 | Чужой файл |

### `GET` /api/media/{id}

Медиафайл по ID

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

`requireMediaOwnership`. UI почти не вызывает (список через project).

```bash
curl -s http://localhost:5000/api/media/10 -b cookies.txt
```

**Operation ID:** `get_api_media_id_21beeb57c73216ab`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи media_files | `"10"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Один файл |
| 401 | Не авторизован |
| 403 | Чужой файл |
| 404 | Не найден |

#### Пример ответа `200`

```json
{
  "id": 10,
  "projectId": 42,
  "fileName": "photo.jpg",
  "fileType": "photo",
  "fileSize": 12345,
  "mimeType": "image/jpeg",
  "url": "/uploads/42/2026-08-08/photo.jpg",
  "description": null,
  "tags": [],
  "usageCount": 0,
  "storageBackend": "local",
  "createdAt": "2026-08-08T12:00:00.000Z"
}
```

### `PUT` /api/media/{id}

Обновить метаданные медиа

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

`requireMediaOwnership`. **Клиент:** `use-media` / thumbnail.

```bash
curl -s -X PUT http://localhost:5000/api/media/10 -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"description":"cover"}'
```

**Operation ID:** `put_api_media_id_770b51618f2aeccc`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи media_files | `"10"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённый файл |
| 401 | Не авторизован |
| 403 | Чужой файл |

#### Пример ответа `200`

```json
{
  "id": 10,
  "projectId": 42,
  "fileName": "photo.jpg",
  "fileType": "photo",
  "fileSize": 12345,
  "mimeType": "image/jpeg",
  "url": "/uploads/42/2026-08-08/photo.jpg",
  "description": null,
  "tags": [],
  "usageCount": 0,
  "storageBackend": "local",
  "createdAt": "2026-08-08T12:00:00.000Z"
}
```

### `POST` /api/media/{id}/file-id

Upsert Telegram file_id для токена

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

`requireMediaFileOwnership`. Для бот/integration; UI не вызывает.

```bash
curl -s -X POST http://localhost:5000/api/media/10/file-id -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"tokenId":7,"fileId":"AgAC…"}'
```

**Operation ID:** `post_api_media_id_file_id_e4c37d8f2dbca16d`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи media_files | `"10"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | file_id сохранён |
| 401 | Не авторизован |
| 403 | Нет доступа |

### `POST` /api/media/{id}/use

Инкремент usageCount

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

`requireMediaOwnership`. **Клиент:** `use-media`.

```bash
curl -s -X POST http://localhost:5000/api/media/10/use -b cookies.txt
```

**Operation ID:** `post_api_media_id_use_d1b6a2dd2dece99e`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи media_files | `"10"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Счётчик обновлён |
| 401 | Не авторизован |
| 403 | Чужой файл |

### `POST` /api/media/check-url

Проверить внешний URL медиа

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Probe доступности/типа URL. SSRF ограничен `validateExternalUrl`. Только global auth (без projectId). **Клиент:** url-downloader.

```bash
curl -s -X POST http://localhost:5000/api/media/check-url -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"url":"https://example.com/a.jpg"}'
```

**Operation ID:** `post_api_media_check_url_fc6a6ae4ef637a12`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "url": "https://example.com/a.jpg"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Результат проверки |
| 401 | Не авторизован |

### `POST` /api/media/download-url/{projectId}

Скачать один URL в медиа проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

`requireProjectAccess` + SSRF-check. **Клиент:** url-downloader.

```bash
curl -s -X POST http://localhost:5000/api/media/download-url/42 -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"url":"https://example.com/a.jpg"}'
```

**Operation ID:** `post_api_media_download_url_projectId_33fdeb53ce180018`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта bot_projects | `"42"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "url": "https://example.com/a.jpg"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Созданный media_files |
| 401 | Не авторизован |
| 403 | Нет доступа |

### `POST` /api/media/download-urls/{projectId}

Скачать несколько URL в медиа проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Batch download. `requireProjectAccess`. **Клиент:** url-downloader.

```bash
curl -s -X POST http://localhost:5000/api/media/download-urls/42 -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"urls":["https://example.com/a.jpg"]}'
```

**Operation ID:** `post_api_media_download_urls_projectId_d90993814e4c3b1f`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта bot_projects | `"42"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "urls": [
    "https://example.com/a.jpg"
  ]
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Результаты batch |
| 401 | Не авторизован |
| 403 | Нет доступа |

### `GET` /api/media/project/{projectId}

Список медиафайлов проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

`requireProjectAccess`. **Клиент:** `use-media`.

```bash
curl -s http://localhost:5000/api/media/project/42 -b cookies.txt
```

**Operation ID:** `get_api_media_project_projectId_6181a4bfb0ade2ef`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта bot_projects | `"42"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив media_files (+ метаданные токенов при наличии) |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
[
  {
    "id": 10,
    "projectId": 42,
    "fileName": "photo.jpg",
    "fileType": "photo",
    "fileSize": 12345,
    "mimeType": "image/jpeg",
    "url": "/uploads/42/2026-08-08/photo.jpg",
    "description": null,
    "tags": [],
    "usageCount": 0,
    "storageBackend": "local",
    "createdAt": "2026-08-08T12:00:00.000Z"
  }
]
```

### `GET` /api/media/s3-proxy/{configId}/*

Прочитать зарегистрированный приватный объект S3

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Звёздочка — остаток пути ключа Express. Требуется запись media_files и доступ к её проекту. Content-Type определяется расширением, Cache-Control:private.

**Operation ID:** `get_api_media_s3_proxy_configId_7050280ebaf884d9`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `configId` | path | да | — | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Поток байтов объекта |
| 401 | Нет авторизации |
| 403 | Нет доступа к проекту файла |
| 404 | Объект, ключ, хранилище или запись отсутствует; JSON либо пустое тело |
| 502 | Хранилище не прочитано; пустое тело ответа |

### `GET` /api/media/search/{projectId}

Поиск медиафайлов проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Query `q` — строка поиска. `requireProjectAccess`. **Клиент:** `use-media`.

```bash
curl -s 'http://localhost:5000/api/media/search/42?q=photo' -b cookies.txt
```

**Operation ID:** `get_api_media_search_projectId_b04f9303dc72dfd1`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта bot_projects | `"42"` |
| `q` | query | нет | Строка поиска по имени/тегам | `"photo"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Найденные файлы |
| 401 | Не авторизован |
| 403 | Нет доступа |

#### Пример ответа `200`

```json
[
  {
    "id": 10,
    "projectId": 42,
    "fileName": "photo.jpg",
    "fileType": "photo",
    "fileSize": 12345,
    "mimeType": "image/jpeg",
    "url": "/uploads/42/2026-08-08/photo.jpg",
    "description": null,
    "tags": [],
    "usageCount": 0,
    "storageBackend": "local",
    "createdAt": "2026-08-08T12:00:00.000Z"
  }
]
```

### `POST` /api/media/upload-from-url

Сохранить картинку по URL/base64 в uploads/

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Пишет файл в `uploads/{projectId}/…`. **Доступ:** `hasProjectAccess(projectId)` (раньше не проверялся — IDOR закрыт).

UI сейчас почти не вызывает.

```bash
curl -s -X POST http://localhost:5000/api/media/upload-from-url -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"projectId":42,"nodeName":"start","imageUrl":"https://example.com/a.jpg"}'
```

**Operation ID:** `post_api_media_upload_from_url_71d824bbd7a627c3`

**Тело запроса:** `UploadMediaFromUrlRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "projectId": 42,
  "nodeName": "start",
  "imageUrl": "https://example.com/a.jpg"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Файл сохранён |
| 400 | Нет projectId/nodeName |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |

### `POST` /api/media/upload-multiple/{projectId}

Загрузить до 20 файлов (multipart)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

multipart field `files` (≤20). `requireProjectAccess`.

```bash
curl -s -X POST http://localhost:5000/api/media/upload-multiple/42 -b cookies.txt -F files=@a.jpg -F files=@b.jpg
```

**Operation ID:** `post_api_media_upload_multiple_projectId_c5fb62f82cb55856`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта bot_projects | `"42"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив созданных файлов |
| 401 | Не авторизован |
| 403 | Нет доступа |

### `POST` /api/media/upload/{projectId}

Загрузить один файл (multipart)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

multipart field `file`. `requireProjectAccess`. **Клиент:** `use-media`.

```bash
curl -s -X POST http://localhost:5000/api/media/upload/42 -b cookies.txt -F file=@photo.jpg
```

**Operation ID:** `post_api_media_upload_projectId_791f7ee37609ac2a`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта bot_projects | `"42"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Созданный media_files |
| 401 | Не авторизован |
| 403 | Нет доступа |

#### Пример ответа `200`

```json
{
  "id": 10,
  "projectId": 42,
  "fileName": "photo.jpg",
  "fileType": "photo",
  "fileSize": 12345,
  "mimeType": "image/jpeg",
  "url": "/uploads/42/2026-08-08/photo.jpg",
  "description": null,
  "tags": [],
  "usageCount": 0,
  "storageBackend": "local",
  "createdAt": "2026-08-08T12:00:00.000Z"
}
```
