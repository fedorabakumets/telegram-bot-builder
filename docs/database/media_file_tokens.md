# media_file_tokens

## media_file_tokens

Таблица file_id медиафайла по токенам ботов (денормализация fileIdsByToken).  
Уникальность пары (медиафайл, токен) гарантирует один file_id на бота.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор записи |
| media_file_id | integer | - | NO | - | [media_files.id](./media_files.md) | Идентификатор медиафайла (ссылка на media_files.id) |
| token_id | integer | - | NO | - | [bot_tokens.id](./bot_tokens.md) | Идентификатор токена бота (ссылка на bot_tokens.id) |
| file_id | text | - | NO | - | - | Telegram file_id медиафайла для конкретного бота |
| created_at | timestamp | `now()` | YES | - | - | Дата создания записи |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_media_file_id_media_files | FOREIGN KEY | (media_file_id) → media_files(id) |
| fk_token_id_bot_tokens | FOREIGN KEY | (token_id) → bot_tokens(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| media_file_tokens_media_token_unique | media_file_id, token_id | YES | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [media_files.id](./media_files.md) | **[media_file_tokens.media_file_id](./media_file_tokens.md)** | Many to One |
| [bot_tokens.id](./bot_tokens.md) | **[media_file_tokens.token_id](./media_file_tokens.md)** | Many to One |
