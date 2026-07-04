# user_telegram_settings

## user_telegram_settings

Таблица пользовательских настроек для Telegram Client API

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор настроек |
| user_id | text | - | NO | - | - | Уникальный ID пользователя (например, email или внутренний ID) |
| api_id | text | - | YES | - | - | Telegram API ID |
| api_hash | text | - | YES | - | - | Telegram API Hash |
| phone_number | text | - | YES | - | - | Номер телефона для авторизации |
| session_string | text | - | YES | - | - | Сохраненная сессия |
| is_active | integer | `1` | YES | - | - | Флаг активности (0 = неактивен, 1 = активен) |
| created_at | timestamp | `now()` | YES | - | - | Дата создания настроек |
| updated_at | timestamp | `now()` | YES | - | - | Дата последнего обновления настроек |
