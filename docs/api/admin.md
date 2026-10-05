# admin

Эндпоинтов: **20**

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

### `GET` /admin/api/support/attachments/{id}

Картинка диалога поддержки

**Авторизация:** Admin cookie

Отдаёт файл администратору по cookie `admin_auth`.

```bash
curl -s http://localhost:5000/admin/api/support/attachments/1 -b admin.txt -o screen.png
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | — | `"1"` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Картинка. Content-Type — сохранённый MIME, Content-Disposition: inline |
| 401 | Нет admin-сессии |
| 404 | Файл не найден |

### `GET` /admin/api/support/threads

Список диалогов поддержки

**Авторизация:** Admin cookie

Диалоги с автором и превью последнего сообщения. Сначала с непрочитанным, затем по времени. Без `status` возвращаются открытые. Лимит 200.

**Auth:** cookie `admin_auth`. **UI:** `/admin/support`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s 'http://localhost:5000/admin/api/support/threads?status=open' -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `status` | query | нет | — | `"open"` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Список диалогов |
| 401 | Нет admin-сессии |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "items": [
    {
      "id": 1,
      "status": "open",
      "unreadByAdmin": 1,
      "unreadByUser": 0,
      "lastMessageAt": "2026-09-30T11:11:04.565Z",
      "user": {
        "id": 123456789,
        "firstName": "Иван",
        "lastName": null,
        "username": "ivan",
        "photoUrl": null
      },
      "lastMessageText": "Не сохраняется сценарий",
      "lastMessageSender": "user"
    }
  ]
}
```

### `GET` /admin/api/support/threads/{id}

Диалог поддержки

**Авторизация:** Admin cookie

Диалог, профиль автора и сообщения. **Auth:** cookie `admin_auth`. **UI:** `/admin/support/{id}`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s http://localhost:5000/admin/api/support/threads/1 -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | — | `"1"` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Диалог с сообщениями |
| 400 | Неверный идентификатор |
| 401 | Нет admin-сессии |
| 404 | Диалог не найден |

#### Пример ответа `200`

```json
{
  "thread": {
    "id": 1,
    "status": "open",
    "unreadByAdmin": 1,
    "unreadByUser": 0,
    "lastMessageAt": "2026-09-30T11:11:04.565Z"
  },
  "user": {
    "id": 123456789,
    "firstName": "Иван",
    "lastName": null,
    "username": "ivan",
    "photoUrl": null
  },
  "messages": [
    {
      "id": 1,
      "sender": "user",
      "text": "Не сохраняется сценарий",
      "context": {
        "projectId": 294,
        "path": "/editor/294",
        "userAgent": "Mozilla/5.0"
      },
      "source": "web",
      "createdAt": "2026-09-30T11:10:20.787Z",
      "attachments": []
    },
    {
      "id": 2,
      "sender": "admin",
      "text": "Проверьте, что проект открыт, и повторите сохранение.",
      "context": null,
      "source": "web",
      "createdAt": "2026-09-30T11:11:04.565Z",
      "attachments": []
    }
  ]
}
```

### `PATCH` /admin/api/support/threads/{id}

Закрыть или открыть диалог

**Авторизация:** Admin cookie

Меняет статус. Новое сообщение пользователя само переводит закрытый диалог в `open`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s -X PATCH http://localhost:5000/admin/api/support/threads/1 -b admin.txt -H 'Content-Type: application/json' -d '{"status":"closed"}'
```

**Тело запроса:** `SupportStatusBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | — | `"1"` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Пример тела запроса

```json
{
  "status": "closed"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённый диалог |
| 400 | Статус не open/closed или неверный id |
| 401 | Нет admin-сессии |
| 404 | Диалог не найден |

#### Пример ответа `200`

```json
{
  "id": 1,
  "status": "closed",
  "unreadByAdmin": 0,
  "unreadByUser": 0,
  "lastMessageAt": "2026-09-30T11:11:04.565Z"
}
```

### `POST` /admin/api/support/threads/{id}/messages

Ответить пользователю

**Авторизация:** Admin cookie

Сохраняет ответ администратора и отмечает диалог прочитанным. Поля `text` и `files`. Источник ответа — `web`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s -X POST http://localhost:5000/admin/api/support/threads/1/messages -b admin.txt -F text='Проверьте сохранение ещё раз.' -F files=@screen.png
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | — | `"1"` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Ответ сохранён |
| 400 | Пустое сообщение, файл не картинка, больше 8 МБ, текст длиннее 4000 или неверный id |
| 401 | Нет admin-сессии |
| 404 | Диалог не найден |

#### Пример ответа `201`

```json
{
  "id": 2,
  "sender": "admin",
  "text": "Проверьте, что проект открыт, и повторите сохранение.",
  "context": null,
  "source": "web",
  "createdAt": "2026-09-30T11:11:04.565Z",
  "attachments": []
}
```

### `POST` /admin/api/support/threads/{id}/read

Отметить диалог прочитанным

**Авторизация:** Admin cookie

Обнуляет `unreadByAdmin`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s -X POST http://localhost:5000/admin/api/support/threads/1/read -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | — | `"1"` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённый диалог |
| 400 | Неверный идентификатор |
| 401 | Нет admin-сессии |
| 404 | Диалог не найден |

#### Пример ответа `200`

```json
{
  "id": 1,
  "status": "open",
  "unreadByAdmin": 0,
  "unreadByUser": 0,
  "lastMessageAt": "2026-09-30T11:11:04.565Z"
}
```

### `GET` /admin/api/support/unread

Сколько сообщений ждут ответа

**Авторизация:** Admin cookie

Сумма `unread_by_admin` по всем диалогам. Для счётчика в меню админки.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s http://localhost:5000/admin/api/support/unread -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Общее число непрочитанных |
| 401 | Нет admin-сессии |

#### Пример ответа `200`

```json
{
  "total": 3
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

### `GET` /admin/api/update-check

Проверка обновлений на GitHub

**Авторизация:** Admin cookie

Сравнивает локальный `version.json` с `main` на GitHub. `?refresh=1` сбрасывает кеш проверки.

**Auth:** cookie `admin_auth`. **UI:** кнопка «Проверить обновления» на `/admin`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s 'http://localhost:5000/admin/api/update-check?refresh=1' -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `refresh` | query | нет | — | `"1"` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Результат сравнения версий |
| 401 | Нет admin-сессии |

#### Пример ответа `200`

```json
{
  "current": {
    "version": "2.2.1.5",
    "releasedAt": "2026-10-05"
  },
  "latest": {
    "version": "2.2.1.5",
    "releasedAt": "2026-10-05",
    "notesUrl": null
  },
  "updateAvailable": false,
  "checkFailed": false,
  "deployGuideUrl": "https://github.com/org/telegram-bot-builder"
}
```

### `GET` /admin/api/users

Список аккаунтов платформы

**Авторизация:** Admin cookie

Все записи `telegram_users` с числом проектов во владении и участий. Поиск по имени, @username и числовому Telegram ID. Только чтение.

**Auth:** cookie `admin_auth`. Сессия Studio (`connect.sid`) **не** подходит.

**UI:** `/admin/users`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s 'http://localhost:5000/admin/api/users?search=ivan&page=1&perPage=25' -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `search` | query | нет | — | `"ivan"` |
| `page` | query | нет | — | `1` |
| `perPage` | query | нет | — | `25` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Страница списка аккаунтов |
| 401 | Нет admin-сессии |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "items": [
    {
      "id": 123456789,
      "firstName": "Иван",
      "lastName": "Петров",
      "username": "ivan_bot",
      "photoUrl": null,
      "createdAt": "2026-01-01T08:00:00.000Z",
      "updatedAt": "2026-03-10T09:15:00.000Z",
      "ownedCount": 2,
      "sharedCount": 1
    }
  ],
  "total": 1,
  "page": 1,
  "perPage": 25
}
```

### `GET` /admin/api/users/{id}

Карточка аккаунта платформы

**Авторизация:** Admin cookie

Профиль `telegram_users` и списки проектов во владении / участия. Из `bot_projects` отдаются только `id`, `name`, даты — без `data`, `bot_token`, `session_id`.

**Auth:** cookie `admin_auth`.

**UI:** `/admin/users/{id}`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s http://localhost:5000/admin/api/users/123456789 -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | — | `"123456789"` |
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Карточка аккаунта |
| 400 | Неверный id |
| 401 | Нет admin-сессии |
| 404 | Аккаунт не найден |
| 500 | Внутренняя ошибка |

#### Пример ответа `200`

```json
{
  "user": {
    "id": 123456789,
    "firstName": "Иван",
    "lastName": "Петров",
    "username": "ivan_bot",
    "photoUrl": null,
    "createdAt": "2026-01-01T08:00:00.000Z",
    "updatedAt": "2026-03-10T09:15:00.000Z"
  },
  "ownedProjects": [
    {
      "id": 42,
      "name": "Мой бот",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-03-01T12:30:00.000Z"
    }
  ],
  "sharedProjects": [
    {
      "id": 7,
      "name": "Командный проект",
      "createdAt": "2026-02-01T11:00:00.000Z",
      "updatedAt": "2026-02-28T16:00:00.000Z",
      "ownerId": 987654321,
      "ownerDisplayName": "@team_lead"
    }
  ]
}
```

### `GET` /admin/api/version

Установленная версия приложения

**Авторизация:** Admin cookie

Читает `version.json` из образа/рабочей копии. Без обращения к GitHub.

**Auth:** cookie `admin_auth`. **UI:** карточка на `/admin`.

```bash
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'
curl -s http://localhost:5000/admin/api/version -b admin.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `admin_auth` | cookie | нет | Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED. | `"eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Текущая версия |
| 401 | Нет admin-сессии |

#### Пример ответа `200`

```json
{
  "version": "2.2.1.5",
  "releasedAt": "2026-10-05",
  "notesUrl": null
}
```
