# project-tables

Эндпоинтов: **29**

### `GET` /api/projects/{id}/tables

Список таблиц контента проекта

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Пользовательские таблицы `bot_tables` для панели Database в редакторе.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s http://localhost:5000/api/projects/42/tables -b cookies.txt
```

**Operation ID:** `get_api_projects_id_tables_be45083a04616293`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

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

### `POST` /api/projects/{id}/tables

Создать таблицу контента

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Создаёт `bot_tables` с полем `name`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tables -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"name":"Товары"}'
```

Без requestId сохраняется прежний формат ответа. Объект дополнен persistence; массив подтверждается JSON-заголовком x-botcraft-persistence. С requestId возвращается только квитанция IDs: повтор того же UUID и аргументов не выполняет запись снова. 202 unknown требует сверки, автоматический повтор запрещён. 409 означает повтор UUID с другими аргументами.

**Operation ID:** `post_api_projects_id_tables_84c6ec6cbfdd1115`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Товары"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Созданная таблица Без requestId — совместимый результат; с requestId — TableCompletedReceipt. |
| 202 | Исход требует сверки; не выполнять повтор автоматически |
| 400 | Нет name или некорректный ID проекта |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 409 | UUID уже использован с другими аргументами либо конфликт создания |
| 500 | Ошибка БД |
| 503 | Журнал заявок недоступен; действие не выполнялось |

#### Пример ответа `201`

```json
{
  "id": 1,
  "projectId": 42,
  "name": "Товары",
  "createdAt": "2026-08-01T10:00:00.000Z",
  "persistence": {
    "confirmed": true,
    "projectId": 42,
    "tableId": 1
  }
}
```

### `DELETE` /api/projects/{id}/tables/{tableId}

Удалить таблицу

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет таблицу и связанные колонки/строки (CASCADE).

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/tables/1 -b cookies.txt
```

**Operation ID:** `delete_api_projects_id_tables_tableId_66afc07684466c09`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалено |
| 400 | Некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `GET` /api/projects/{id}/tables/{tableId}

Таблица, столбцы и сводка

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Столбцы содержат числовой id и имя. Чужой tableId даёт 404.

**Operation ID:** `get_api_projects_id_tables_tableId_4736ffb79f166ea9`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Схема |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица не найдена |

### `PUT` /api/projects/{id}/tables/{tableId}

Переименовать таблицу

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Обновляет `name`. API есть; UI-хук `useRenameTable` в TablesPanel не подключён.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api.renameTable`.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tables/1 -b cookies.txt \
  -H 'Content-Type: application/json' -d '{"name":"Услуги"}'
```

**Operation ID:** `put_api_projects_id_tables_tableId_ca1b6e565ffca0f7`

**Тело запроса:** `RenameBotTableBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Услуги"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённая таблица |
| 400 | Нет name или некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "id": 1,
  "projectId": 42,
  "name": "Услуги",
  "createdAt": "2026-08-01T10:00:00.000Z"
}
```

### `POST` /api/projects/{id}/tables/{tableId}/apply-ops

Пакет операций в одной транзакции

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

До 50 операций. Удаление требует confirm: true. Ошибка возвращает failed_op_index и откатывает пакет. Уведомление Redis одно.

Без requestId сохраняется прежний формат ответа. Объект дополнен persistence; массив подтверждается JSON-заголовком x-botcraft-persistence. С requestId возвращается только квитанция IDs: повтор того же UUID и аргументов не выполняет запись снова. 202 unknown требует сверки, автоматический повтор запрещён. 409 означает повтор UUID с другими аргументами.

**Operation ID:** `post_api_projects_id_tables_tableId_apply_ops_61179315906c6c28`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Результаты по порядку Без requestId — совместимый результат; с requestId — TableCompletedReceipt. |
| 202 | Исход требует сверки; не выполнять повтор автоматически |
| 400 | Откат |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 409 | UUID уже использован с другими аргументами либо конфликт создания |
| 503 | Журнал заявок недоступен; действие не выполнялось |

### `POST` /api/projects/{id}/tables/{tableId}/cells/edit

Атомарно изменить до 5000 ячеек с проверкой before

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT



Без requestId сохраняется прежний формат ответа. Объект дополнен persistence; массив подтверждается JSON-заголовком x-botcraft-persistence. С requestId возвращается только квитанция IDs: повтор того же UUID и аргументов не выполняет запись снова. 202 unknown требует сверки, автоматический повтор запрещён. 409 означает повтор UUID с другими аргументами.

**Operation ID:** `post_api_projects_id_tables_tableId_cells_edit_e9bb525bbe313a86`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Все изменения записаны одной транзакцией Без requestId — совместимый результат; с requestId — TableCompletedReceipt. |
| 202 | Исход требует сверки; не выполнять повтор автоматически |
| 400 | Операция отклонена |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Операция отклонена |
| 409 | UUID уже использован с другими аргументами либо конфликт создания |
| 500 | Операция отклонена |
| 503 | Журнал заявок недоступен; действие не выполнялось |

### `GET` /api/projects/{id}/tables/{tableId}/chart

График по таблице

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Группирует строки таблицы проекта. Не больше 50 групп. Чужая таблица и чужой столбец не раскрываются.

**Operation ID:** `get_api_projects_id_tables_tableId_chart_a358c9d3c79b6128`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `xColumnId` | query | да | — | `"3"` |
| `dateColumnId` | query | нет | — | — |
| `from` | query | нет | — | — |
| `to` | query | нет | — | — |
| `yColumnId` | query | да | — | `"4"` |
| `aggregation` | query | нет | — | `"count"` |
| `limit` | query | нет | — | `"50"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Точки графика |
| 400 | Некорректные параметры или чужой столбец |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица не найдена в проекте |
| 500 | Ошибка подсчёта |

### `GET` /api/projects/{id}/tables/{tableId}/chart/recommendations

Рекомендация графика по таблице

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Предлагает столбцы, подсчёт и вид рисунка по сводке значений, не возвращая сами строки.

**Operation ID:** `get_api_projects_id_tables_tableId_chart_recommendations_71a98282fdfd3d09`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Рекомендация |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица не найдена в проекте |

### `GET` /api/projects/{id}/tables/{tableId}/columns

Список колонок таблицы

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Колонки `bot_table_columns` для панели Database.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s http://localhost:5000/api/projects/42/tables/1/columns -b cookies.txt
```

**Operation ID:** `get_api_projects_id_tables_tableId_columns_5a6e16db5240fd7b`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив колонок |
| 400 | Некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 3,
    "tableId": 1,
    "name": "Цена",
    "position": 0
  },
  {
    "id": 4,
    "tableId": 1,
    "name": "Название",
    "position": 1
  }
]
```

### `POST` /api/projects/{id}/tables/{tableId}/columns

Создать колонку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Тело: `{ name, position? }` — `position` по умолчанию `0`.

**Auth:** `requireDbReady` + `requireProjectAccess`.

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tables/1/columns \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"name":"Цена","position":0}'
```

Без requestId сохраняется прежний формат ответа. Объект дополнен persistence; массив подтверждается JSON-заголовком x-botcraft-persistence. С requestId возвращается только квитанция IDs: повтор того же UUID и аргументов не выполняет запись снова. 202 unknown требует сверки, автоматический повтор запрещён. 409 означает повтор UUID с другими аргументами.

**Operation ID:** `post_api_projects_id_tables_tableId_columns_32156d67e5c61a85`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Цена",
  "position": 0
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Созданная колонка Без requestId — совместимый результат; с requestId — TableCompletedReceipt. |
| 202 | Исход требует сверки; не выполнять повтор автоматически |
| 400 | Нет name или некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 409 | UUID уже использован с другими аргументами либо конфликт создания |
| 500 | Ошибка БД |
| 503 | Журнал заявок недоступен; действие не выполнялось |

#### Пример ответа `201`

```json
{
  "id": 3,
  "tableId": 1,
  "name": "Цена",
  "position": 0,
  "persistence": {
    "confirmed": true,
    "projectId": 42,
    "tableId": 1
  }
}
```

### `DELETE` /api/projects/{id}/tables/{tableId}/columns/{columnId}

Удалить колонку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет колонку таблицы.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/tables/1/columns/3 \
  -b cookies.txt
```

**Operation ID:** `delete_api_projects_id_tables_tableId_columns_columnId_4a13cffc0f397b0f`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `columnId` | path | да | ID колонки bot_table_columns | `"3"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалено |
| 400 | Некорректный columnId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Колонка не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `PUT` /api/projects/{id}/tables/{tableId}/columns/{columnId}

Переименовать колонку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Обновляет `name` колонки `bot_table_columns`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tables/1/columns/3 \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"name":"Стоимость"}'
```

**Operation ID:** `put_api_projects_id_tables_tableId_columns_columnId_22b0b6dba1e4a387`

**Тело запроса:** `RenameBotTableColumnBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `columnId` | path | да | ID колонки bot_table_columns | `"3"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "name": "Стоимость"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённая колонка |
| 400 | Нет name или некорректный columnId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Колонка не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "id": 3,
  "tableId": 1,
  "name": "Стоимость",
  "position": 0
}
```

### `PUT` /api/projects/{id}/tables/{tableId}/columns/{columnId}/settings

Сохранить тип, подпись и ограничения столбца

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Внутреннее имя не меняется. Столбцы контента доступны только для чтения. min не может превышать max.

**Operation ID:** `put_api_projects_id_tables_tableId_columns_columnId_settings_9ebbb4c360adf9e8`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `columnId` | path | да | — | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Проверенные настройки записаны |
| 400 | Операция отклонена |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Операция отклонена |
| 409 | Исходное значение изменилось: вся операция отклонена |
| 500 | Операция отклонена |

### `PUT` /api/projects/{id}/tables/{tableId}/columns/reorder

Изменить порядок всех столбцов

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `put_api_projects_id_tables_tableId_columns_reorder_9123b926b3e3a3e1`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Столбцы |
| 400 | Отклонена валидация |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Объект не найден в проекте |
| 500 | Ошибка базы |

### `DELETE` /api/projects/{id}/tables/{tableId}/rows

Очистить строки с confirm:true

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `delete_api_projects_id_tables_tableId_rows_d2805f20985a19bd`

**Тело запроса:** `TableConfirmBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Число удалённых строк |
| 400 | Отклонена валидация |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Объект не найден в проекте |
| 500 | Ошибка базы |

### `GET` /api/projects/{id}/tables/{tableId}/rows

Список строк таблицы

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Строки `bot_table_rows` с `data: Record<string,string>`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s http://localhost:5000/api/projects/42/tables/1/rows -b cookies.txt
```

**Operation ID:** `get_api_projects_id_tables_tableId_rows_f328fc50d4222027`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив строк |
| 400 | Некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 10,
    "tableId": 1,
    "rowIndex": 0,
    "data": {
      "3": "100",
      "4": "Товар A"
    }
  }
]
```

### `POST` /api/projects/{id}/tables/{tableId}/rows

Создать строки (батч)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Тело `{ rows: [{ rowIndex?, data? }] }` — массив **непустой**. Без `rowIndex` берётся индекс в массиве; `data` по умолчанию `{}`.

**Auth:** `requireDbReady` + `requireProjectAccess`.

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tables/1/rows \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"rows":[{"rowIndex":0,"data":{"3":"100"}}]}'
```

Без requestId сохраняется прежний формат ответа. Объект дополнен persistence; массив подтверждается JSON-заголовком x-botcraft-persistence. С requestId возвращается только квитанция IDs: повтор того же UUID и аргументов не выполняет запись снова. 202 unknown требует сверки, автоматический повтор запрещён. 409 означает повтор UUID с другими аргументами.

**Operation ID:** `post_api_projects_id_tables_tableId_rows_e3f1769a74abe5da`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "rows": [
    {
      "rowIndex": 0,
      "data": {
        "3": "100",
        "4": "Товар A"
      }
    }
  ]
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Созданные строки Без requestId — совместимый результат; с requestId — TableCompletedReceipt. |
| 202 | Исход требует сверки; не выполнять повтор автоматически |
| 400 | Пустой rows или некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 409 | UUID уже использован с другими аргументами либо конфликт создания |
| 500 | Ошибка БД |
| 503 | Журнал заявок недоступен; действие не выполнялось |

#### Пример ответа `201`

```json
[
  {
    "id": 10,
    "tableId": 1,
    "rowIndex": 0,
    "data": {
      "3": "100",
      "4": "Товар A"
    }
  }
]
```

### `DELETE` /api/projects/{id}/tables/{tableId}/rows/{rowId}

Удалить строку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет строку `bot_table_rows`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X DELETE http://localhost:5000/api/projects/42/tables/1/rows/10 \
  -b cookies.txt
```

**Operation ID:** `delete_api_projects_id_tables_tableId_rows_rowId_e5cdb5c60e12f48a`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `rowId` | path | да | ID строки bot_table_rows | `"10"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалено |
| 400 | Некорректный rowId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Строка не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `GET` /api/projects/{id}/tables/{tableId}/rows/{rowId}

Получить строку таблицы

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `get_api_projects_id_tables_tableId_rows_rowId_0ee47f9ab773dcc1`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `rowId` | path | да | ID строки bot_table_rows | `"10"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Строка |
| 400 | Неверные параметры |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица или строка не найдена в проекте |
| 500 | Ошибка базы |

### `PATCH` /api/projects/{id}/tables/{tableId}/rows/{rowId}

Дополнить отдельные ячейки строки

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `patch_api_projects_id_tables_tableId_rows_rowId_cd08c78c632ff86e`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `rowId` | path | да | ID строки bot_table_rows | `"10"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённая строка из подтверждённой записи |
| 400 | Отклонена валидация |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Объект не найден в проекте |
| 500 | Ошибка базы |

### `PUT` /api/projects/{id}/tables/{tableId}/rows/{rowId}

Обновить строку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Тело `{ data: object }`. Side-effects: если таблица `_content` — `syncTableToScenario`; Redis `bot:table_updated:{projectId}` с JSON `{tableId}`.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X PUT http://localhost:5000/api/projects/42/tables/1/rows/10 \
  -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"data":{"3":"150","4":"Товар A"}}'
```

**Operation ID:** `put_api_projects_id_tables_tableId_rows_rowId_d95b10d0c00ecfbe`

**Тело запроса:** `UpdateBotTableRowBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `rowId` | path | да | ID строки bot_table_rows | `"10"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "data": {
    "3": "150",
    "4": "Товар A"
  }
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённая строка |
| 400 | Нет data или некорректный rowId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Строка не найдена |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "id": 10,
  "tableId": 1,
  "rowIndex": 0,
  "data": {
    "3": "150",
    "4": "Товар A"
  }
}
```

### `POST` /api/projects/{id}/tables/{tableId}/rows/count

Посчитать строки с фильтрами

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `post_api_projects_id_tables_tableId_rows_count_fa5d02ba4cf1e595`

**Тело запроса:** `QueryTableRowsBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Число подходящих строк |
| 400 | Неверные параметры |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица или строка не найдена в проекте |
| 500 | Ошибка базы |

### `POST` /api/projects/{id}/tables/{tableId}/rows/import

Импортировать до 200 строк

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Для replace обязателен confirm:true. Все строки проверяются до записи.

Без requestId сохраняется прежний формат ответа. Объект дополнен persistence; массив подтверждается JSON-заголовком x-botcraft-persistence. С requestId возвращается только квитанция IDs: повтор того же UUID и аргументов не выполняет запись снова. 202 unknown требует сверки, автоматический повтор запрещён. 409 означает повтор UUID с другими аргументами.

**Operation ID:** `post_api_projects_id_tables_tableId_rows_import_0a18c38efc1df0df`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Записанные строки Без requestId — совместимый результат; с requestId — TableCompletedReceipt. |
| 202 | Исход требует сверки; не выполнять повтор автоматически |
| 400 | Отклонена валидация |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Объект не найден в проекте |
| 409 | UUID уже использован с другими аргументами либо конфликт создания |
| 500 | Ошибка базы |
| 503 | Журнал заявок недоступен; действие не выполнялось |

### `POST` /api/projects/{id}/tables/{tableId}/rows/query

Страница строк с фильтрами

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

До 5 условий, limit по умолчанию 100 и не больше 500, таймаут SQL 5 с. Старый GET …/rows без лимита сохранён для интерфейса.

**Operation ID:** `post_api_projects_id_tables_tableId_rows_query_16cd3aeb27f19218`

**Тело запроса:** `QueryTableRowsBody`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Страница |
| 400 | Плохой фильтр |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |

### `POST` /api/projects/{id}/tables/{tableId}/rows/reindex

Переиндексировать строки

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Пересчитывает `rowIndex` строк таблицы. В Express регистрируется **до** `/rows/:rowId`, чтобы `reindex` не воспринимался как rowId.

**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).

**Клиент:** `tables-api` → TablesPanel.

```bash
curl -s -X POST http://localhost:5000/api/projects/42/tables/1/rows/reindex \
  -b cookies.txt
```

**Operation ID:** `post_api_projects_id_tables_tableId_rows_reindex_243a4b51fecca394`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Индексы обновлены |
| 400 | Некорректный tableId |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "success": true
}
```

### `GET` /api/projects/{id}/tables/{tableId}/summary

Заполненность столбцов и число строк

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `get_api_projects_id_tables_tableId_summary_f55a8d2b8138d9b8`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `tableId` | path | да | ID таблицы bot_tables | `"1"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сводка |
| 400 | Неверные параметры |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 404 | Таблица или строка не найдена в проекте |
| 500 | Ошибка базы |

### `POST` /api/projects/{id}/tables/import

Импортировать встроенный пакет таблиц одной транзакцией

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

До 50 таблиц по 200 строк. Для mode=replace обязателен confirm:true. Совпадение ширины строк и уникальность имён проверяются общим контрактом.

Без requestId сохраняется прежний формат ответа. Объект дополнен persistence; массив подтверждается JSON-заголовком x-botcraft-persistence. С requestId возвращается только квитанция IDs: повтор того же UUID и аргументов не выполняет запись снова. 202 unknown требует сверки, автоматический повтор запрещён. 409 означает повтор UUID с другими аргументами.

**Operation ID:** `post_api_projects_id_tables_import_f76042dbd7fa85ac`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Все таблицы записаны после COMMIT Без requestId — совместимый результат; с requestId — TableCompletedReceipt. |
| 202 | Исход требует сверки; не выполнять повтор автоматически |
| 400 | Проверка формы или откат всего пакета |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
| 409 | UUID уже использован с другими аргументами либо конфликт создания |
| 500 | Ошибка базы |
| 503 | Журнал заявок недоступен; действие не выполнялось |

### `GET` /api/projects/{id}/tables/search

Найти таблицы по части имени

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Только пользовательские bot_tables. Параметр q обязателен, limit от 1 до 100.

**Operation ID:** `get_api_projects_id_tables_search_4f977b876ff1a867`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID проекта bot_projects | `"42"` |
| `q` | query | да | — | — |
| `limit` | query | нет | — | — |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Найденные таблицы |
| 400 | Нет q |
| 401 | Нет session cookie и Bearer PAT |
| 403 | Нет доступа к проекту |
