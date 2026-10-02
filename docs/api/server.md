# server

Эндпоинтов: **1**

### `GET` /api/server/env-keys

Список серверных env-ключей для подстановки в бот

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Возвращает **только имена** серверных переменных, которые реально раскрываются в ссылках `${{KEY}}`: перечисленные администратором в `WORKER_ENV_PASSTHROUGH`, не попавшие в denylist и заданные (не пустые). **Значения не передаются.**

**Клиент:** вкладка «Переменные» у токена бота — `BotEnvPanel` и кнопка «Подставить из сервера» (`BotEnvServerVarsPopover`). UI подставляет в custom env синтаксис `${{KEY}}`; при генерации `.env` бота такие ссылки резолвятся из окружения Node-процесса на сервере (во всех режимах `WORKER_RUNTIME`).

**Denylist (нельзя обойти через WORKER_ENV_PASSTHROUGH):** SESSION_SECRET, ADMIN_API_KEY, DATABASE_URL, REDIS_URL, TELEGRAM_BOT_TOKEN, VITE_TELEGRAM_BOT_TOKEN, MCP_AGENT_TOKEN; имена с префиксами PG*, RAILWAY_*, RUNNER_*; имена, содержащие SECRET, PASSWORD, PASSWD, PRIVATE_KEY, DATABASE_URL, REDIS_URL.

Если переменная не задана на сервере — она не возвращается (UI показывает локальный дефолт без `${{…}}`).

Требуется авторизация: сессионная cookie или Bearer PAT агента.

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Доступные серверные ключи (без значений) |
| 401 | Не авторизован |
| 503 | Приложение не прошло setup — глобальный setupGuard (настройка в /admin) |
