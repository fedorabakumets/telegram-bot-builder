# support_attachments

## support_attachments

Картинка, приложенная к сообщению поддержки.  
Файл лежит в активном хранилище, не в media_files проекта.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор вложения |
| message_id | integer | - | NO | - | [support_messages.id](./support_messages.md) | Сообщение (ссылка на support_messages.id), удаляется вместе с ним |
| file_name | text | - | NO | - | - | Исходное имя файла |
| mime | text | - | NO | - | - | MIME, определённый по содержимому: png, jpeg, webp или gif |
| size | integer | - | NO | - | - | Размер в байтах |
| storage_config_id | text | - | NO | - | - | Идентификатор хранилища из storage_configs |
| storage_key | text | - | NO | - | - | Ключ объекта в хранилище |
| created_at | timestamp | `now()` | NO | - | - | Дата загрузки |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_message_id_support_messages | FOREIGN KEY | (message_id) → support_messages(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| support_attachments_message_idx | message_id | NO | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [support_messages.id](./support_messages.md) | **[support_attachments.message_id](./support_attachments.md)** | Many to One |
