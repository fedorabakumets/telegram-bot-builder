# bot_env_variables

## bot_env_variables

Таблица пользовательских переменных окружения бота  
Хранит кастомные key=value переменные, привязанные к конкретному токену

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор записи |
| token_id | integer | - | NO | - | [bot_tokens.id](./bot_tokens.md) | Идентификатор токена (ссылка на bot_tokens.id) |
| key | text | - | NO | - | - | Имя переменной (KEY) — только A-Z, 0-9, _ |
| value | text | `''` | NO | - | - | Значение переменной |
| is_secret | integer | `0` | YES | - | - | Флаг секретности (1 = скрывать значение, 0 = показывать) |
| created_at | timestamp | `now()` | YES | - | - | Дата создания |
| updated_at | timestamp | `now()` | YES | - | - | Дата последнего обновления |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_token_id_bot_tokens | FOREIGN KEY | (token_id) → bot_tokens(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_tokens.id](./bot_tokens.md) | **[bot_env_variables.token_id](./bot_env_variables.md)** | Many to One |
