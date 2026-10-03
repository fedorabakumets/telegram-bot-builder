# support_threads

## support_threads

Диалог поддержки: ровно один на пользователя платформы

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [support_messages.thread_id](./support_messages.md) | - | Уникальный идентификатор диалога |
| user_id | bigint | - | NO | - | [telegram_users.id](./telegram_users.md) | Пользователь платформы (ссылка на telegram_users.id), уникален |
| status | text | `'open'` | NO | - | - | Статус диалога: "open" или "closed" |
| unread_by_admin | integer | `0` | NO | - | - | Количество сообщений пользователя, не прочитанных администратором |
| unread_by_user | integer | `0` | NO | - | - | Количество ответов администратора, не прочитанных пользователем |
| telegram_topic_id | integer | - | YES | - | - | Идентификатор темы в Telegram-группе поддержки (мост в Telegram) |
| last_message_at | timestamp | `now()` | NO | - | - | Время последнего сообщения — для сортировки списка |
| created_at | timestamp | `now()` | NO | - | - | Дата создания диалога |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_user_id_telegram_users | FOREIGN KEY | (user_id) → telegram_users(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| support_threads_last_message_idx | last_message_at | NO | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[support_threads.id](./support_threads.md)** | [support_messages.thread_id](./support_messages.md) | Many to One |
| [telegram_users.id](./telegram_users.md) | **[support_threads.user_id](./support_threads.md)** | Many to One |
