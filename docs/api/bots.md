# bots

Эндпоинтов: **1**

### `GET` /api/bots

Инстансы ботов текущего пользователя

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Все `bot_instances` по проектам владельца (и доступным). **Секрет Telegram token в ответе не отдаётся**.

Без личности → `[]` (не 401 на уровне хендлера; глобальный auth всё равно требует login).

UI сейчас почти не вызывает; предпочтительны token-scoped status API.

```bash
curl -s http://localhost:5000/api/bots -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie Studio. Без личности ответ — пустой массив. Альтернатива — Bearer PAT. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив инстансов без поля token |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 1,
    "projectId": 266,
    "tokenId": 7,
    "status": "running",
    "processId": "12345",
    "startedAt": "2026-08-08T20:00:00.000Z",
    "stoppedAt": null,
    "errorMessage": null
  }
]
```
