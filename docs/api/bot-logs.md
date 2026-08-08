# bot-logs

Эндпоинтов: **1**

### `GET` /api/bot-logs/{logId}

Одна строка лога бота по ID

**Авторизация:** Cookie (`connect.sid`)

Читает запись из `bot_logs` для **постоянных ссылок** терминала (`?log=`).

Если строка ещё в памяти UI — запрос не нужен; клиент зовёт API только когда строки нет в `BotLogsContext` (`use-terminal-log-url`).

**Доступ:** владелец/collaborator проекта `log.projectId` (`hasProjectAccess`). Чужой лог → **403**. Несуществующий id → **404**.

Список/live логов — другие пути (`GET /api/projects/{projectId}/tokens/{tokenId}/logs`, WebSocket).

```bash
curl -s http://localhost:5000/api/bot-logs/42 -b cookies.txt
# или
curl -s http://localhost:5000/api/bot-logs/42 \
  -H 'Authorization: Bearer mcp_…'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `logId` | path | да | ID записи в таблице bot_logs (из permalink ?log=) | `"42"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без cookie и без PAT — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Запись лога |
| 400 | logId не число |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту лога |
| 404 | Запись не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "id": 42,
  "projectId": 266,
  "tokenId": 7,
  "launchId": 15,
  "content": "Bot started successfully",
  "type": "stdout",
  "timestamp": "2026-08-08T20:00:00.000Z"
}
```
