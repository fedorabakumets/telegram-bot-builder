# broadcasts

## broadcasts

Таблица рассылок — хранит задания на массовую отправку сообщений

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [broadcast_results.broadcast_id](./broadcast_results.md) | - | Уникальный идентификатор рассылки |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта |
| token_id | integer | `0` | NO | - | - | Идентификатор токена бота |
| name | text | - | NO | - | - | Название рассылки |
| message_text | text | - | NO | - | - | HTML-текст сообщения рассылки |
| filters | jsonb | `{}` | NO | - | - | Фильтры аудитории в формате JSON |
| status | text | `'pending'` | NO | - | - | Статус рассылки: pending \| running \| stopped \| done \| failed |
| total_count | integer | `0` | NO | - | - | Всего получателей |
| sent_count | integer | `0` | NO | - | - | Отправлено сообщений |
| delivered_count | integer | `0` | NO | - | - | Доставлено успешно |
| failed_count | integer | `0` | NO | - | - | Ошибок при отправке |
| created_at | timestamp with time zone | `now()` | YES | - | - | Дата создания рассылки |
| started_at | timestamp with time zone | - | YES | - | - | Дата начала отправки |
| finished_at | timestamp with time zone | - | YES | - | - | Дата завершения отправки |
| media_urls | json | `[]` | YES | - | - | URL медиафайлов для отправки вместе с сообщением |
| buttons | json | `[]` | YES | - | - | Инлайн-кнопки сообщения рассылки |
| buttons_per_row | integer | `0` | YES | - | - | Кол-во кнопок в ряду (0 = все в один ряд) |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[broadcasts.id](./broadcasts.md)** | [broadcast_results.broadcast_id](./broadcast_results.md) | Many to One |
| [bot_projects.id](./bot_projects.md) | **[broadcasts.project_id](./broadcasts.md)** | Many to One |
