# bot

Эндпоинтов: **24**

### `DELETE` /api/bot/env/{id}

Удалить env-переменную

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

**Клиент:** unused.

```bash
curl -s -X DELETE 'http://localhost:5000/api/bot/env/15?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID bot_env_variables | `"15"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалена |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `PATCH` /api/bot/env/{id}

Обновить env-переменную

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Body `{ key?, value?, isSecret? }`. **Клиент:** unused.

```bash
curl -s -X PATCH 'http://localhost:5000/api/bot/env/15?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \
  -d '{"value":"new"}'
```

**Тело запроса:** `BotApiUpdateEnvBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID bot_env_variables | `"15"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлена |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |
| 409 | Конфликт ключа |

### `GET` /api/bot/env/{id}/reveal

Раскрыть секретное значение env (legacy)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

**Риск:** ответ содержит **сырое** значение env. В списке секреты маскируются. Не логируйте тело ответа.

`requireBotEnvVariableOwnership`. UI не вызывает (см. nested). **Клиент:** unused.

```bash
curl -s 'http://localhost:5000/api/bot/env/15/reveal?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи bot_env_variables | `"15"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сырое значение |
| 400 | Некорректный id / bot_manager без telegram_id |
| 401 | Не авторизован |
| 403 | Нет доступа |
| 404 | Не найдено |

#### Пример ответа `200`

```json
{
  "value": "super-secret-api-key"
}
```

### `GET` /api/bot/projects

Список проектов актора

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Safe DTO без data/token. **Клиент:** Bot Manager.

```bash
curl -s 'http://localhost:5000/api/bot/projects?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'
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
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |

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

Создать пустой проект

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Body `{ name? }` (дефолт «Новый проект»). **Клиент:** Bot Manager.

```bash
curl -s -X POST 'http://localhost:5000/api/bot/projects?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \
  -d '{"name":"Новый бот"}'
```

**Тело запроса:** `BotApiCreateProjectBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Созданный проект |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |

#### Пример ответа `200`

```json
{
  "id": 55,
  "name": "Новый бот"
}
```

### `DELETE` /api/bot/projects/{id}

Удалить проект

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Владелец/collaborator. **Клиент:** Bot Manager.

```bash
curl -s -X DELETE 'http://localhost:5000/api/bot/projects/42?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта или project_42 | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалено |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `GET` /api/bot/projects/{id}

Детали проекта (без data)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

hasProjectAccess. **Клиент:** Bot Manager.

```bash
curl -s 'http://localhost:5000/api/bot/projects/42?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта или project_42 | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Метаданные |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "id": 42,
  "name": "Мой бот",
  "description": ""
}
```

### `PATCH` /api/bot/projects/{id}

Переименовать проект

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Body `{ name }`. **Клиент:** Bot Manager.

```bash
curl -s -X PATCH 'http://localhost:5000/api/bot/projects/42?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \
  -d '{"name":"Новое имя"}'
```

**Тело запроса:** `BotApiRenameProjectBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта или project_42 | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлён |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "id": 42,
  "name": "Новое имя"
}
```

### `GET` /api/bot/projects/{id}/collaborators

Список коллабораторов проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

**Клиент:** UI `use-collaborators`.

```bash
curl -s 'http://localhost:5000/api/bot/projects/42/collaborators?telegram_id=123' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта или project_42 | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | items + count |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "items": [
    {
      "projectId": 42,
      "userId": 999,
      "invitedBy": 123
    }
  ],
  "count": 1
}
```

### `POST` /api/bot/projects/{id}/collaborators

Добавить коллаборатора

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Body `{ user_id }`. **Клиент:** UI `use-collaborators`.

```bash
curl -s -X POST 'http://localhost:5000/api/bot/projects/42/collaborators?telegram_id=123' \
  -b cookies.txt -H 'Content-Type: application/json' -d '{"user_id":999}'
```

**Тело запроса:** `BotApiAddCollaboratorBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта или project_42 | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Добавлен |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `DELETE` /api/bot/projects/{id}/collaborators/{userId}

Удалить коллаборатора

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

**Клиент:** UI `use-collaborators`.

```bash
curl -s -X DELETE \
  'http://localhost:5000/api/bot/projects/42/collaborators/999?telegram_id=123' \
  -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user id коллаборатора | `"123456789"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалён |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `PUT` /api/bot/projects/{id}/data

Заменить data существующего проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Тело: `{ sheets }` или `{ json_data }`. Токены не очищаются. **Клиент:** unused.

```bash
curl -s -X PUT 'http://localhost:5000/api/bot/projects/42/data?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' -d @project.json
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта или project_42 | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сводка обновления |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "id": 42,
  "name": "Мой бот",
  "sheetsCount": 1,
  "nodesCount": 12
}
```

### `GET` /api/bot/projects/{id}/export

Экспорт project.json (base64 file)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Ответ совместим с медиа-нодой (`type: file`). **Клиент:** unused (не в UI/шаблоне).

```bash
curl -s 'http://localhost:5000/api/bot/projects/42/export?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта или project_42 | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Файл base64 |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "type": "file",
  "data": "eyJzaGVldHMiOltdfQ==",
  "mimeType": "application/json",
  "fileName": "Мой_бот.json"
}
```

### `GET` /api/bot/projects/{id}/tokens

Список токенов проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

**Риск:** ответ может содержать поле `token` (секрет). **Клиент:** Bot Manager.

```bash
curl -s 'http://localhost:5000/api/bot/projects/42/tokens?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта или project_42 | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | items + count |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "items": [
    {
      "id": 7,
      "name": "@my_bot",
      "botStatus": "🟢"
    }
  ],
  "count": 1
}
```

### `POST` /api/bot/projects/{id}/tokens

Добавить токен в проект

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Body `{ token, name? }`. Валидация getMe; дубликат → существующий. **Клиент:** Bot Manager.

```bash
curl -s -X POST 'http://localhost:5000/api/bot/projects/42/tokens?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \
  -d '{"token":"123:ABC…"}'
```

**Тело запроса:** `BotApiCreateTokenBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта или project_42 | `"42"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Создан или уже существовал |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "id": 7,
  "name": "@my_bot",
  "projectId": 42
}
```

### `POST` /api/bot/projects/import

Импорт project.json → новый проект

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Тело: `{ sheets }` или `{ json_data }`. Токены очищаются. **Клиент:** `use-no-projects` + Bot Manager.

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
| 400 | Нет тела / неверная структура |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |

#### Пример ответа `200`

```json
{
  "id": 55,
  "name": "Импортированный проект"
}
```

### `DELETE` /api/bot/tokens/{tokenId}

Удалить токен

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

hasProjectAccess к проекту токена. **Клиент:** Bot Manager.

```bash
curl -s -X DELETE 'http://localhost:5000/api/bot/tokens/7?telegram_id=123' \
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
| 200 | Удалено |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `GET` /api/bot/tokens/{tokenId}/env

Список env токена (секреты маскируются)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

UI — `/api/projects/…/env-variables`. **Клиент:** unused.

```bash
curl -s 'http://localhost:5000/api/bot/tokens/7/env?telegram_id=123' \
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
| 200 | items + count |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "items": [
    {
      "id": 15,
      "tokenId": 7,
      "key": "API_KEY",
      "value": "••••••••",
      "isSecret": 1
    }
  ],
  "count": 1
}
```

### `POST` /api/bot/tokens/{tokenId}/env

Создать env-переменную

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Body `{ key, value?, isSecret? }`, ключ вида A-Z + A-Z0-9_ (regex `^[A-Z][A-Z0-9_]*` + конец строки). **Клиент:** unused.

```bash
curl -s -X POST 'http://localhost:5000/api/bot/tokens/7/env?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \
  -d '{"key":"API_KEY","value":"secret","isSecret":1}'
```

**Тело запроса:** `BotApiCreateEnvBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `tokenId` | path | да | ID токена или token_7 | `"7"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Создана |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |
| 409 | Ключ уже есть |

#### Пример ответа `201`

```json
{
  "id": 15,
  "tokenId": 7,
  "key": "API_KEY",
  "value": "secret",
  "isSecret": 1
}
```

### `GET` /api/bot/tokens/{tokenId}/photo

Аватар бота (локальный URL)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Скачивает фото в `/uploads/…`. Без аватара — `photoUrl: null`. **Клиент:** Bot Manager.

```bash
curl -s 'http://localhost:5000/api/bot/tokens/7/photo?telegram_id=123' \
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
| 200 | Путь или null |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "photoUrl": "/uploads/42/bot_photos/token_7_avatar.jpg",
  "total_count": 1
}
```

### `GET` /api/bot/tokens/{tokenId}/stats

Статистика пользователей токена

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Числа без форматирования. **Клиент:** unused.

```bash
curl -s 'http://localhost:5000/api/bot/tokens/7/stats?telegram_id=123' \
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
| 200 | Счётчики |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "total_users": 100,
  "active_24h": 12,
  "active_7d": 40,
  "new_today": 3
}
```

### `GET` /api/bot/tokens/{tokenId}/status

Статус инстанса бота

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Секрет token не отдаётся. **Клиент:** Bot Manager, `lib/bot-tools`.

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
| 200 | status + instance |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "status": "running",
  "instance": {
    "botName": "@my_bot",
    "botUsername": "my_bot",
    "tokenId": 7,
    "status": "running",
    "statusLabel": "🟢 Работает",
    "uptime": "1ч 2м"
  }
}
```

### `GET` /api/bot/tokens/{tokenId}/users

Список пользователей бота

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Пагинация `limit` (≤50) / `offset`. **Клиент:** Bot Manager.

```bash
curl -s 'http://localhost:5000/api/bot/tokens/7/users?telegram_id=123&limit=10&offset=0' \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `tokenId` | path | да | ID токена или token_7 | `"7"` |
| `telegram_id` | query | нет | Actor telegram_id (см. auth-модель bot) | `"123456789"` |
| `limit` | query | нет | Лимит (макс 50, по умолчанию 10) | `"10"` |
| `offset` | query | нет | Смещение | `"0"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | items + count + offsets |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "items": [
    {
      "userId": "161",
      "firstName": "Ada",
      "userName": "ada"
    }
  ],
  "count": 1,
  "nextOffset": null,
  "prevOffset": null,
  "fromItem": 1,
  "toItem": 1
}
```

### `GET` /api/bot/tokens/{tokenId}/users/{userId}

Один пользователь бота + аватар

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.

**Actor:**
- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.
- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` (Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).

Подробнее: `docs/features/bot-manager-api-auth.md`.

Даты в ответе отформатированы. **Клиент:** Bot Manager.

```bash
curl -s 'http://localhost:5000/api/bot/tokens/7/users/161?telegram_id=123' \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `tokenId` | path | да | ID токена или token_7 | `"7"` |
| `userId` | path | да | Telegram user id или user_… | `"1612141295"` |
| `telegram_id` | query | нет | Telegram user id актора. Обязателен при PAT scope bot_manager. При личной сессии/PAT должен совпадать с req.user.id (или можно опустить). | `"123456789"` |
| `connect.sid` | cookie | нет | Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Пользователь |
| 400 | Некорректный id / валидация / bot_manager без telegram_id |
| 401 | Нет session/PAT |
| 403 | Нет доступа / чужой telegram_id без bot_manager |
| 404 | Ресурс не найден |

#### Пример ответа `200`

```json
{
  "userId": "161",
  "firstName": "Ada",
  "registeredAt": "09.08.2026 12:00",
  "photoUrl": "/uploads/42/user_photos/user_161.jpg"
}
```
