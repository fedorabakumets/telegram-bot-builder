# project_telegram_account_bots

## project_telegram_account_bots

Связь нескольких ботов с одним аккаунтом внутри проекта.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **bot_token_id** | integer | - | NO | - | [bot_tokens.project_id, id](./bot_tokens.md) | Токен может быть привязан только к одному аккаунту. |
| project_id | integer | - | NO | - | [project_telegram_accounts.project_id, id](./project_telegram_accounts.md), [bot_tokens.project_id, id](./bot_tokens.md) | Проект, общий для токена и аккаунта. |
| account_id | integer | - | NO | - | [project_telegram_accounts.project_id, id](./project_telegram_accounts.md) | Аккаунт, который использует бот. |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_account_id_project_telegram_accounts | FOREIGN KEY | (project_id, account_id) → project_telegram_accounts(project_id, id) |
| fk_project_id_bot_token_id_bot_tokens | FOREIGN KEY | (project_id, bot_token_id) → bot_tokens(project_id, id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| project_telegram_account_bots_project_account_idx | project_id, account_id | NO | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [project_telegram_accounts.project_id, id](./project_telegram_accounts.md) | **[project_telegram_account_bots.project_id, account_id](./project_telegram_account_bots.md)** | Many to One |
| [bot_tokens.project_id, id](./bot_tokens.md) | **[project_telegram_account_bots.project_id, bot_token_id](./project_telegram_account_bots.md)** | Many to One |
