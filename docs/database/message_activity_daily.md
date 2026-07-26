# message_activity_daily

## message_activity_daily

Дневные счётчики входящих/исходящих сообщений.  
Увеличиваются при записи сообщения; удаление из bot_messages их не уменьшает.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта |
| token_id | integer | `0` | NO | - | - | Идентификатор токена бота (0 — без сегментации) |
| day | date | - | NO | - | - | Календарный день счётчика (как DATE(created_at) в legacy-аналитике) |
| incoming_count | integer | `0` | NO | - | - | Число входящих сообщений (message_type = user) |
| outgoing_count | integer | `0` | NO | - | - | Число исходящих сообщений (message_type = bot и прочие не-user) |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| pk_project_id_token_id_day | PRIMARY KEY | (project_id, token_id, day) |
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[message_activity_daily.project_id](./message_activity_daily.md)** | Many to One |
