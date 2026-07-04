# bot-logs

Эндпоинтов: **1**

### `GET` /api/bot-logs/{logId}

GET /api/bot-logs/{logId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |
