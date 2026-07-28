# tokens

Эндпоинтов: **6**

### `DELETE` /api/projects/{projectId}/tokens/{tokenId}

Удалить токен бота проекта

**Авторизация:** Cookie (`connect.sid`)

Удаляет токен из проекта. Доступ: **владелец или коллаборатор** проекта (`requireTokenOwnership` → `hasProjectAccess`). Сверяет `token.projectId` с `:projectId` (защита от IDOR). Перед удалением останавливает бота. **Side-effect:** WebSocket `token-deleted` (UI обновляет список без F5). Ответы list/status токенов не содержат сырой Telegram token.

**Параметры:** 2

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Токен удалён |
| 400 | Некорректный projectId или tokenId |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту токена |
| 404 | Токен не найден в этом проекте |

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/messages-retention

Срок хранения сообщений диалога

**Авторизация:** Cookie (`connect.sid`)

Обновляет `messages_retention_days` у токена. `0` — без автоочистки; иначе сервер раз в час удаляет из `bot_messages` сообщения этого токена старше N дней. Таблица `message_activity_daily` (длинный график «Активность») не трогается. Требуется владение токеном (`requireTokenOwnership`). **Side-effect:** после успеха эмитит WebSocket `token-updated` (безопасный снимок токена без секретов; см. docs/api/realtime-events.md). UI и другие клиенты обновляются без F5.

**Тело запроса:** `UpdateMessagesRetentionRequest`

**Параметры:** 2

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Настройка сохранена |
| 400 | Неверный ID или значение вне whitelist |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту токена |
| 404 | Токен не найден |

### `DELETE` /api/tokens/{id}

DELETE /api/tokens/{id}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |

### `PUT` /api/tokens/{id}

PUT /api/tokens/{id}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |

### `GET` /api/tokens/{tokenId}/bot-status

GET /api/tokens/{tokenId}/bot-status

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |

### `GET` /api/tokens/{tokenId}/launch-history

GET /api/tokens/{tokenId}/launch-history

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |
