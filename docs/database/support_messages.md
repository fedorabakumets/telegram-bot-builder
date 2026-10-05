# support_messages

## support_messages

Сообщение в диалоге поддержки

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [support_attachments.message_id](./support_attachments.md) | - | Уникальный идентификатор сообщения |
| thread_id | integer | - | NO | - | [support_threads.id](./support_threads.md) | Диалог (ссылка на support_threads.id) |
| sender | text | - | NO | - | - | Отправитель: "user" или "admin" |
| text | text | - | NO | - | - | Текст сообщения |
| context | jsonb | - | YES | - | - | Контекст отправки: проект, страница, браузер |
| source | text | `'web'` | NO | - | - | Откуда пришло сообщение: "web" или "telegram" |
| created_at | timestamp | `now()` | NO | - | - | Дата создания сообщения |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_thread_id_support_threads | FOREIGN KEY | (thread_id) → support_threads(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| support_messages_thread_idx | thread_id, id | NO | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[support_messages.id](./support_messages.md)** | [support_attachments.message_id](./support_attachments.md) | Many to One |
| [support_threads.id](./support_threads.md) | **[support_messages.thread_id](./support_messages.md)** | Many to One |
