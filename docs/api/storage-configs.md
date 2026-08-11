# storage-configs

Эндпоинтов: **5**

### `GET` /api/storage-configs

Список конфигов хранилищ

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Реестр бэкендов медиа: **local** (папка) и **S3**/MinIO.

**Зачем:** UI «Файлы» → «Хранилища»; фильтр файлов; новые загрузки → активное writable (`isActive=true`).

**Отдаёт:** `id`, `name`, `backend`, `isActive`, `config` (несекретные параметры), `readOnly`, `hasSecrets`, `createdAt`.

**Не отдаёт:** `secretsEnc`, access/secret keys — только булев `hasSecrets`.

**Авторизация:** cookie или Bearer PAT. Клиент: `useStorageConfigs`.

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Все записи storage_configs без секретов |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка чтения БД |
| 503 | Приложение не настроено (setupGuard) |

#### Пример ответа `200`

```json
[
  {
    "id": "local-default",
    "name": "Локально: uploads",
    "backend": "local",
    "isActive": true,
    "config": {
      "rootPath": "uploads"
    },
    "readOnly": false,
    "hasSecrets": false,
    "createdAt": "2026-01-15T10:00:00.000Z"
  },
  {
    "id": "s3-main",
    "name": "Основное S3",
    "backend": "s3",
    "isActive": false,
    "config": {
      "bucket": "media",
      "region": "ru-central1"
    },
    "readOnly": false,
    "hasSecrets": true,
    "createdAt": "2026-02-01T12:00:00.000Z"
  }
]
```

### `POST` /api/storage-configs

Создать конфиг хранилища

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Регистрирует **local** или **S3** с `isActive=false` (активация — `PATCH`).

**S3:** `s3AccessKeyId` + `s3SecretAccessKey` → шифрование в `secretsEnc` (нужен `STORAGE_ENCRYPTION_KEY`). В ответе секретов нет (`hasSecrets`).

После успеха — `StorageRegistry.reload()`. **Не отдаёт** ключи и `secretsEnc`.

**Тело запроса:** `CreateStorageConfigRequest`

#### Пример тела запроса

```json
{
  "name": "Загрузки проекта",
  "backend": "local",
  "config": {
    "rootPath": "./uploads/extra"
  }
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Конфиг создан (DTO без секретов) |
| 400 | Валидация или нет STORAGE_ENCRYPTION_KEY |
| 401 | Не авторизован |
| 409 | Конфиг с таким id уже существует |
| 503 | Приложение не настроено |

### `DELETE` /api/storage-configs/{id}

Удалить конфиг хранилища

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет запись и перезагружает реестр.

**409:** есть `media_files` с этим `storageConfigId` — в теле `filesCount`.

**Отдаёт:** `{ ok: true, id }`. Объекты на диске/S3 этим вызовом не удаляются.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи storage_configs (например local-default, s3-main) | `"local-default"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Конфиг удалён |
| 401 | Не авторизован |
| 404 | Хранилище не найдено |
| 409 | На хранилище ещё есть файлы |
| 503 | Приложение не настроено |

### `PATCH` /api/storage-configs/{id}

Обновить конфиг хранилища

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Частичное обновление: имя, `config` (**полная замена** объекта), `readOnly`, креды S3, `isActive`.

**Set-active:** `isActive: true` снимает активность у остальных.

**Креды:** пара ключей перешифровывается; без полей — старые секреты не трогаются.

**Отдаёт** DTO без секретов. После успеха — `StorageRegistry.reload()`.

**Тело запроса:** `UpdateStorageConfigRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи storage_configs (например local-default, s3-main) | `"local-default"` |

#### Пример тела запроса

```json
{
  "isActive": true
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённый DTO |
| 400 | Валидация или нет STORAGE_ENCRYPTION_KEY |
| 401 | Не авторизован |
| 404 | Хранилище не найдено |
| 503 | Приложение не настроено |

### `POST` /api/storage-configs/{id}/test

Проверить доступность хранилища

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Connectivity-check **без** активации.

- **local:** папка writable или создаётся;
- **s3:** `HeadBucket` (fallback `ListObjectsV2`).

**200** `{ ok: true, message }` · **400** `{ ok: false, message }` (без секретов).
Активация — отдельно `PATCH` с `isActive: true`.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи storage_configs (например local-default, s3-main) | `"local-default"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Хранилище доступно |
| 400 | Проверка не прошла |
| 401 | Не авторизован |
| 404 | Хранилище не найдено |
| 503 | Приложение не настроено |

#### Пример ответа `200`

```json
{
  "ok": true,
  "message": "Папка доступна на запись: uploads"
}
```
