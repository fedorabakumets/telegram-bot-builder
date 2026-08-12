# broadcast_results

## broadcast_results

Таблица результатов рассылки — по одной записи на каждого получателя

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор результата |
| broadcast_id | integer | - | NO | - | [broadcasts.id](./broadcasts.md) | Идентификатор рассылки |
| user_id | text | - | NO | - | - | Telegram user_id получателя |
| status | text | - | NO | - | - | Статус отправки: sent \| failed \| blocked \| not_found |
| error_message | text | - | YES | - | - | Описание ошибки от Telegram (если есть) |
| telegram_message_id | integer | - | YES | - | - | ID сообщения в Telegram (для удаления/редактирования) |
| sent_at | timestamp with time zone | `now()` | YES | - | - | Дата отправки |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_broadcast_id_broadcasts | FOREIGN KEY | (broadcast_id) → broadcasts(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [broadcasts.id](./broadcasts.md) | **[broadcast_results.broadcast_id](./broadcast_results.md)** | Many to One |
