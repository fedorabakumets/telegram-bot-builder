# agent-tokens

Эндпоинтов: **3**

### `GET` /api/agent-tokens

Список токенов агента

**Авторизация:** Cookie (`connect.sid`)

PAT текущего пользователя **без секрета** (только `prefix` и метаданные).

**Авторизация:** session cookie `connect.sid` или Bearer PAT.
Секрет полного токена сюда **не** возвращается.

**Клиент / MCP:** настройки агента, список ключей.

```bash
curl -s http://localhost:5000/api/agent-tokens -b cookies.txt
# или
curl -s http://localhost:5000/api/agent-tokens \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT (Authorize). Без cookie и без PAT — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив токенов владельца |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 1,
    "label": "Cursor MCP",
    "prefix": "mcp_a1b2",
    "scopes": "read,write",
    "createdAt": "2026-08-01T10:00:00.000Z",
    "lastUsedAt": "2026-08-08T12:00:00.000Z",
    "expiresAt": null,
    "revokedAt": null
  }
]
```

### `POST` /api/agent-tokens

Создать токен агента

**Авторизация:** Cookie (`connect.sid`)

Создаёт PAT. Поле `token` (полный секрет `mcp_…`) возвращается **один раз** — сохраните сразу.

**Тело:** `label` (обязательно), `scopes` (`read` | `read,write` | `read,write,bot_manager`, по умолчанию `read,write`; `bot_manager` — для Bot Manager / `/api/bot`), `expiresInDays` (опционально, иначе бессрочный).

```bash
curl -s -X POST http://localhost:5000/api/agent-tokens -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"label":"Cursor MCP","scopes":"read,write","expiresInDays":90}'
```

**Тело запроса:** `CreateAgentTokenRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT (Authorize). Без cookie и без PAT — 401. | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "label": "Cursor MCP",
  "scopes": "read,write",
  "expiresInDays": 90
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Токен создан; секрет в `token` |
| 400 | Ошибка валидации Zod |
| 401 | Не авторизован |
| 500 | Ошибка БД |

#### Пример ответа `201`

```json
{
  "token": "mcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "record": {
    "id": 1,
    "label": "Cursor MCP",
    "prefix": "mcp_a1b2",
    "scopes": "read,write",
    "createdAt": "2026-08-01T10:00:00.000Z",
    "lastUsedAt": "2026-08-08T12:00:00.000Z",
    "expiresAt": null,
    "revokedAt": null
  }
}
```

### `DELETE` /api/agent-tokens/{id}

Отозвать токен агента

**Авторизация:** Cookie (`connect.sid`)

Отзывает только токен **текущего** пользователя (`ownerId`). Чужой / несуществующий → 404.

**Path:** `id` — числовой ID записи в `agent_tokens` (из списка GET).

```bash
curl -s -X DELETE http://localhost:5000/api/agent-tokens/1 -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи agent_tokens в БД | `"1"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT (Authorize). Без cookie и без PAT — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Токен отозван |
| 401 | Не авторизован |
| 404 | Токен не найден или чужой |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "success": true
}
```
