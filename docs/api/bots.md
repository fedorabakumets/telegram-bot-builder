# bots

Эндпоинтов: **2**

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

### `POST` /api/projects/{id}/bot/start-offline-all

Запустить всех офлайн-ботов проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Последовательно запускает токены проекта со status !== running. Уже running не трогает (в отличие от restart-all).

**Доступ:** `requireProjectAccess`.

**Side-effects:** WS `bot-started`, `start-offline-progress` (без секретов; см. docs/api/realtime-events.md).

**Клиент:** `use-bot-mutations` / BotManagement. MCP: `db_start_offline_bots`.

При большом числе токенов HTTP долгий (пауза ~400ms между стартами).

```bash
curl -s -X POST http://localhost:5000/api/projects/1/bot/start-offline-all -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"1"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Без личности ответ — пустой массив. Альтернатива — Bearer PAT. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сводка запуска |
| 400 | Неверный ID проекта |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту |
| 404 | Токены не найдены |

#### Пример ответа `200`

```json
{
  "started": 2,
  "failed": 0,
  "skippedRunning": 1,
  "results": [
    {
      "tokenId": 7,
      "success": true,
      "processId": "12345"
    },
    {
      "tokenId": 8,
      "success": true,
      "processId": "12346"
    }
  ]
}
```
