# project-users

Эндпоинтов: **13**

### `DELETE` /api/projects/{id}/users

DELETE /api/projects/{id}/users

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{id}/users

Список пользователей и диалогов проекта

**Авторизация:** Cookie (`connect.sid`)

Вкладка «Диалоги» / «Пользователи». С `limit` — страница `{ users, total, hasMore }`. Без `limit` — плоский массив (обратная совместимость). `dialogKind` фильтрует личные / группы / каналы на сервере.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | — | `"42"` |
| `tokenId` | query | нет | — | `"7"` |
| `limit` | query | нет | — | `"50"` |
| `offset` | query | нет | — | `"0"` |
| `search` | query | нет | — | `"иван"` |
| `filterActive` | query | нет | — | — |
| `sortBy` | query | нет | — | `"lastInteraction"` |
| `sortDir` | query | нет | — | `"desc"` |
| `dialogKind` | query | нет | — | `"all"` |
| `includeGroups` | query | нет | — | `"true"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Пагинированный список или массив пользователей |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |

### `POST` /api/projects/{id}/users

Создать или обновить пользователя бота

**Авторизация:** Cookie (`connect.sid`)

INSERT в `bot_users` по (user_id, project_id, token_id). При конфликте обновляет `last_interaction` (upsert). `tokenId` — в query или в теле; иначе подставляется 0.

**Тело запроса:** `CreateBotUserRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | — | `"42"` |
| `tokenId` | query | нет | — | `"7"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Пользователь создан или обновлён (строка bot_users) |
| 400 | Нет userId или невалидные данные |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

### `GET` /api/projects/{id}/users/growth

GET /api/projects/{id}/users/growth

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{id}/users/growth-by-source

GET /api/projects/{id}/users/growth-by-source

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{id}/users/popular-buttons

GET /api/projects/{id}/users/popular-buttons

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{id}/users/search

GET /api/projects/{id}/users/search

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{id}/users/stats

GET /api/projects/{id}/users/stats

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{id}/users/traffic

GET /api/projects/{id}/users/traffic

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{id}/users/variables

GET /api/projects/{id}/users/variables

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `DELETE` /api/projects/{projectId}/users/{userId}

Удалить пользователя и его сообщения

**Авторизация:** Cookie (`connect.sid`)

**UI:** удаление пользователя из базы в редакторе.

Удаляет все сообщения из `bot_messages` и строку из `bot_users` для (user_id, project_id, token_id). `tokenId` — в query.

Заменяет legacy `DELETE /api/users/{id}` с `projectId` в body. Не путать с `DELETE /api/projects/{id}/users` — массовое удаление всех пользователей проекта.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `userId` | path | да | — | `"123456789"` |
| `tokenId` | query | нет | — | `"7"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешное удаление |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |
| 404 | Пользователь не найден |
| 500 | Ошибка БД |
| 503 | Сервис не настроен (setupGuard) |

#### Пример ответа `200`

```json
{
  "message": "User data deleted successfully"
}
```

### `GET` /api/projects/{projectId}/users/{userId}

Один пользователь бота по projectId и userId

**Авторизация:** Cookie (`connect.sid`)

Возвращает одну строку `bot_users` для пары (project_id, user_id, token_id). `tokenId` в query — скоуп по токену бота (как в остальных users-эндпоинтах). Используется карточкой пользователя в редакторе.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `userId` | path | да | — | `"123456789"` |
| `tokenId` | query | нет | — | `"7"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Строка bot_users |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |
| 404 | Пользователь не найден |
| 500 | Ошибка БД |
| 503 | Сервис не настроен (setupGuard) |

### `PUT` /api/projects/{projectId}/users/{userId}

Обновить пользователя бота (статус активности)

**Авторизация:** Cookie (`connect.sid`)

**UI:** смена статуса «активен / неактивен» в базе пользователей.

Обновляет `is_active` в `bot_users` и `last_interaction`. `projectId` и `userId` — в path; `tokenId` — в query (`?tokenId=7`). Резолв токена через `resolveEffectiveProjectTokenId`.

Заменяет legacy `PUT /api/users/{id}` с `projectId` в body.

**Тело запроса:** `UpdateBotUserRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `userId` | path | да | — | `"123456789"` |
| `tokenId` | query | нет | — | `"7"` |

#### Пример тела запроса

```json
{
  "isActive": 1
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённая строка bot_users |
| 400 | Нет полей для обновления |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |
| 404 | Пользователь не найден |
| 500 | Ошибка БД |
| 503 | Сервис не настроен (setupGuard) |
