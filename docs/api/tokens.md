# tokens

Эндпоинтов: **2**

### `GET` /api/tokens/{tokenId}/bot-status

Статус бота по токену

**Авторизация:** Cookie (`connect.sid`)

Сверка с процессом / worker pool / `bot_instances`. Ответ без сырого token. `Cache-Control: no-store`.

**Auth:** `hasProjectAccess` к проекту токена.

MCP: `GET /api/bot/tokens/{tokenId}/status` (тег `bot`).

```bash
curl -s http://localhost:5000/api/tokens/7/bot-status -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `tokenId` | path | да | ID токена бота | `"7"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Статус бота |
| 401 | Не авторизован |
| 403 | Нет доступа к проекту токена |
| 404 | Токен не найден |

### `GET` /api/tokens/{tokenId}/launch-history

История запусков бота

**Авторизация:** Cookie (`connect.sid`)

До 10 записей `bot_launch_history` + reconcile live-статуса.

**Auth:** `hasProjectAccess`.

```bash
curl -s http://localhost:5000/api/tokens/7/launch-history -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `tokenId` | path | да | ID токена бота | `"7"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Список записей (до 10) |
| 400 | Некорректный tokenId |
| 401 | Не авторизован |
| 403 | Нет доступа |
| 404 | Токен не найден |
