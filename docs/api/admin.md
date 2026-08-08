# admin

Эндпоинтов: **6**

### `GET` /admin/api/app-settings

Настройки приложения (по провайдерам)

**Авторизация:** Admin cookie

Текущие настройки platform setup. Секреты и токены **не** отдаются — только флаги `*Configured`.

**Авторизация:** cookie `admin_auth` после `/admin/login`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s http://localhost:5000/admin/api/app-settings -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Текущие настройки |
| 401 | Нет admin-сессии |

#### Пример ответа `200`

```json
{
  "configured": true,
  "auth": {
    "loginMode": "dev_login",
    "devLoginEnabled": true
  },
  "providers": {
    "telegram": {
      "clientId": "123456789",
      "botUsername": "my_bot",
      "clientSecretConfigured": true,
      "botTokenConfigured": true,
      "configured": true
    }
  }
}
```

### `PUT` /admin/api/app-settings

Сохранить настройки приложения

**Авторизация:** Admin cookie

Upsert секций `auth` (режим входа) и `telegram`. Пустой `clientSecret` / `botToken` не затирает уже сохранённые значения.

При `dev_login` поля Telegram необязательны. `botUsername` можно не слать — резолв через getMe при заданном bot token.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s -X PUT http://localhost:5000/admin/api/app-settings -b admin.txt \
  -H 'Content-Type: application/json' \
  -d '{"auth":{"loginMode":"dev_login"}}'
```

**Тело запроса:** `AdminAppSettingsPayload`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Пример тела запроса

```json
{
  "auth": {
    "loginMode": "dev_login"
  },
  "telegram": {
    "clientId": "123456789",
    "botUsername": "my_bot",
    "clientSecret": "",
    "botToken": ""
  }
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Настройки сохранены |
| 400 | Валидация секции auth/telegram |
| 401 | Нет admin-сессии |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "success": true,
  "configured": true,
  "auth": {
    "loginMode": "dev_login",
    "devLoginEnabled": true
  },
  "providers": {
    "telegram": {
      "configured": true,
      "botUsername": "my_bot"
    }
  }
}
```

### `POST` /admin/api/bot-folders/cleanup

Удалить осиротевшие папки в bots/

**Авторизация:** Admin cookie

Сканирует `bots/`, парсит `…_{projectId}_{tokenId}` и **рекурсивно удаляет** каталоги без проекта в БД. Нераспознанные имена → `skipped`.

**Авторизация:** только `admin_auth`. User cookie/PAT → 401.
**Было:** `POST /api/bot-folders/cleanup` — удалено.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s -X POST http://localhost:5000/admin/api/bot-folders/cleanup -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Очистка выполнена (возможно 0 удалений) |
| 401 | Нет admin-сессии |
| 500 | Ошибка чтения БД или fs |

#### Пример ответа `200`

```json
{
  "deleted": [
    "bot_999_1"
  ],
  "skipped": [],
  "count": 1,
  "message": "Удалено 1 папок"
}
```

### `PATCH` /admin/api/templates/{id}/featured

Пометить сценарий как featured (или снять)

**Авторизация:** Admin cookie

Выставляет `featured` 0|1. Обычный `PUT /api/templates/{id}` это поле **игнорирует**.

**Path:** `id` — ID `bot_templates`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s -X PATCH http://localhost:5000/admin/api/templates/12/featured -b admin.txt \
  -H 'Content-Type: application/json' -d '{"featured":1}'
```

**Тело запроса:** `AdminSetTemplateFeaturedRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи bot_templates | `"12"` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Пример тела запроса

```json
{
  "featured": 1
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Шаблон обновлён |
| 400 | Неверный id или featured |
| 401 | Нет admin-сессии |
| 404 | Шаблон не найден |

#### Пример ответа `200`

```json
{
  "id": 1,
  "ownerId": null,
  "name": "FAQ-бот",
  "description": "Ответы на частые вопросы",
  "data": {
    "sheets": [
      {
        "id": "main",
        "name": "Основной",
        "nodes": [
          {
            "id": "start",
            "type": "start",
            "position": {
              "x": 0,
              "y": 0
            },
            "data": {
              "messageText": "Привет!"
            }
          }
        ],
        "edges": []
      }
    ]
  },
  "flow_data": {
    "sheets": [
      {
        "id": "main",
        "name": "Основной",
        "nodes": [
          {
            "id": "start",
            "type": "start",
            "position": {
              "x": 0,
              "y": 0
            },
            "data": {
              "messageText": "Привет!"
            }
          }
        ],
        "edges": []
      }
    ]
  },
  "category": "utility",
  "tags": [
    "faq",
    "support"
  ],
  "isPublic": 1,
  "difficulty": "easy",
  "authorName": null,
  "useCount": 120,
  "rating": 0,
  "ratingCount": 0,
  "featured": 1,
  "language": "ru",
  "complexity": 2,
  "estimatedTime": 10,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

### `POST` /admin/api/templates/recreate

Пересоздать системные сценарии (seed force)

**Авторизация:** Admin cookie

Тот же `seedDefaultTemplates(true)`, что refresh. Только admin cookie.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s -X POST http://localhost:5000/admin/api/templates/recreate -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Seed выполнен |
| 401 | Нет admin-сессии |
| 500 | Ошибка seed |

#### Пример ответа `200`

```json
{
  "message": "Templates recreated successfully",
  "timestamp": "2026-08-08T19:00:00.000Z"
}
```

### `POST` /admin/api/templates/refresh

Пересидить системные сценарии (force)

**Авторизация:** Admin cookie

`seedDefaultTemplates(true)` — принудительное обновление системных шаблонов.

**Авторизация:** только `admin_auth`. User cookie/PAT → 401.
Публичные `/api/templates/refresh|recreate` удалены.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s -X POST http://localhost:5000/admin/api/templates/refresh -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Seed выполнен |
| 401 | Нет admin-сессии |
| 500 | Ошибка seed |

#### Пример ответа `200`

```json
{
  "message": "Templates refreshed successfully",
  "timestamp": "2026-08-08T19:00:00.000Z"
}
```
