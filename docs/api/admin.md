# admin

Эндпоинтов: **9**

### `GET` /admin/api/app-settings

Настройки платформы (вход Studio + Telegram)

**Авторизация:** Admin cookie

Читает режим входа Studio (`dev_login` | `telegram_widget`) и статус Telegram-провайдера. Секреты **не** отдаются — только флаги `*Configured`.

**Auth:** cookie `admin_auth`. **UI:** `/admin/settings` (SSR; GET для curl/Swagger).

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

Сохранить настройки платформы

**Авторизация:** Admin cookie

Upsert секций `auth` (режим входа) и `telegram` (Client ID / secret / bot token / username). Пустой `clientSecret` / `botToken` не затирает уже сохранённые значения.

При `dev_login` поля Telegram необязательны. `botUsername` можно не слать — резолв через getMe при заданном bot token.

**UI:** форма `/admin/settings`.

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

Очистить осиротевшие папки bots/

**Авторизация:** Admin cookie

Сканирует каталог `bots/`, парсит имена `…_{projectId}_{tokenId}` и удаляет папки, чей проект уже нет в БД. Непонятные имена → `skipped` (не трогает).

**Auth:** только `admin_auth`. Ops / curl / Swagger (UI в hub пока нет).

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

### `POST` /admin/api/login

Войти в админку

**Авторизация:** Публичный

Форма с полем `key` = `ADMIN_API_KEY`. При успехе ставит httpOnly cookie `admin_auth` (Path=/admin, 7 дней, HMAC от ключа) и редиректит на `/admin` или `/admin/settings` (если платформа ещё не настроена).

Неверный ключ → 302 на `/admin/login?error=1`. Без ключа в non-prod → 503; в production без `ADMIN_API_KEY` весь `/admin` не монтируется.

**UI:** `/admin/login`. User `connect.sid` / Bearer PAT здесь не работают.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
```

#### Ответы

| Код | Описание |
|-----|----------|
| 302 | Успех → Location `/admin` или `/admin/settings` + Set-Cookie. Ошибка ключа → `/admin/login?error=1` |
| 503 | Admin не настроен (нет ключа) |

### `POST` /admin/api/logout

Выйти из админки

**Авторизация:** Публичный

Сбрасывает cookie `admin_auth` и редиректит на `/admin/login`.

**UI:** кнопка «Выйти» на hub `/admin`.

```bash
curl -s -c admin.txt -b admin.txt -X POST http://localhost:5000/admin/api/logout
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 302 | Location `/admin/login`, cookie очищена |

### `GET` /admin/api/status

Статус admin-сессии

**Авторизация:** Публичный

Публичный JSON: валидна ли `admin_auth` и доступна ли админка. `adminEnabled` всегда `true`, если роут смонтирован.

```bash
curl -s -b admin.txt http://localhost:5000/admin/api/status
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Состояние сессии |

#### Пример ответа `200`

```json
{
  "authenticated": true,
  "adminEnabled": true
}
```

### `PATCH` /admin/api/templates/{id}/featured

Рекомендуемый сценарий (featured on/off)

**Авторизация:** Admin cookie

Включает или снимает «рекомендуемый» шаблон в каталоге Studio (`featured` 0|1). Обычный `PUT /api/templates/{id}` это поле **игнорирует**.

**Auth:** только `admin_auth`. Ops / curl / Swagger.

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

Пересоздать встроенные сценарии (алиас refresh)

**Авторизация:** Admin cookie

То же force-seed, что `POST …/templates/refresh` (совместимый алиас).

**Auth:** только `admin_auth`.

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

Обновить встроенные сценарии каталога

**Авторизация:** Admin cookie

Принудительно перезаписывает системные шаблоны в `bot_templates` (каталог «Сценарии» в Studio).

**Auth:** только `admin_auth`. Ops / curl / Swagger.

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
