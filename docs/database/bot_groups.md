# bot_groups

## bot_groups

Таблица групп бота

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [group_members.group_id](./group_members.md) | - | Уникальный идентификатор группы |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта (ссылка на bot_projects.id) |
| group_id | text | - | YES | - | - | Идентификатор группы в Telegram |
| name | text | - | NO | - | - | Отображаемое название группы |
| url | text | - | NO | - | - | Ссылка на группу |
| is_admin | integer | `0` | YES | - | - | Флаг администратора (0 = участник, 1 = администратор) |
| member_count | integer | - | YES | - | - | Количество участников |
| is_active | integer | `1` | YES | - | - | Флаг активности (0 = неактивная, 1 = активная) |
| description | text | - | YES | - | - | Описание группы |
| settings | jsonb | `{}` | YES | - | - | Настройки группы |
| avatar_url | text | - | YES | - | - | URL аватарки группы |
| chat_type | text | `'group'` | YES | - | - | Тип чата ("group", "supergroup", "channel") |
| invite_link | text | - | YES | - | - | Пригласительная ссылка |
| admin_rights | jsonb | `{"can_manage_chat":false,"can_change_info":false,"can_delete_messages":false,"can_invite_users":false,"can_restrict_members":false,"can_pin_messages":false,"can_promote_members":false,"can_manage_video_chats":false}` | YES | - | - | Права администратора бота в группе |
| messages_count | integer | `0` | YES | - | - | Количество сообщений в группе |
| active_users | integer | `0` | YES | - | - | Количество активных пользователей |
| last_activity | timestamp | - | YES | - | - | Дата последней активности |
| is_public | integer | `0` | YES | - | - | Флаг публичности (0 = частная, 1 = публичная) |
| language | text | `'ru'` | YES | - | - | Основной язык группы |
| timezone | text | - | YES | - | - | Часовой пояс группы |
| tags | text[] | `[]` | YES | - | - | Теги для категоризации |
| notes | text | - | YES | - | - | Заметки администратора |
| created_at | timestamp | `now()` | YES | - | - | Дата создания группы |
| updated_at | timestamp | `now()` | YES | - | - | Дата последнего обновления группы |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| bot_groups_project_group_uniq | project_id, group_id | YES | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[bot_groups.project_id](./bot_groups.md)** | Many to One |
| **[bot_groups.id](./bot_groups.md)** | [group_members.group_id](./group_members.md) | Many to One |
