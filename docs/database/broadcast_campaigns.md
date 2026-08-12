# broadcast_campaigns

## broadcast_campaigns

Таблица кампаний рассылок — одна запись на «большую рассылку»,  
дочерние записи хранятся в broadcasts с ссылкой campaign_id

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [broadcasts.campaign_id](./broadcasts.md) | - | Уникальный идентификатор кампании |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта-владельца кампании |
| name | text | - | NO | - | - | Название кампании |
| message_text | text | - | NO | - | - | HTML-текст сообщения, общий для всех дочерних рассылок |
| media_urls | json | `[]` | YES | - | - | URL медиафайлов для отправки вместе с сообщением |
| buttons | json | `[]` | YES | - | - | Инлайн-кнопки сообщения кампании |
| buttons_per_row | integer | `0` | YES | - | - | Кол-во кнопок в ряду (0 = все в один ряд) |
| filters | jsonb | `{}` | NO | - | - | Фильтры аудитории в формате JSON (общие для всех ботов) |
| token_ids | jsonb | `[]` | NO | - | - | Идентификаторы выбранных токенов ботов кампании |
| status | text | `'pending'` | NO | - | - | Статус кампании: pending \| running \| stopped \| done \| failed \| partial |
| total_count | integer | `0` | NO | - | - | Всего получателей по всем ботам |
| sent_count | integer | `0` | NO | - | - | Обработано сообщений по всем ботам |
| delivered_count | integer | `0` | NO | - | - | Доставлено успешно по всем ботам |
| failed_count | integer | `0` | NO | - | - | Ошибок при отправке по всем ботам (прочие) |
| blocked_count | integer | `0` | NO | - | - | Заблокировали бота по всем дочерним рассылкам |
| deleted_count | integer | `0` | NO | - | - | Аккаунт удалён / недоступен по всем дочерним рассылкам |
| created_at | timestamp with time zone | `now()` | YES | - | - | Дата создания кампании |
| started_at | timestamp with time zone | - | YES | - | - | Дата начала отправки |
| finished_at | timestamp with time zone | - | YES | - | - | Дата завершения отправки |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[broadcast_campaigns.project_id](./broadcast_campaigns.md)** | Many to One |
| **[broadcast_campaigns.id](./broadcast_campaigns.md)** | [broadcasts.campaign_id](./broadcasts.md) | Many to One |
