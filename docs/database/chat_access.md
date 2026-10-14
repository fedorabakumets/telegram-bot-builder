# chat_access

## chat_access

Последняя проверка конкретного чата выбранным ботом.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта. |
| token_id | integer | - | NO | - | [bot_tokens.id](./bot_tokens.md) | Идентификатор токена. |
| chat_id | text | - | NO | - | - | Строковый идентификатор чата Telegram. |
| status | text | - | NO | - | - | Результат проверки: доступен, исключён или ошибка. |
| checked_at | timestamp with time zone | - | NO | - | - | Время завершения проверки. |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| pk_project_id_token_id_chat_id | PRIMARY KEY | (project_id, token_id, chat_id) |
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_token_id_bot_tokens | FOREIGN KEY | (token_id) → bot_tokens(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[chat_access.project_id](./chat_access.md)** | Many to One |
| [bot_tokens.id](./bot_tokens.md) | **[chat_access.token_id](./chat_access.md)** | Many to One |
