# Доступ ботов к БД платформы

## Дата: 2026-10-01

**Статус:** проблема описана, не исправлена. Не срочно, но закрыть до роста числа пользователей.

---

## Суть

Каждый запущенный бот подключается к БД платформы под **главным пользователем** — тем же `DATABASE_URL`,
что и сервер. Сервер пишет его в `.env` бота (`server/files/createBotFile.ts`, `writeBotEnvFile`).

Код бота может выполнить любой SQL:

- нода `psql_query` с источником `builtin` — запрос через общий `db_pool` бота;
- нода `code` — `os.environ["DATABASE_URL"]` или чтение `.env` из папки бота.

Значит, любой автор бота может прочитать и изменить данные **всей платформы**.

Режим `WORKER_RUNTIME=docker` (см. [WORKER_DOCKER.md](../../deployment/WORKER_DOCKER.md)) эту проблему
**не закрывает**: контейнер не получает переменные сервера, но `.env` бота с `DATABASE_URL` в нём есть —
без него бот не может писать свои данные.

## Что доступно автору бота

| Таблица | Что внутри | Нужна ботам |
|---|---|---|
| `bot_tokens` | токены всех ботов, `userbot_session_string`, `userbot_api_hash` | нет |
| `telegram_users` | пользователи платформы | нет |
| `bot_projects` | сценарии всех проектов, владельцы | нет |
| `user_telegram_settings` | session string Client API | да (`broadcast-client`, `database-variables`) |
| `bot_users`, `bot_messages` | подписчики и переписка **всех** ботов | да, только своего проекта |
| `bot_tables`, `bot_table_rows`, `bot_table_columns` | таблицы ботов | да, только своего проекта |
| `media_files`, `schedule_state`, `*_activity_daily` | медиа, расписания, статистика | да, только своего проекта |

Таблицы, которые используют сгенерированные боты, взяты из SQL в `lib/templates/**/*.jinja2`.

## Связанные проблемы

### 1. SQL-инъекция в `psql_query` от пользователей бота

`lib/templates/psql-query/psql-query.py.jinja2` подставляет переменные прямо в текст запроса:

```python
_query = replace_variables_in_text({{ query | tojson }}, _all_vars)
_rows = await _conn.fetch(_query)
```

В `_all_vars` есть ответы пользователя бота (ввод, кнопки). Если сценарий содержит
`SELECT … WHERE name = '{user_name}'`, любой человек в Telegram может отправить `' OR 1=1; --`
и изменить запрос. Это атака **снаружи**, не от автора бота, и роль БД её не закрывает — нужны параметры
(`$1`, `$2`) вместо подстановки в текст.

### 2. `broadcast-client` берёт чужую сессию

`lib/templates/broadcast-client/broadcast-client.py.jinja2`:

```sql
SELECT session_string, user_id, api_id, api_hash FROM user_telegram_settings WHERE is_active = 1 LIMIT 1
```

Без фильтра по проекту или владельцу: рассылка «от юзербота» может уйти с первой активной сессии
любого пользователя платформы. Аналогично `database-variables` читает `user_id = 'default'`.

## Варианты решения

### A. Одна ограниченная роль для всех ботов (переменная + разовый скрипт)

1. Миграция создаёт роль `bot_runtime` с правами только на таблицы ботов (`bot_users`, `bot_messages`,
   `bot_tables`, `bot_table_rows`, `bot_table_columns`, `media_files`, `media_file_tokens`,
   `schedule_state`, `*_activity_daily`, `group_*`).
2. Новая переменная `BOT_DATABASE_URL` — строка подключения под этой ролью. Если задана, сервер пишет её
   в `.env` бота вместо `DATABASE_URL`.
3. `user_telegram_settings` в права не входит — сначала перевести `broadcast-client` на сессию из
   `bot_tokens` своего токена (сервер кладёт её в `.env` как `USERBOT_SESSION_STRING`).

Закрывает: кражу токенов, сессий userbot, списка пользователей и сценариев других людей.
Не закрывает: бот видит строки других проектов в общих таблицах (`bot_users`, `bot_messages`).

Объём: скрипт роли, несколько строк в `createBotFile.ts`, проверка шаблонов на таблицы вне списка,
правка `broadcast-client` / `database-variables`.

### B. Роль на проект + Row Level Security

1. Роль `bot_p<projectId>` создаётся при запуске бота, пароль — в `.env` бота.
2. RLS-политики на таблицах ботов: строка видна, только если `project_id` совпадает с проектом роли
   (`bot_table_rows` — через `bot_tables.project_id`).
3. Сервер работает под ролью с `BYPASSRLS`.

Закрывает и доступ к данным других проектов. Объём заметно больше: создание и чистка ролей,
политики на ~10 таблицах, проверка всех запросов шаблонов и производительности RLS.

### C. Параметры в `psql_query` (отдельно от A и B)

Переменные в запросе — только как параметры: `{name}` → `$1`, значения передаются в `fetch(query, *args)`.
Нужно для защиты от инъекции независимо от прав роли.

## Рекомендуемый порядок

1. **C** — параметры в `psql_query` (атака доступна любому пользователю Telegram).
2. **A** — `bot_runtime` + `BOT_DATABASE_URL`, вместе с правкой `broadcast-client`.
3. **B** — когда понадобится изоляция данных между проектами.

## Связанное

- [auth-and-isolation.md](auth-and-isolation.md)
- [api-security-audit.md](api-security-audit.md)
- [bot-worker-pool.md](bot-worker-pool.md)
- [WORKER_DOCKER.md](../../deployment/WORKER_DOCKER.md)
