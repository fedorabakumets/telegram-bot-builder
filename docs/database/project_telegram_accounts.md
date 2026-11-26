# project_telegram_accounts

## project_telegram_accounts

Telegram-аккаунты, принадлежащие проекту.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [project_telegram_account_bots.project_id, account_id](./project_telegram_account_bots.md) | - | Уникальный идентификатор аккаунта. |
| project_id | integer | - | NO | [project_telegram_account_bots.project_id, account_id](./project_telegram_account_bots.md) | [bot_projects.id](./bot_projects.md) | Проект, которому принадлежит аккаунт. |
| name | text | - | NO | - | - | Название карточки аккаунта. |
| masked_phone | text | - | YES | - | - | Телефон, маскированный для интерфейса. |
| telegram_user_id | text | - | YES | - | - | Идентификатор аккаунта Telegram в строковом виде. |
| telegram_name | text | - | YES | - | - | Имя аккаунта Telegram. |
| telegram_username | text | - | YES | - | - | Имя пользователя Telegram. |
| session_kind | text | - | YES | - | - | Способ подключения сессии. |
| session_secret | text | - | YES | - | - | Зашифрованный набор параметров доступа к Telegram. |
| session_fingerprint | text | - | YES | - | - | Отпечаток ключа сессии для предотвращения повторного импорта. |
| session_verified | boolean | `false` | NO | - | - | Telegram подтвердил, что сохранённая сессия авторизована. |
| proxy | jsonb | - | YES | - | - | Сведения о прокси, которые отображаются пользователю. |
| proxy_secret | text | - | YES | - | - | Зашифрованные параметры входа в прокси. |
| created_at | timestamp with time zone | `now()` | NO | - | - | Дата создания карточки. |
| updated_at | timestamp with time zone | `now()` | NO | - | - | Дата изменения карточки. |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| project_telegram_accounts_project_id_id | UNIQUE | (project_id, id) |
| project_telegram_accounts_session_fingerprint | UNIQUE | (session_fingerprint) |
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[project_telegram_accounts.project_id, id](./project_telegram_accounts.md)** | [project_telegram_account_bots.project_id, account_id](./project_telegram_account_bots.md) | Many to One |
| [bot_projects.id](./bot_projects.md) | **[project_telegram_accounts.project_id](./project_telegram_accounts.md)** | Many to One |
