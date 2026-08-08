# database

Эндпоинтов: **1**

### `GET` /api/projects/{id}/tables

Список таблиц контента проекта

**Авторизация:** Cookie (`connect.sid`)

Пользовательские таблицы `bot_tables` для панели Database в редакторе.

**Доступ:** `requireProjectAccess` (владелец / collaborator).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s http://localhost:5000/api/projects/42/tables -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `connect.sid` | cookie | нет | Session cookie Studio. Не нужна при Bearer PAT. Без cookie и без PAT — 401. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив таблиц |
| 400 | Некорректный ID проекта |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 1,
    "projectId": 42,
    "name": "Товары",
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
]
```
