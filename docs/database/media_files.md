# media_files

## media_files

Таблица медиафайлов

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [bot_message_media.media_file_id](./bot_message_media.md), [bot_messages.primary_media_id](./bot_messages.md), [media_file_tokens.media_file_id](./media_file_tokens.md), [media_files.thumbnail_media_id](./media_files.md) | - | Уникальный идентификатор файла |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта (ссылка на bot_projects.id) |
| file_name | text | - | NO | - | - | Оригинальное имя файла |
| file_type | text | - | NO | - | - | Тип файла ("photo", "video", "audio", "document") |
| file_path | text | - | NO | - | - | Путь к файлу на сервере |
| file_size | integer | - | NO | - | - | Размер файла в байтах |
| mime_type | text | - | NO | - | - | MIME тип файла |
| url | text | - | NO | - | - | URL для доступа к файлу |
| description | text | - | YES | - | - | Описание файла |
| tags | text[] | `[]` | YES | - | - | Теги для поиска |
| is_public | integer | `0` | YES | - | - | Флаг публичности (0 = приватный, 1 = публичный) |
| usage_count | integer | `0` | YES | - | - | Количество использований файла |
| telegram_file_id | text | - | YES | - | - | Кэшированный Telegram file_id для быстрой повторной отправки |
| thumbnail_media_id | integer | - | YES | - | [media_files.id](./media_files.md) | ID медиафайла-обложки (ссылка на фото из той же таблицы, только для видео) |
| thumbnail_url | text | - | YES | - | - | URL обложки видео (альтернатива thumbnailMediaId — для внешних URL без скачивания) |
| uploaded_by | bigint | - | YES | - | [telegram_users.id](./telegram_users.md) | ID пользователя Telegram, загрузившего файл (ссылка на telegram_users.id) |
| storage_backend | text | `'local'` | NO | - | - | Бэкенд хранилища файла ("local" \| "s3") |
| storage_config_id | text | - | YES | - | [storage_configs.id](./storage_configs.md) | ID конфигурации хранилища (ссылка на storage_configs.id) |
| file_unique_id | text | - | YES | - | - | Уникальный идентификатор файла Telegram (file_unique_id) для дедупликации |
| created_at | timestamp | `now()` | YES | - | - | Дата создания файла |
| updated_at | timestamp | `now()` | YES | - | - | Дата последнего обновления файла |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_thumbnail_media_id_media_files | FOREIGN KEY | (thumbnail_media_id) → media_files(id) |
| fk_uploaded_by_telegram_users | FOREIGN KEY | (uploaded_by) → telegram_users(id) |
| fk_storage_config_id_storage_configs | FOREIGN KEY | (storage_config_id) → storage_configs(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| media_files_url_project_id_unique | url, project_id | YES | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[media_files.id](./media_files.md)** | [bot_message_media.media_file_id](./bot_message_media.md) | Many to One |
| **[media_files.id](./media_files.md)** | [bot_messages.primary_media_id](./bot_messages.md) | Many to One |
| **[media_files.id](./media_files.md)** | [media_file_tokens.media_file_id](./media_file_tokens.md) | Many to One |
| [bot_projects.id](./bot_projects.md) | **[media_files.project_id](./media_files.md)** | Many to One |
| **[media_files.id](./media_files.md)** | [media_files.thumbnail_media_id](./media_files.md) | Many to One |
| [telegram_users.id](./telegram_users.md) | **[media_files.uploaded_by](./media_files.md)** | Many to One |
| [storage_configs.id](./storage_configs.md) | **[media_files.storage_config_id](./media_files.md)** | Many to One |
