# admin

Эндпоинтов: **4**

### `GET` /admin/api/app-settings

Настройки приложения (по провайдерам)

**Авторизация:** Cookie / Bearer PAT

Требует admin cookie после `/admin/login`. Секреты и токены **не** возвращаются — только флаги `*Configured`.

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Текущие настройки |
| 401 | Не авторизован в admin |

### `PUT` /admin/api/app-settings

Сохранить настройки приложения

**Авторизация:** Cookie / Bearer PAT

Upsert по секциям `auth` (режим входа) и `telegram`. Пустой `clientSecret` / `botToken` не удаляет существующие значения. При `dev_login` поля Telegram необязательны. `botUsername` опционально — резолв через getMe при заданном token.

**Тело запроса:** `AdminAppSettingsPayload`

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Настройки сохранены |
| 400 | Валидация |
| 401 | Не авторизован в admin |
| 500 | Внутренняя ошибка |

### `POST` /admin/api/templates/recreate

Пересоздать системные сценарии (seed force)

**Авторизация:** Cookie / Bearer PAT

Тот же `seedDefaultTemplates(true)`, что refresh. Только admin cookie.

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Seed выполнен |
| 401 | Нет admin-сессии |
| 500 | Ошибка seed |

### `POST` /admin/api/templates/refresh

Пересидить системные сценарии (force)

**Авторизация:** Cookie / Bearer PAT

`seedDefaultTemplates(true)` — принудительное обновление системных шаблонов.

**Авторизация:** только admin cookie (`ADMIN_API_KEY` → `/admin/login`). Обычный user cookie/PAT → 401.

Пути `/api/templates/refresh` и `/recreate` удалены (раньше были без admin-проверки).

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Seed выполнен |
| 401 | Нет admin-сессии |
| 500 | Ошибка seed |
