# launch

Эндпоинтов: **1**

### `GET` /api/launch/{launchId}/logs

GET /api/launch/{launchId}/logs

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |
