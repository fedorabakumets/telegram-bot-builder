# Трекинг активности для массового кика

## Текущее состояние

Все сообщения уже записываются в таблицу `bot_messages` (хардкорно, на уровне сервера). Таблица содержит `user_id`, `chat_id`, `created_at`, `chat_type` и другие поля.

Это значит что массовый кик по активности **уже возможен** через `psql_query` + `loop` + `kick_user`.

## Примеры SQL-запросов

### Кик неактив за 7 дней
```sql
SELECT DISTINCT user_id FROM bot_messages
WHERE chat_id = {chat_id} AND type = 'user'
GROUP BY user_id
HAVING MAX(created_at) < NOW() - INTERVAL '7 days'
```

### Кик молчунов (0 сообщений за период)
```sql
SELECT u.telegram_id FROM bot_users u
WHERE u.token_id = {token_id}
AND u.telegram_id NOT IN (
  SELECT DISTINCT user_id FROM bot_messages
  WHERE chat_id = {chat_id} AND type = 'user'
  AND created_at > NOW() - INTERVAL '3 days'
)
```
Таблица `bot_users` содержит всех кто взаимодействовал с ботом — это наш "список участников".

### Кик по количеству сообщений (< N за период)
```sql
SELECT user_id, COUNT(*) as cnt FROM bot_messages
WHERE chat_id = {chat_id} AND type = 'user' AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
HAVING COUNT(*) < 5
```

## Что можно улучшить

- [ ] Готовый шаблон сценария "Кик неактив" — пользователь добавляет одной кнопкой, указывает только период
- [ ] UI-виджет "Статистика активности" в панели таблиц — визуализация кто активен, кто нет
- [ ] Агрегированная таблица `chat_activity_summary` (user_id, chat_id, last_message_at, message_count) — обновляется триггером БД, чтобы не делать тяжёлые GROUP BY на лету

## Ограничение

Bot API не даёт полный список участников чата напрямую. Но `bot_users` содержит всех кто хоть раз взаимодействовал с ботом (написал сообщение, нажал кнопку, вызвал /start). Для групп где бот активен — это практически полный список. Те кто был в чате до добавления бота и ни разу не писал — не попадут в `bot_users`.

## Приоритет

Низкий. Функционал уже доступен через ручную сборку на канвасе (psql_query + loop + kick_user). Готовый шаблон — это удобство, не блокер.
