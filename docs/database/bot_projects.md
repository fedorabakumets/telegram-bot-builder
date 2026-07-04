# bot_projects

## bot_projects

Таблица проектов ботов

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [bot_groups.project_id](./bot_groups.md), [bot_instances.project_id](./bot_instances.md), [bot_launch_history.project_id](./bot_launch_history.md), [bot_logs.project_id](./bot_logs.md), [bot_messages.project_id](./bot_messages.md), [bot_tables.project_id](./bot_tables.md), [bot_tokens.project_id](./bot_tokens.md), [broadcasts.project_id](./broadcasts.md), [media_files.project_id](./media_files.md), [project_collaborators.project_id](./project_collaborators.md), [project_versions.project_id](./project_versions.md) | - | Уникальный идентификатор проекта |
| owner_id | bigint | - | YES | - | [telegram_users.id](./telegram_users.md) | Идентификатор владельца проекта (ссылка на telegram_users.id) |
| name | text | - | NO | - | - | Название проекта |
| description | text | - | YES | - | - | Описание проекта |
| data | jsonb | - | NO | - | - | JSON-данные проекта (структура узлов, соединений и т.д.) |
| bot_token | text | - | YES | - | - | Токен бота (сохраняется в зашифрованном виде) |
| user_database_enabled | integer | `1` | YES | - | - | Флаг включения пользовательской базы данных (0 = выключена, 1 = включена) |
| last_exported_google_sheet_id | text | - | YES | - | - | ID последней экспортированной Google Таблицы пользователей |
| last_exported_google_sheet_url | text | - | YES | - | - | URL последней экспортированной Google Таблицы пользователей |
| last_exported_at | timestamp | - | YES | - | - | Дата последнего экспорта пользователей в Google Таблицы |
| last_exported_structure_sheet_id | text | - | YES | - | - | ID последней экспортированной Google Таблицы структуры проекта |
| last_exported_structure_sheet_url | text | - | YES | - | - | URL последней экспортированной Google Таблицы структуры проекта |
| last_exported_structure_at | timestamp | - | YES | - | - | Дата последнего экспорта структуры проекта в Google Таблицы |
| created_at | timestamp | `now()` | YES | - | - | Дата создания проекта |
| updated_at | timestamp | `now()` | YES | - | - | Дата последнего обновления проекта |
| sort_order | real | `0` | YES | - | - | Порядок сортировки проекта в списке |
| admin_ids | text | `''` | YES | - | - | ID администраторов бота (через запятую) |
| session_id | text | - | YES | - | - | ID сессии гостевого пользователя (для изоляции гостевых проектов) |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_owner_id_telegram_users | FOREIGN KEY | (owner_id) → telegram_users(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[bot_projects.id](./bot_projects.md)** | [bot_groups.project_id](./bot_groups.md) | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [bot_instances.project_id](./bot_instances.md) | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [bot_launch_history.project_id](./bot_launch_history.md) | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [bot_logs.project_id](./bot_logs.md) | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [bot_messages.project_id](./bot_messages.md) | Many to One |
| [telegram_users.id](./telegram_users.md) | **[bot_projects.owner_id](./bot_projects.md)** | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [bot_tables.project_id](./bot_tables.md) | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [bot_tokens.project_id](./bot_tokens.md) | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [broadcasts.project_id](./broadcasts.md) | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [media_files.project_id](./media_files.md) | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [project_collaborators.project_id](./project_collaborators.md) | Many to One |
| **[bot_projects.id](./bot_projects.md)** | [project_versions.project_id](./project_versions.md) | Many to One |
