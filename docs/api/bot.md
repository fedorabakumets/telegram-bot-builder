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

**Кто может:** `resolveBotApiActor` + `requireBotEnvVariableOwnership` (actor = session/PAT user или telegram_id при scope `bot_manager`).

UI Studio этот путь **не вызывает** (см. nested `/env-variables/…/reveal`).

```bash
curl -s 'http://localhost:5000/api/bot/env/15/reveal?telegram_id=123456' \
  -H 'Authorization: Bearer mcp_…'   # PAT с bot_manager или свой id
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

Список проектов актора

**Авторизация:** Cookie (`connect.sid`)

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Кто действует (actor):**
- Личная сессия / обычный PAT: actor = `req.user.id`. Query `telegram_id`, если передан, **обязан совпадать** (иначе 403).
- PAT со scope **`bot_manager`**: actor = query `telegram_id` (обязателен). Так работает шаблон Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}` (значение — PAT с `bot_manager`, кладётся в server env и в env бота).

**Не безопасно:** вызывать с чужим `telegram_id` под обычным логином — будет 403.

Safe DTO без data/token. **Клиент:** Bot Manager; UI не зовёт.

```bash
# bot_manager PAT
curl -s 'http://localhost:5000/api/bot/projects?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'

# личная сессия (telegram_id = свой или опустить)
curl -s 'http://localhost:5000/api/bot/projects' -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | items + count |
| 400 | bot_manager без telegram_id / некорректный id |
| 401 | Нет session/PAT |
| 403 | telegram_id ≠ авторизованный user (без bot_manager) |

#### Пример ответа `200`

```json
{
  "items": [
    {
      "id": 42,
      "name": "Мой бот",
      "description": ""
    }
  ],
  "count": 1
}
```

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

Список коллабораторов проекта

**Авторизация:** Cookie (`connect.sid`)

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Кто действует (actor):**
- Личная сессия / обычный PAT: actor = `req.user.id`. Query `telegram_id`, если передан, **обязан совпадать** (иначе 403).
- PAT со scope **`bot_manager`**: actor = query `telegram_id` (обязателен). Так работает шаблон Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}` (значение — PAT с `bot_manager`, кладётся в server env и в env бота).

**Не безопасно:** вызывать с чужим `telegram_id` под обычным логином — будет 403.

**Клиент:** `use-collaborators` (UI). Write-операции collaborators только здесь.

```bash
curl -s 'http://localhost:5000/api/bot/projects/42/collaborators?telegram_id=123' -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Список коллабораторов |
| 401 | Не авторизован |
| 403 | Нет доступа / чужой telegram_id |

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

Импорт project.json → новый проект

**Авторизация:** Cookie (`connect.sid`)

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Кто действует (actor):**
- Личная сессия / обычный PAT: actor = `req.user.id`. Query `telegram_id`, если передан, **обязан совпадать** (иначе 403).
- PAT со scope **`bot_manager`**: actor = query `telegram_id` (обязателен). Так работает шаблон Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}` (значение — PAT с `bot_manager`, кладётся в server env и в env бота).

**Не безопасно:** вызывать с чужим `telegram_id` под обычным логином — будет 403.

**Клиент:** `use-no-projects` (session + свой telegram_id) и Bot Manager.

```bash
curl -s -X POST 'http://localhost:5000/api/bot/projects/import?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' -d @project.json
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Созданный проект |
| 401 | Не авторизован |
| 403 | Чужой telegram_id без bot_manager |

#### Пример ответа `200`

```json
{
  "id": 55
}
```

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

Статус инстанса бота по tokenId

**Авторизация:** Cookie (`connect.sid`)

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Кто действует (actor):**
- Личная сессия / обычный PAT: actor = `req.user.id`. Query `telegram_id`, если передан, **обязан совпадать** (иначе 403).
- PAT со scope **`bot_manager`**: actor = query `telegram_id` (обязателен). Так работает шаблон Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}` (значение — PAT с `bot_manager`, кладётся в server env и в env бота).

**Не безопасно:** вызывать с чужим `telegram_id` под обычным логином — будет 403.

Доступ: actor имеет hasProjectAccess к проекту токена. Секрет token в ответе не отдаётся. **Клиент:** Bot Manager, `lib/bot-tools`.

```bash
curl -s 'http://localhost:5000/api/bot/tokens/7/status?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `tokenId` | path | да | ID токена или token_7 | `"7"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Статус + instance (без token) |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту токена |
| 404 | Токен не найден |

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
