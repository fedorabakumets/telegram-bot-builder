# bot_tokens

## bot_tokens

Таблица токенов ботов

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [bot_env_variables.token_id](./bot_env_variables.md), [bot_instances.token_id](./bot_instances.md), [bot_launch_history.token_id](./bot_launch_history.md), [bot_logs.token_id](./bot_logs.md), [media_file_tokens.token_id](./media_file_tokens.md) | - | Уникальный идентификатор токена |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта (ссылка на bot_projects.id) |
| owner_id | bigint | - | YES | - | [telegram_users.id](./telegram_users.md) | Идентификатор владельца токена (наследуется от проекта) |
| name | text | - | NO | - | - | Пользовательское имя для токена |
| token | text | - | NO | - | - | Токен бота (хранится в зашифрованном виде) |
| is_default | integer | `0` | YES | - | - | Флаг токена по умолчанию (0 = нет, 1 = да) |
| is_active | integer | `1` | YES | - | - | Флаг активности токена (0 = неактивен, 1 = активен) |
| description | text | - | YES | - | - | Описание токена |
| bot_first_name | text | - | YES | - | - | Имя бота из Telegram API |
| bot_username | text | - | YES | - | - | Имя пользователя бота (@username) из Telegram API |
| bot_description | text | - | YES | - | - | Полное описание бота из Telegram API |
| bot_short_description | text | - | YES | - | - | Короткое описание бота из Telegram API |
| bot_photo_url | text | - | YES | - | - | URL аватарки бота из Telegram API |
| bot_can_join_groups | integer | - | YES | - | - | Флаг возможности бота присоединяться к группам |
| bot_can_read_all_group_messages | integer | - | YES | - | - | Флаг возможности бота читать все сообщения в группах |
| bot_supports_inline_queries | integer | - | YES | - | - | Флаг поддержки инлайн-запросов ботом |
| bot_has_main_web_app | integer | - | YES | - | - | Флаг наличия главного веб-приложения у бота |
| last_used_at | timestamp | - | YES | - | - | Время последнего использования токена |
| track_execution_time | integer | `0` | YES | - | - | Флаг отслеживания времени выполнения (0 = выключено, 1 = включено) |
| total_execution_seconds | integer | `0` | YES | - | - | Общее время выполнения в секундах |
| auto_restart | integer | `0` | YES | - | - | Флаг автоперезапуска при краше (0 = выключено, 1 = включено) |
| max_restart_attempts | integer | `3` | YES | - | - | Максимальное количество попыток автоперезапуска подряд |
| log_level | text | `'DEBUG'` | YES | - | - | Уровень логирования Python-бота (DEBUG, INFO, WARNING, ERROR) |
| protect_content | integer | `0` | YES | - | - | Защита контента от копирования/пересылки (0 = выключено, 1 = включено) |
| save_incoming_media | integer | `0` | YES | - | - | Флаг сохранения входящих медиафайлов от пользователей (0 = выключено, 1 = включено) |
| catch_all_handlers | integer | `1` | YES | - | - | Генерировать catch-all обработчики необработанных сообщений/callback (0 = выключено, 1 = включено). При наличии incoming-триггеров/динамических кнопок генератор включает их принудительно независимо от флага. |
| content_cache | integer | `1` | YES | - | - | Живое обновление контента из таблицы _content без перезапуска (0 = выключено, 1 = включено). Управляет генерацией load_content/ reload_content/_content_reload_loop/_content_subscribe_redis. |
| launch_mode | text | `'polling'` | YES | - | - | Режим запуска бота: 'polling' (по умолчанию) или 'webhook' |
| webhook_base_url | text | - | YES | - | - | Базовый URL для webhook режима (например https://example.com) |
| webhook_secret_token | text | - | YES | - | - | Секретный токен для верификации webhook запросов |
| userbot_enabled | integer | `0` | YES | - | - | Включён ли Telethon userbot (0 = выключено, 1 = включено) |
| userbot_api_id | text | - | YES | - | - | API ID для Telethon (из my.telegram.org) |
| userbot_api_hash | text | - | YES | - | - | API Hash для Telethon (из my.telegram.org) |
| userbot_session_string | text | - | YES | - | - | Session string для Telethon (авторизованная сессия) |
| created_at | timestamp | `now()` | YES | - | - | Дата создания токена |
| updated_at | timestamp | `now()` | YES | - | - | Дата последнего обновления токена |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_owner_id_telegram_users | FOREIGN KEY | (owner_id) → telegram_users(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[bot_tokens.id](./bot_tokens.md)** | [bot_env_variables.token_id](./bot_env_variables.md) | Many to One |
| **[bot_tokens.id](./bot_tokens.md)** | [bot_instances.token_id](./bot_instances.md) | Many to One |
| **[bot_tokens.id](./bot_tokens.md)** | [bot_launch_history.token_id](./bot_launch_history.md) | Many to One |
| **[bot_tokens.id](./bot_tokens.md)** | [bot_logs.token_id](./bot_logs.md) | Many to One |
| [bot_projects.id](./bot_projects.md) | **[bot_tokens.project_id](./bot_tokens.md)** | Many to One |
| [telegram_users.id](./telegram_users.md) | **[bot_tokens.owner_id](./bot_tokens.md)** | Many to One |
| **[bot_tokens.id](./bot_tokens.md)** | [media_file_tokens.token_id](./media_file_tokens.md) | Many to One |
