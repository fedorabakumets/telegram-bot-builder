# user_activity_daily

## user_activity_daily

Дневные отметки «этот человек был активен в этот день».  
Ставятся при сохранении входящего сообщения (`message_type = user`):
в Python-боте (`save_message_to_api`) и в Node (`createBotMessage` → `markUserActivityDaily`).  
Удаление из bot_messages / bot_users их не уменьшает.

Миграция `0018_backfill_user_activity_daily.sql` при деплое дозаполняет
дыры из входящих `bot_messages` (`ON CONFLICT DO NOTHING`) — на всех инстансах.

Столбец `first_seen_at` — копия времени первого появления человека у бота  
(из `bot_users.registered_at` или `NOW()`, если профиля ещё нет).  
Нужен, чтобы разделение на новичков и вернувшихся не зависело от судьбы строки в bot_users.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта |
| token_id | integer | `0` | NO | - | - | Идентификатор токена бота (0 — без сегментации) |
| day | date | - | NO | - | - | Календарный день активности |
| user_id | bigint | - | NO | - | - | Идентификатор пользователя в Telegram |
| first_seen_at | timestamptz | - | NO | - | - | Время первого появления у бота (не время действия) |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| pk_project_id_token_id_day_user_id | PRIMARY KEY | (project_id, token_id, day, user_id) |
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[user_activity_daily.project_id](./user_activity_daily.md)** | Many to One |
