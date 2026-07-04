# bot_templates

## bot_templates

Таблица сценариев ботов

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор сценария |
| owner_id | bigint | - | YES | - | [telegram_users.id](./telegram_users.md) | Идентификатор владельца сценария (null для официальных сценариев) |
| name | text | - | NO | - | - | Название сценария |
| description | text | - | YES | - | - | Описание сценария |
| data | jsonb | - | NO | - | - | JSON-данные сценария (структура узлов, соединений и т.д.) |
| category | text | `'custom'` | YES | - | - | Категория сценария |
| tags | text[] | - | YES | - | - | Теги сценария |
| is_public | integer | `0` | YES | - | - | Флаг публичности (0 = приватный, 1 = публичный) |
| difficulty | text | `'easy'` | YES | - | - | Уровень сложности ("easy", "medium", "hard") |
| author_id | text | - | YES | - | - | Идентификатор автора сценария (устаревшее, использовать ownerId) |
| author_name | text | - | YES | - | - | Имя автора сценария |
| use_count | integer | `0` | NO | - | - | Количество использований сценария |
| rating | integer | `0` | NO | - | - | Рейтинг сценария (от 1 до 5) |
| rating_count | integer | `0` | NO | - | - | Количество оценок сценария |
| featured | integer | `0` | NO | - | - | Флаг рекомендуемости (0 = не рекомендуемый, 1 = рекомендуемый) |
| version | text | `'1.0.0'` | YES | - | - | Версия сценария |
| preview_image | text | - | YES | - | - | URL изображения для предварительного просмотра |
| last_used_at | timestamp | - | YES | - | - | Время последнего использования сценария |
| download_count | integer | `0` | NO | - | - | Количество скачиваний сценария |
| like_count | integer | `0` | NO | - | - | Количество лайков сценария |
| bookmark_count | integer | `0` | NO | - | - | Количество закладок сценария |
| view_count | integer | `0` | NO | - | - | Количество просмотров сценария |
| language | text | `'ru'` | YES | - | - | Язык сценария |
| requires_token | integer | `0` | NO | - | - | Флаг требования токена (0 = не требуется, 1 = требуется) |
| complexity | integer | `1` | NO | - | - | Сложность сценария (от 1 до 10) |
| estimated_time | integer | `5` | NO | - | - | Примерное время настройки в минутах |
| created_at | timestamp | `now()` | YES | - | - | Дата создания сценария |
| updated_at | timestamp | `now()` | YES | - | - | Дата последнего обновления сценария |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_owner_id_telegram_users | FOREIGN KEY | (owner_id) → telegram_users(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [telegram_users.id](./telegram_users.md) | **[bot_templates.owner_id](./bot_templates.md)** | Many to One |
