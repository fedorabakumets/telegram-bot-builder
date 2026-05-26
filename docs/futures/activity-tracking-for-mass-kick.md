# Трекинг активности для массового кика

## Проблема

Telegram Bot API не предоставляет метод для получения списка всех участников чата. Поэтому массовые операции (кик неактив, кик молчунов, кик по количеству сообщений) невозможны "из коробки".

## Решение

Бот сам ведёт учёт активности — записывает каждое сообщение в таблицу через `group_message_trigger` → `bot_table(upsert)`.

### Структура таблицы `chat_activity`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `user_id` | bigint | Telegram ID пользователя |
| `chat_id` | bigint | ID чата |
| `last_message_at` | timestamp | Дата последнего сообщения |
| `message_count` | integer | Количество сообщений |
| `joined_at` | timestamp | Дата первого появления в чате |
| `username` | text | Username (для отображения) |
| `first_name` | text | Имя (для отображения) |

### Сценарии которые это открывает

1. **Кик неактив за период** — `schedule_trigger(раз/сутки)` → `psql_query(SELECT user_id FROM chat_activity WHERE last_message_at < NOW() - INTERVAL '7 days')` → `loop` → `kick_user(custom, {item.user_id})`

2. **Кик молчунов** — `psql_query(SELECT user_id WHERE message_count = 0 AND joined_at < NOW() - INTERVAL '3 days')` → `loop` → `kick_user`

3. **Кик по количеству сообщений** — `psql_query(SELECT user_id WHERE message_count < 5 AND joined_at < NOW() - INTERVAL '7 days')` → `loop` → `kick_user`

4. **Статистика активности** — топ участников, графики, неактивные списки

### Что нужно реализовать

- [ ] Автоматический трекинг: при включении "Трекинг активности" в настройках проекта, `group_message_trigger` автоматически записывает `user_id`, `chat_id`, `timestamp` в системную таблицу
- [ ] UI для просмотра статистики активности в панели "Таблицы"
- [ ] Готовые шаблоны сценариев "Кик неактив" / "Кик молчунов" которые пользователь может добавить одной кнопкой

### Альтернатива

Без автоматического трекинга пользователь может сам собрать цепочку:
- `group_message_trigger` → `bot_table(upsert, table=activity, where user_id={user_id}, set last_message_at=NOW(), increment message_count)`

Но это требует ручной настройки и понимания SQL/таблиц.

## Приоритет

Средний. Базовый кик (по reply, текущего, из переменной) уже работает. Массовый кик — это продвинутый сценарий для больших групп.
