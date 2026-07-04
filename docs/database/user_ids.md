# user_ids

## user_ids

Таблица ID пользователей для рассылки (общая база на все проекты)

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор записи |
| user_id | bigint | - | NO | - | - | ID пользователя в Telegram |
| created_at | timestamp | `now()` | YES | - | - | Дата создания записи |
| source | text | `'manual'` | YES | - | - | Источник добавления |
