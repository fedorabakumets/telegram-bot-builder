# setup

Эндпоинтов: **2**

### `GET` /api/setup/bootstrap

Bootstrap first-run (configured + adminEnabled)

**Авторизация:** Публичный

Публичный, **без сессии**. Для клиента при first-run: `configured` и доступность `/admin` (`adminEnabled`).

Настройка платформы — через `/admin/login` → `/admin/settings` (не публичный wizard).

**Operation ID:** `get_api_setup_bootstrap_0fdb17d0195d2798`

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Bootstrap статус |

### `GET` /api/setup/status

Статус первоначальной настройки

**Авторизация:** Публичный

Публичный, **без сессии**. Показывает, завершён ли platform setup.

**Клиент:** `SetupGuard` → bootstrap/status при старте.

`configured=false` — UI редиректит в `/admin`, `setupGuard` отвечает 503 на остальные `/api/*`.

При dev-login в `/admin/settings` (`auth_login_mode=dev_login`) — `configured=true` без BotFather.

**Operation ID:** `get_api_setup_status_73eb8d38325478f2`

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | configured=true — приложение настроено |
