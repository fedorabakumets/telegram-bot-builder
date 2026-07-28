# workers

Эндпоинтов: **1**

### `GET` /api/workers/stats

GET /api/workers/stats

Возвращает число воркеров, ботов и RSS (без секретов токенов). Учёт `botsCount` опирается на `activeBots` после `bot_started` / `bot_exited` — см. [[features/bot-worker-pool-isolation]].

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |
