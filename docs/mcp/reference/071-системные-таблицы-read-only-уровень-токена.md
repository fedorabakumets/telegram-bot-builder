# Системные таблицы (read-only, уровень токена)

Виртуальные таблицы, отображающие реальные данные бота в UI:

| Таблица | Источник | API |
|---------|----------|-----|
| Пользователи | `bot_users` | `GET /api/projects/:id/users` |
| Переменные | `bot_users.user_data` (JSONB → колонки) | `GET /api/projects/:id/users/variables` |
| Сообщения | `bot_messages` | `GET /api/projects/:id/messages/all` |
| Группы | `bot_groups` | `GET /api/projects/:id/groups` |
| Логи | `bot_logs` | `GET /api/projects/:id/logs/all` |
| Запуски | `bot_launch_history` | `GET /api/projects/:id/launches/all` |
| Рассылки | `broadcasts` | `GET /api/projects/:id/broadcasts` |
| Токены | `bot_tokens` | `GET /api/projects/:id/tokens` |
| Медиафайлы | `media_files` | `GET /api/media/project/:id` |
