# bot_message_media

## bot_message_media

Таблица связи сообщений с медиафайлами

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор связи |
| message_id | integer | - | NO | - | [bot_messages.id](./bot_messages.md) | ID сообщения |
| media_file_id | integer | - | NO | - | [media_files.id](./media_files.md) | ID медиафайла |
| media_kind | text | - | NO | - | - | Тип медиа |
| order_index | integer | `0` | YES | - | - | Порядковый индекс медиа |
| created_at | timestamp | `now()` | YES | - | - | Дата создания связи |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_message_id_bot_messages | FOREIGN KEY | (message_id) → bot_messages(id) |
| fk_media_file_id_media_files | FOREIGN KEY | (media_file_id) → media_files(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_messages.id](./bot_messages.md) | **[bot_message_media.message_id](./bot_message_media.md)** | Many to One |
| [media_files.id](./media_files.md) | **[bot_message_media.media_file_id](./bot_message_media.md)** | Many to One |
