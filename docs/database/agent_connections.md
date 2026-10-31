# agent_connections

## agent_connections

Связь агента с профилем; отключение запрещает повторную автоматическую выдачу PAT.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [agent_tokens.connection_id](./agent_tokens.md) | - | Идентификатор подключения |
| agent_id | text | - | NO | - | - | Идентификатор доверенного агента |
| owner_id | bigint | - | NO | - | [telegram_users.id](./telegram_users.md) | Telegram ID владельца |
| enabled | boolean | `true` | NO | - | - | Разрешена ли выдача доступа |
| created_at | timestamp with time zone | `now()` | NO | - | - | Время создания |
| updated_at | timestamp with time zone | `now()` | NO | - | - | Время изменения |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_owner_id_telegram_users | FOREIGN KEY | (owner_id) → telegram_users(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| agent_connections_agent_owner_idx | agent_id, owner_id | YES | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [telegram_users.id](./telegram_users.md) | **[agent_connections.owner_id](./agent_connections.md)** | Many to One |
| **[agent_connections.id](./agent_connections.md)** | [agent_tokens.connection_id](./agent_tokens.md) | Many to One |
