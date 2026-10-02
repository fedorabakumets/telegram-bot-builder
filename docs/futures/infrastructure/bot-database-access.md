# Доступ ботов к базе панели

## Дата: 2026-10-02

**Статус:** отложено. Вернуться после параметров в `psql_query`. Проблема не закрыта.

---

## Как сейчас

Все боты подключаются к базе панели одним пользователем. Панель кладёт свой `DATABASE_URL` в окружение бота (`server/files/botEnv.ts`, `buildBotEnvContent`): боту он нужен, чтобы писать своих пользователей и сообщения. На Railway это пользователь `postgres`, владелец всех таблиц.

Фильтр по `project_id` пишет только код бота. База его не проверяет. Узел `psql_query` и нода `code` могут выполнить любой SQL от имени владельца базы:

```sql
SELECT token FROM bot_tokens
```

Так читаются токены всех ботов, сессии панели и чужие строки в общих таблицах `bot_users` и `bot_messages`. Эти таблицы одни на всю платформу. Чей пользователь, видно только по колонкам `project_id` и `token_id`.

Параметры `$1` в `psql_query` это не закрывают. Они мешают человеку в Telegram дописать команду через значение `{переменной}`. Автор бота по-прежнему пишет запрос целиком, а нода `code` выполняет любой Python.

Режим `WORKER_RUNTIME=docker` тоже не закрывает: контейнер не наследует секреты сервера, но строка подключения бота в его окружении остаётся.

## Что уже сделано рядом

- `psql_query` в режиме `builtin` выключен флагом `PSQL_BUILTIN_ENABLED` (по умолчанию выключен). Режим `env` с `DATABASE_URL` панели по-прежнему открыт.
- Воркер не наследует `SESSION_SECRET` и остальные секреты сервера. Ссылки `${{VAR}}` раскрываются только из `WORKER_ENV_PASSTHROUGH`.
- У каждого бота в воркере свой словарь переменных (`server/python/bot_env_overlay.py`).
- Рассылка больше не выбирает пользователей всех проектов: `PROJECT_ID` и `TOKEN_ID` передаются параметрами.

## Что делать, когда вернёмся

Одна роль `bot_runtime` на всех ботов и построчная защита. Отдельную роль на каждый проект не заводим.

1. Миграция от владельца базы создаёт `LOGIN`-роль `bot_runtime`. Пароль живёт только в `BOT_DATABASE_URL` на сервере.
2. Роли выдаются `SELECT`, `INSERT`, `UPDATE`, `DELETE` на таблицы, которые бот и так использует, и `USAGE`/`SELECT` на их sequence. Права `CREATE` не выдаются.
3. Сервер подставляет боту `BOT_DATABASE_URL` как `DATABASE_URL`. Панель продолжает работать своей строкой.
4. На таблицах ботов включается Row Level Security и `FORCE ROW LEVEL SECURITY`. Условие берёт `project_id` и `token_id` из `current_setting('app.project_id')` и `current_setting('app.token_id')`. Бот выставляет их сразу после соединения. Строки без своих колонок (`bot_table_rows`, `bot_message_media`) ограничиваются через родителя.
5. Автор бота это условие не пишет и убрать его не может. `SELECT * FROM bot_users` возвращает только строки этого бота. `SELECT token FROM bot_tokens` отклоняется: на таблицу нет прав.

Без построчной защиты роль всё равно читает `bot_users` и `bot_messages` всех проектов: право `SELECT` даётся на таблицу целиком.

### Таблицы роли

Разрешить: `bot_users`, `bot_messages`, `bot_message_media`, `media_files`, `media_file_tokens`, `bot_tables`, `bot_table_columns`, `bot_table_rows`, `message_activity_daily`, `user_activity_daily`, `schedule_state`.

Не выдавать: `telegram_users`, `session`, `app_settings`, `bot_projects`, `project_collaborators`, `bot_tokens`, `bot_env_variables`, `bot_instances`, `bot_launch_history`, `bot_logs`, `bot_groups`, `group_members`, `bot_templates`, `broadcasts`, `broadcast_results`, `broadcast_campaigns`, `project_versions`, `storage_configs`, `agent_tokens`, `bot_builds`, `worker_processes`, `user_project_archives`, `user_telegram_settings`.

### Что поправить в шаблонах до включения роли

Иначе боты на новой роли перестанут запускаться или продолжат читать чужое.

- Убрать `CREATE TABLE` из `init_database()` в `lib/templates/database/database.py.jinja2`. Схему создаёт панель.
- После `create_pool` выставлять `app.project_id` и `app.token_id`.
- `broadcast-client` и `database-variables` читают `user_telegram_settings` без проекта. Сессию брать из `USERBOT_*` своего токена, таблицу роли не давать.
- `forward-message` и `group-message-trigger` фильтруют не по всем нужным полям. Дописать `project_id` и `token_id`, иначе политики RLS обнулят выборку.
- `group_activity` в шаблоне есть, в миграциях панели нет. Либо завести таблицу с `project_id`, либо убрать запись.
- Нода `code` со своим адресом базы в переменных бота остаётся вне этой роли. Это отдельная угроза: пользователь приносит свой DSN.

### Sequence

`USAGE` и `SELECT` нужны на `bot_messages_id_seq`, `bot_message_media_id_seq`, `media_files_id_seq`, `media_file_tokens_id_seq`, `bot_tables_id_seq`, `bot_table_columns_id_seq`, `bot_table_rows_id_seq`, `schedule_state_id_seq`. У `bot_users` sequence нет: ключ составной. `message_activity_daily` и `user_activity_daily` тоже без sequence.

## Связанное

- [auth-and-isolation.md](auth-and-isolation.md)
- [api-security-audit.md](api-security-audit.md)
- [bot-worker-pool.md](bot-worker-pool.md)
- [WORKER_DOCKER.md](../../deployment/WORKER_DOCKER.md)
