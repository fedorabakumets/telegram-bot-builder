# agent_tokens

## agent_tokens

Таблица персональных токенов агента.  
Сам секрет НЕ хранится — только его sha-256 хеш. Токен несёт личность владельца,  
поэтому внешний клиент (MCP-сервер) работает только со своими проектами.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор токена |
| owner_id | bigint | - | NO | - | [telegram_users.id](./telegram_users.md) | Идентификатор владельца токена (ссылка на telegram_users.id) |
| label | text | - | NO | - | - | Пользовательское имя токена для отображения |
| token_hash | text | - | NO | - | - | Хеш токена (sha-256 hex) — уникальный индекс, сам токен не хранится |
| prefix | text | - | NO | - | - | Префикс токена (первые ~12 символов) для отображения в списке |
| scopes | text | `'read,write'` | NO | - | - | Права токена через запятую (по умолчанию read,write) — задел под разграничение |
| created_at | timestamp | `now()` | YES | - | - | Дата создания токена |
| last_used_at | timestamp | - | YES | - | - | Время последнего использования токена (обновляется при резолве) |
| expires_at | timestamp | - | YES | - | - | Дата истечения токена (null — бессрочный) |
| revoked_at | timestamp | - | YES | - | - | Дата отзыва токена (null — активен) |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_owner_id_telegram_users | FOREIGN KEY | (owner_id) → telegram_users(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| agent_tokens_token_hash_idx | token_hash | YES | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [telegram_users.id](./telegram_users.md) | **[agent_tokens.owner_id](./agent_tokens.md)** | Many to One |
