# push-to-github

Эндпоинтов: **1**

### `POST` /api/push-to-github

POST /api/push-to-github

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |
