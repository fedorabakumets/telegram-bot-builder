# chat_access_check_jobs

## chat_access_check_jobs

Фоновая сверка доступности личных диалогов одного бота. Одновременно для пары проект+токен может быть только одна задача в статусе `pending`, `running` или `cancelling`.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Идентификатор задачи. |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Проект. |
| token_id | integer | - | NO | - | [bot_tokens.id](./bot_tokens.md) | Токен бота. |
| status | text | `'pending'` | NO | - | - | pending \| running \| cancelling \| cancelled \| completed \| failed. |
| total_count | integer | `0` | NO | - | - | Сколько личных диалогов в очереди. |
| processed_count | integer | `0` | NO | - | - | Сколько уже проверено. |
| available_count | integer | `0` | NO | - | - | Доступны. |
| kicked_count | integer | `0` | NO | - | - | Заблокировали бота. |
| deleted_count | integer | `0` | NO | - | - | Аккаунт удалён или чат не найден. |
| error_count | integer | `0` | NO | - | - | Прочие ошибки отдельных запросов. |
| started_at | timestamp with time zone | - | YES | - | - | Время старта. |
| finished_at | timestamp with time zone | - | YES | - | - | Время завершения. |
| created_at | timestamp with time zone | `now()` | NO | - | - | Время создания записи. |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| chat_access_check_jobs_pkey | PRIMARY KEY | (id) |
| chat_access_check_jobs_status_check | CHECK | status IN ('pending', 'running', 'cancelling', 'cancelled', 'completed', 'failed') |
| chat_access_check_jobs_one_active | UNIQUE INDEX | (project_id, token_id) WHERE status IN ('pending', 'running', 'cancelling') |
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_token_id_bot_tokens | FOREIGN KEY | (token_id) → bot_tokens(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[chat_access_check_jobs.project_id](./chat_access_check_jobs.md)** | Many to One |
| [bot_tokens.id](./bot_tokens.md) | **[chat_access_check_jobs.token_id](./chat_access_check_jobs.md)** | Many to One |

Перезапуск сервера не продолжает очередь: зависшую `running` задачу можно отменить через API, после этого она станет `cancelled`.
