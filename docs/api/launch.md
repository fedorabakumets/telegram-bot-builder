# launch

Эндпоинтов: **1**

### `GET` /api/launch/{launchId}/logs

Логи конкретного запуска бота

**Авторизация:** Cookie (`connect.sid`)

Все строки `bot_logs` с данным `launchId` (хронология запуска).

**Доступ:** projectId берётся из первой строки логов → `hasProjectAccess`. Чужой проект → **403**.

**Пустой набор логов** трактуется как отсутствие запуска → **404** (не раскрывает id без данных).

**Клиент:** `use-launch-logs` → LaunchLogsModal / LaunchHistoryViewer.

```bash
curl -s http://localhost:5000/api/launch/15/logs -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `launchId` | path | да | ID запуска в bot_launch_history | `"15"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без cookie и без PAT — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив логов запуска |
| 400 | launchId не число |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту запуска |
| 404 | Запуск не найден (нет логов) |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 42,
    "projectId": 266,
    "tokenId": 7,
    "launchId": 15,
    "content": "Bot started successfully",
    "type": "stdout",
    "timestamp": "2026-08-08T20:00:00.000Z"
  }
]
```
