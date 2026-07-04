# project_collaborators

## project_collaborators

Таблица коллабораторов проекта.  
Хранит связи между проектами и пользователями, имеющими доступ к ним.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта (ссылка на bot_projects.id) |
| user_id | bigint | - | NO | - | [telegram_users.id](./telegram_users.md) | Идентификатор пользователя-коллаборатора (ссылка на telegram_users.id) |
| invited_by | bigint | - | YES | - | [telegram_users.id](./telegram_users.md) | Идентификатор пользователя, пригласившего коллаборатора |
| created_at | timestamp | `now()` | YES | - | - | Дата добавления коллаборатора |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| pk_project_id_user_id | PRIMARY KEY | (project_id, user_id) |
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_user_id_telegram_users | FOREIGN KEY | (user_id) → telegram_users(id) |
| fk_invited_by_telegram_users | FOREIGN KEY | (invited_by) → telegram_users(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[project_collaborators.project_id](./project_collaborators.md)** | Many to One |
| [telegram_users.id](./telegram_users.md) | **[project_collaborators.user_id](./project_collaborators.md)** | Many to One |
| [telegram_users.id](./telegram_users.md) | **[project_collaborators.invited_by](./project_collaborators.md)** | Many to One |
