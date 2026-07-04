# telegram-client

Эндпоинтов: **1**

### `GET` /api/telegram-client/group-members/{groupId}

GET /api/telegram-client/group-members/{groupId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |
