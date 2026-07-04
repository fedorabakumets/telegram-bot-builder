# bot-folders

Эндпоинтов: **1**

### `POST` /api/bot-folders/cleanup

POST /api/bot-folders/cleanup

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено (/setup) |
