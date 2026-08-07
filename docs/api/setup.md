# setup

Эндпоинтов: **2**

### `GET` /api/setup/bootstrap

Bootstrap first-run (configured + adminEnabled)

**Авторизация:** Публичный

Публичный, **без сессии**. Для клиента при first-run: `configured` и доступность `/admin` (`adminEnabled`).

Настройка платформы — через `/admin/login` → `/admin/settings` (не публичный wizard).

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Bootstrap статус |

### `GET` /api/setup/status

Статус первоначальной настройки

**Авторизация:** Публичный

Публичный, **без сессии**. Показывает, завершён ли platform setup.

**Клиент:** `SetupGuard` → bootstrap/status при старте.

`configured=false` в production — UI редиректит в `/admin`, `setupGuard` отвечает 503 на остальные `/api/*`.

В `NODE_ENV=development` или при `SKIP_AUTH !== false` всегда `configured=true` (dev bypass), если не задан `SETUP_WIZARD_STRICT=true`.

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | configured=true — приложение настроено |
