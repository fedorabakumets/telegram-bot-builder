# promote_user — Назначить администратора

В `promoteChatMember` попадают только те новые права, которые уже есть в данных блока. Не добавляй их молча.

| Поле | Тип | Описание |
|------|-----|----------|
| `canManageChat` | boolean | Управление чатом, только если задано |
| `canPostMessages` | boolean | Публикация сообщений, только если задано |
| `canEditMessages` | boolean | Редактирование сообщений, только если задано |
| `canManageDirectMessages` | boolean | Личные сообщения, только если задано |
| `canManageTags` | boolean | Теги, только если задано |
| `canSendWelcomeMessages` | boolean | Приветствия, только если задано |
