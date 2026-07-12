# storage-configs

Эндпоинтов: **5**

### `GET` /api/storage-configs

Список конфигов хранилищ

**Авторизация:** Cookie (`connect.sid`)

Все записи storage_configs в безопасном DTO: без secretsEnc и расшифрованных кредов, только флаг hasSecrets.

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив конфигов |

### `POST` /api/storage-configs

Создать конфиг хранилища

**Авторизация:** Cookie (`connect.sid`)

Регистрирует local или S3 бэкенд. Креды S3 шифруются в secretsEnc. После создания перестраивается storage registry.

**Тело запроса:** `CreateStorageConfigRequest`

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Конфиг создан |
| 400 | Невалидные данные или нет STORAGE_ENCRYPTION_KEY |
| 409 | Конфиг с таким id уже существует |

### `DELETE` /api/storage-configs/{id}

DELETE /api/storage-configs/{id}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |

### `PATCH` /api/storage-configs/{id}

PATCH /api/storage-configs/{id}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |

### `POST` /api/storage-configs/{id}/test

POST /api/storage-configs/{id}/test

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |
