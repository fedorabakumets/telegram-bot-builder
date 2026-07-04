# telegram_users

## telegram_users

Таблица аутентифицированных пользователей Telegram

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | bigint | - | NO | [agent_tokens.owner_id](./agent_tokens.md), [bot_projects.owner_id](./bot_projects.md), [bot_templates.owner_id](./bot_templates.md), [bot_tokens.owner_id](./bot_tokens.md), [media_files.uploaded_by](./media_files.md), [project_collaborators.user_id](./project_collaborators.md), [project_collaborators.invited_by](./project_collaborators.md), [project_versions.author_id](./project_versions.md) | - | Уникальный идентификатор пользователя в Telegram |
| first_name | text | - | NO | - | - | Имя пользователя |
| last_name | text | - | YES | - | - | Фамилия пользователя |
| username | text | - | YES | - | - | Имя пользователя в Telegram (username) |
| photo_url | text | - | YES | - | - | URL фотографии пользователя |
| auth_date | bigint | - | YES | - | - | Дата аутентификации |
| created_at | timestamp | `now()` | YES | - | - | Дата создания записи |
| updated_at | timestamp | `now()` | YES | - | - | Дата последнего обновления записи |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[telegram_users.id](./telegram_users.md)** | [agent_tokens.owner_id](./agent_tokens.md) | Many to One |
| **[telegram_users.id](./telegram_users.md)** | [bot_projects.owner_id](./bot_projects.md) | Many to One |
| **[telegram_users.id](./telegram_users.md)** | [bot_templates.owner_id](./bot_templates.md) | Many to One |
| **[telegram_users.id](./telegram_users.md)** | [bot_tokens.owner_id](./bot_tokens.md) | Many to One |
| **[telegram_users.id](./telegram_users.md)** | [media_files.uploaded_by](./media_files.md) | Many to One |
| **[telegram_users.id](./telegram_users.md)** | [project_collaborators.user_id](./project_collaborators.md) | Many to One |
| **[telegram_users.id](./telegram_users.md)** | [project_collaborators.invited_by](./project_collaborators.md) | Many to One |
| **[telegram_users.id](./telegram_users.md)** | [project_versions.author_id](./project_versions.md) | Many to One |
