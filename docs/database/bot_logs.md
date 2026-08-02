# bot_logs

## bot_logs

Таблица логов ботов — хранит строки вывода stdout/stderr/status

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор записи |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта (ссылка на bot_projects.id) |
| token_id | integer | - | NO | - | [bot_tokens.id](./bot_tokens.md) | Идентификатор токена (ссылка на bot_tokens.id) |
| launch_id | integer | - | YES | - | [bot_launch_history.id](./bot_launch_history.md) | Идентификатор запуска (ссылка на bot_launch_history.id) |
| content | text | - | NO | - | - | Содержимое строки лога |
| type | text | `'stdout'` | NO | - | - | Тип строки лога: stdout, stderr или status |
| timestamp | timestamp | `now()` | YES | - | - | Временная метка создания записи |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_token_id_bot_tokens | FOREIGN KEY | (token_id) → bot_tokens(id) |
| fk_launch_id_bot_launch_history | FOREIGN KEY | (launch_id) → bot_launch_history(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[bot_logs.project_id](./bot_logs.md)** | Many to One |
| [bot_tokens.id](./bot_tokens.md) | **[bot_logs.token_id](./bot_logs.md)** | Many to One |
| [bot_launch_history.id](./bot_launch_history.md) | **[bot_logs.launch_id](./bot_logs.md)** | Many to One |
