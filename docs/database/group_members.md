# group_members

## group_members

Таблица участников групп

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор участника |
| group_id | integer | - | NO | - | [bot_groups.id](./bot_groups.md) | Идентификатор группы (ссылка на bot_groups.id) |
| user_id | bigint | - | NO | - | - | Идентификатор пользователя в Telegram |
| username | text | - | YES | - | - | Имя пользователя в Telegram |
| first_name | text | - | YES | - | - | Имя пользователя |
| last_name | text | - | YES | - | - | Фамилия пользователя |
| status | text | `'member'` | YES | - | - | Статус участника |
| is_bot | integer | `0` | YES | - | - | Флаг бота (0 = человек, 1 = бот) |
| admin_rights | jsonb | `{}` | YES | - | - | Права администратора (если пользователь админ) |
| custom_title | text | - | YES | - | - | Кастомный титул администратора |
| restrictions | jsonb | `{}` | YES | - | - | Ограничения (если пользователь ограничен) |
| restricted_until | timestamp | - | YES | - | - | Дата окончания ограничения |
| joined_at | timestamp | `now()` | YES | - | - | Дата вступления в группу |
| last_seen | timestamp | - | YES | - | - | Дата последнего появления |
| message_count | integer | `0` | YES | - | - | Количество сообщений участника |
| is_active | integer | `1` | YES | - | - | Флаг активности (0 = неактивен, 1 = активен) |
| created_at | timestamp | `now()` | YES | - | - | Дата создания записи |
| updated_at | timestamp | `now()` | YES | - | - | Дата последнего обновления записи |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_group_id_bot_groups | FOREIGN KEY | (group_id) → bot_groups(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_groups.id](./bot_groups.md) | **[group_members.group_id](./group_members.md)** | Many to One |
