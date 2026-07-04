# bot_messages

## bot_messages

Таблица истории сообщений между ботом и пользователями

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [bot_message_media.message_id](./bot_message_media.md) | - | Уникальный идентификатор сообщения |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта |
| token_id | integer | `0` | NO | - | - | Идентификатор токена бота для сегментации истории |
| user_id | text | - | NO | - | - | Идентификатор пользователя в Telegram |
| message_type | text | - | NO | - | - | Тип сообщения |
| message_text | text | - | YES | - | - | Текст сообщения |
| message_data | jsonb | - | YES | - | - | Дополнительные данные сообщения |
| node_id | text | - | YES | - | - | ID узла, отправившего сообщение |
| primary_media_id | integer | - | YES | - | [media_files.id](./media_files.md) | ID основного медиа |
| telegram_message_id | integer | - | YES | - | - | ID сообщения в Telegram (для удаления/редактирования через Telegram API) |
| chat_type | text | `'private'` | YES | - | - | Тип чата: 'private', 'group', 'supergroup', 'channel' |
| chat_id | text | - | YES | - | - | ID чата в Telegram (для групп отличается от user_id отправителя) |
| created_at | timestamp with time zone | `now()` | YES | - | - | Дата создания сообщения |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_primary_media_id_media_files | FOREIGN KEY | (primary_media_id) → media_files(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[bot_messages.id](./bot_messages.md)** | [bot_message_media.message_id](./bot_message_media.md) | Many to One |
| [bot_projects.id](./bot_projects.md) | **[bot_messages.project_id](./bot_messages.md)** | Many to One |
| [media_files.id](./media_files.md) | **[bot_messages.primary_media_id](./bot_messages.md)** | Many to One |
