# storage-configs

Эндпоинтов: **5**

### `GET` /api/storage-configs

Список конфигов хранилищ

**Авторизация:** Cookie (`connect.sid`)

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

### `POST` /api/storage-configs

Создать конфиг хранилища

**Авторизация:** Cookie (`connect.sid`)

Регистрирует **local** или **S3** с `isActive=false` (активация — `PATCH`).

**S3:** `s3AccessKeyId` + `s3SecretAccessKey` → шифрование в `secretsEnc` (нужен `STORAGE_ENCRYPTION_KEY`). В ответе секретов нет (`hasSecrets`).

После успеха — `StorageRegistry.reload()`. **Не отдаёт** ключи и `secretsEnc`.

**Тело запроса:** `CreateStorageConfigRequest`

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

**Авторизация:** Cookie (`connect.sid`)

Удаляет запись и перезагружает реестр.

**409:** есть `media_files` с этим `storageConfigId` — в теле `filesCount`.

**Отдаёт:** `{ ok: true, id }`. Объекты на диске/S3 этим вызовом не удаляются.

**Параметры:** 1

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

**Авторизация:** Cookie (`connect.sid`)

Частичное обновление: имя, `config` (**полная замена** объекта), `readOnly`, креды S3, `isActive`.

**Set-active:** `isActive: true` снимает активность у остальных.

**Креды:** пара ключей перешифровывается; без полей — старые секреты не трогаются.

**Отдаёт** DTO без секретов. После успеха — `StorageRegistry.reload()`.

**Тело запроса:** `UpdateStorageConfigRequest`

**Параметры:** 1

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

**Авторизация:** Cookie (`connect.sid`)

Connectivity-check **без** активации.

- **local:** папка writable или создаётся;
- **s3:** `HeadBucket` (fallback `ListObjectsV2`).

**200** `{ ok: true, message }` · **400** `{ ok: false, message }` (без секретов).
Активация — отдельно `PATCH` с `isActive: true`.

**Параметры:** 1

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Хранилище доступно |
| 400 | Проверка не прошла |
| 401 | Не авторизован |
| 404 | Хранилище не найдено |
| 503 | Приложение не настроено |
