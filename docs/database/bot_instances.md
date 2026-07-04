# bot_instances

## bot_instances

Таблица запущенных экземпляров ботов  
  
ВАЖНО: После изменения этой схемы необходимо применить миграцию к базе данных!

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор экземпляра |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта (ссылка на bot_projects.id) |
| token_id | integer | - | NO | - | [bot_tokens.id](./bot_tokens.md) | Идентификатор токена (ссылка на bot_tokens.id) |
| status | text | - | NO | - | - | Статус экземпляра ("running", "stopped", "error") |
| token | text | - | NO | - | - | Токен бота |
| process_id | text | - | YES | - | - | Идентификатор процесса (если бот запущен) |
| started_at | timestamp | `now()` | YES | - | - | Время запуска экземпляра |
| stopped_at | timestamp | - | YES | - | - | Время остановки экземпляра |
| error_message | text | - | YES | - | - | Сообщение об ошибке (если есть) |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_token_id_bot_tokens | FOREIGN KEY | (token_id) → bot_tokens(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[bot_instances.project_id](./bot_instances.md)** | Many to One |
| [bot_tokens.id](./bot_tokens.md) | **[bot_instances.token_id](./bot_instances.md)** | Many to One |
