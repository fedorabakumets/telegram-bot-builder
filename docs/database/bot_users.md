# bot_users

## bot_users

Таблица пользователей бота

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| user_id | bigint | - | NO | - | - | Идентификатор пользователя в Telegram |
| project_id | integer | `0` | NO | - | - | Идентификатор проекта |
| token_id | integer | `0` | NO | - | - | Идентификатор токена бота для сегментации базы |
| username | text | - | YES | - | - | Имя пользователя в Telegram |
| first_name | text | - | YES | - | - | Имя пользователя |
| last_name | text | - | YES | - | - | Фамилия пользователя |
| avatar_url | text | - | YES | - | - | URL аватарки пользователя |
| is_bot | integer | `0` | YES | - | - | Флаг бота: 0 - человек, 1 - бот |
| registered_at | timestamp | `now()` | YES | - | - | Дата регистрации |
| last_interaction | timestamp | `now()` | YES | - | - | Дата последнего взаимодействия |
| interaction_count | integer | `0` | YES | - | - | Количество взаимодействий |
| user_data | jsonb | `{}` | YES | - | - | Пользовательские данные |
| is_active | integer | `1` | YES | - | - | Флаг активности: 0 - неактивен, 1 - активен |
| is_premium | integer | `0` | YES | - | - | Флаг Premium пользователя: 0 - обычный, 1 - premium |
| language_code | text | - | YES | - | - | Код языка пользователя (IETF: ru, en, uk...) |
| deep_link_param | text | - | YES | - | - | Параметр deep link при первом визите |
| referrer_id | text | - | YES | - | - | ID пользователя-реферера |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| pk_user_id_project_id_token_id | PRIMARY KEY | (user_id, project_id, token_id) |
