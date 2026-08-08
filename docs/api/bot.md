# bot

Эндпоинтов: **24**

### `DELETE` /api/bot/env/{id}

DELETE /api/bot/env/{id}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `PATCH` /api/bot/env/{id}

PATCH /api/bot/env/{id}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/env/{id}/reveal

Раскрыть секретное значение env (legacy)

**Авторизация:** Cookie (`connect.sid`)

**Риск:** ответ содержит **сырое** значение env (`API keys`, пароли, webhook secrets). В списке переменных секреты маскируются; этот путь — кнопка «показать». Любой владелец/collaborator проекта может прочитать все secret env токена. Не логируйте тело ответа (прокси, HAR, access logs).

**Кто может:** `requireEnvVariableOwnership` — владелец/collaborator проекта, к которому привязан токен переменной (env → token → project). Дополнительно query `telegram_id` должен иметь `hasProjectAccess`.

UI Studio этот путь **не вызывает** (см. nested `/env-variables/…/reveal`).

```bash
curl -s 'http://localhost:5000/api/bot/env/15/reveal?telegram_id=123456' -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи bot_env_variables | `"15"` |
| `telegram_id` | query | да | Telegram user id для повторной проверки hasProjectAccess | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сырое значение (секрет) |
| 400 | Нет telegram_id или некорректный id |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту токена |
| 404 | Переменная или токен не найдены |

#### Пример ответа `200`

```json
{
  "value": "super-secret-api-key"
}
```

### `GET` /api/bot/projects

GET /api/bot/projects

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/bot/projects

POST /api/bot/projects

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `DELETE` /api/bot/projects/{id}

DELETE /api/bot/projects/{id}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/projects/{id}

GET /api/bot/projects/{id}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `PATCH` /api/bot/projects/{id}

PATCH /api/bot/projects/{id}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/projects/{id}/collaborators

GET /api/bot/projects/{id}/collaborators

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/bot/projects/{id}/collaborators

POST /api/bot/projects/{id}/collaborators

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `DELETE` /api/bot/projects/{id}/collaborators/{userId}

DELETE /api/bot/projects/{id}/collaborators/{userId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `PUT` /api/bot/projects/{id}/data

PUT /api/bot/projects/{id}/data

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/projects/{id}/export

GET /api/bot/projects/{id}/export

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/projects/{id}/tokens

GET /api/bot/projects/{id}/tokens

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/bot/projects/{id}/tokens

POST /api/bot/projects/{id}/tokens

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/bot/projects/import

POST /api/bot/projects/import

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `DELETE` /api/bot/tokens/{tokenId}

DELETE /api/bot/tokens/{tokenId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/tokens/{tokenId}/env

GET /api/bot/tokens/{tokenId}/env

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/bot/tokens/{tokenId}/env

POST /api/bot/tokens/{tokenId}/env

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/tokens/{tokenId}/photo

GET /api/bot/tokens/{tokenId}/photo

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/tokens/{tokenId}/stats

GET /api/bot/tokens/{tokenId}/stats

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/tokens/{tokenId}/status

GET /api/bot/tokens/{tokenId}/status

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/tokens/{tokenId}/users

GET /api/bot/tokens/{tokenId}/users

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/bot/tokens/{tokenId}/users/{userId}

GET /api/bot/tokens/{tokenId}/users/{userId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |
