# bot_launch_history

## bot_launch_history

Таблица истории запусков ботов — накапливает все запуски

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [bot_logs.launch_id](./bot_logs.md) | - | Уникальный идентификатор записи |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта (ссылка на bot_projects.id) |
| token_id | integer | - | NO | - | [bot_tokens.id](./bot_tokens.md) | Идентификатор токена (ссылка на bot_tokens.id) |
| status | text | `'running'` | NO | - | - | Статус запуска: running, stopped или error |
| started_at | timestamp | `now()` | YES | - | - | Время запуска бота |
| stopped_at | timestamp | - | YES | - | - | Время остановки бота (null если ещё работает) |
| error_message | text | - | YES | - | - | Сообщение об ошибке (null если нет ошибки) |
| process_id | text | - | YES | - | - | Идентификатор системного процесса |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_token_id_bot_tokens | FOREIGN KEY | (token_id) → bot_tokens(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[bot_launch_history.project_id](./bot_launch_history.md)** | Many to One |
| [bot_tokens.id](./bot_tokens.md) | **[bot_launch_history.token_id](./bot_launch_history.md)** | Many to One |
| **[bot_launch_history.id](./bot_launch_history.md)** | [bot_logs.launch_id](./bot_logs.md) | Many to One |
