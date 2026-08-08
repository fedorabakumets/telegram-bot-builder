# admin

Эндпоинтов: **6**

### `GET` /admin/api/app-settings

Настройки приложения (по провайдерам)

**Авторизация:** Admin cookie

Требует admin cookie после `/admin/login`. Секреты и токены **не** возвращаются — только флаги `*Configured`.

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Текущие настройки |
| 401 | Не авторизован в admin |

### `PUT` /admin/api/app-settings

Сохранить настройки приложения

**Авторизация:** Admin cookie

Upsert по секциям `auth` (режим входа) и `telegram`. Пустой `clientSecret` / `botToken` не удаляет существующие значения. При `dev_login` поля Telegram необязательны. `botUsername` опционально — резолв через getMe при заданном token.

**Тело запроса:** `AdminAppSettingsPayload`

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Настройки сохранены |
| 400 | Валидация |
| 401 | Не авторизован в admin |
| 500 | Внутренняя ошибка |

### `POST` /admin/api/bot-folders/cleanup

Удалить осиротевшие папки в bots/

**Авторизация:** Admin cookie

Служебная уборка диска: сканирует `bots/`, парсит имена `…_{projectId}_{tokenId}` и **рекурсивно удаляет** каталоги, для которых нет проекта в БД.

**Авторизация:** только admin cookie (`ADMIN_API_KEY` → `/admin/login`). Обычный user cookie / Bearer PAT → **401** `ADMIN_UNAUTHORIZED`.

Папки с нераспознанным именем попадают в `skipped` и **не** удаляются.
При удалении проекта папки чистятся отдельно; этот эндпоинт — для хвостов после сбоев.

**Было:** `POST /api/bot-folders/cleanup` (любой залогиненный) — **удалено**.

```bash
# 1) войти в admin (получить cookie)
curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'key=YOUR_ADMIN_API_KEY'

# 2) cleanup
curl -s -X POST http://localhost:5000/admin/api/bot-folders/cleanup -b admin.txt
```

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

Только admin cookie. Обычный `PUT /api/templates/{id}` поле `featured` игнорирует.

**Тело запроса:** `AdminSetTemplateFeaturedRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи bot_templates | `"12"` |

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

### `POST` /admin/api/templates/recreate

Пересоздать системные сценарии (seed force)

**Авторизация:** Admin cookie

Тот же `seedDefaultTemplates(true)`, что refresh. Только admin cookie.

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

**Авторизация:** только admin cookie (`ADMIN_API_KEY` → `/admin/login`). Обычный user cookie/PAT → 401.

Пути `/api/templates/refresh` и `/recreate` удалены (раньше были без admin-проверки).

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
