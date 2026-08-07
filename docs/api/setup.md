# setup

Эндпоинтов: **2**

### `POST` /api/setup

Первоначальная настройка приложения

**Авторизация:** Публичный

Публичный, **без сессии**. Однократная инициализация: сохраняет Telegram credentials в `app_settings`.

**Клиент:** форма на `/setup` → `POST /api/setup` → редирект на `/projects`.

`telegram_client_secret` сохраняется для проверки `isConfigured()`; Login Widget верифицирует hash от Telegram, не client_secret. Изменение после setup — через `.env` / будущий `/admin/settings`.

Опциональный `telegramBotToken` нужен для Mini App auth (`POST /api/auth/telegram/miniapp`). Если не передан — существующий token в БД не удаляется.

**Тело запроса:** `SetupPayload`

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Настройки сохранены |
| 400 | Невалидное тело запроса |
| 409 | Приложение уже настроено |
| 500 | Внутренняя ошибка сервера |

### `GET` /api/setup/status

Статус первоначальной настройки

**Авторизация:** Публичный

Публичный, **без сессии**. Показывает, пройден ли setup wizard.

**Клиент:** `SetupGuard` → `useSetupStatus()` при старте приложения.

`configured=false` в production (все три ключа в `app_settings`: client_id, client_secret, bot_username) — UI редиректит на `/setup`, `setupGuard` отвечает 503 на остальные `/api/*`.

В `NODE_ENV=development` или при `SKIP_AUTH !== false` всегда `configured=true` (dev bypass).

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | configured=true — приложение настроено |
