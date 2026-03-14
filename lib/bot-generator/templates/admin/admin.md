# Шаблон административных действий (admin.py.jinja2)

## Описание

Шаблон генерирует Python обработчик для административных действий в Telegram чатах. Поддерживает все основные административные действия: закрепление/открепление сообщений, удаление сообщений, бан/разбан, мут/анмут, кик, продвижение/понижение администраторов.

## Параметры

| Параметр | Тип | Описание | Значение по умолчанию |
|----------|-----|----------|----------------------|
| nodeId | string | Уникальный идентификатор узла | - |
| adminActionType | AdminActionType | Тип административного действия | - |
| targetMessageId | string | ID целевого сообщения | '' |
| messageIdSource | 'manual' \| 'variable' \| 'last_message' | Источник ID сообщения | 'last_message' |
| targetUserId | string | ID целевого пользователя | '' |
| userIdSource | 'manual' \| 'variable' \| 'last_message' | Источник ID пользователя | 'last_message' |
| untilDate | number | Дата окончания ограничения (timestamp) | undefined |
| reason | string | Причина действия | '' |
| muteDuration | number | Длительность мута в секундах | undefined |
| adminTargetUserId | string | ID пользователя для продвижения/понижения | '' |
| canManageChat | boolean | Право управления чатом | false |
| canDeleteMessages | boolean | Право удаления сообщений | false |
| canManageVideoChats | boolean | Право управления видеочатами | false |
| canRestrictMembers | boolean | Право ограничения участников | false |
| canPromoteMembers | boolean | Право продвижения участников | false |
| canChangeInfo | boolean | Право изменения информации | false |
| canInviteUsers | boolean | Право приглашения пользователей | false |
| canPinMessages | boolean | Право закрепления сообщений | false |
| canManageTopics | boolean | Право управления темами | false |
| isAnonymous | boolean | Анонимный администратор | false |
| disableNotification | boolean | Отправить без уведомления | false |

## Типы административных действий

```typescript
type AdminActionType =
  | 'pin_message'      // Закрепить сообщение
  | 'unpin_message'    // Открепить сообщение
  | 'delete_message'   // Удалить сообщение
  | 'ban_user'         // Заблокировать пользователя
  | 'unban_user'       // Разблокировать пользователя
  | 'mute_user'        // Заглушить пользователя
  | 'unmute_user'      // Разглушить пользователя
  | 'kick_user'        // Исключить из чата
  | 'promote_user'     // Продвинуть в администраторы
  | 'demote_user'      // Понизить в правах
```

## Примеры использования

### Пример 1: Закрепление сообщения

```typescript
generateAdmin({
  nodeId: 'admin_1',
  adminActionType: 'pin_message',
  targetMessageId: '123',
  messageIdSource: 'manual',
  disableNotification: true,
});
```

### Пример 2: Бан пользователя с датой окончания

```typescript
generateAdmin({
  nodeId: 'admin_2',
  adminActionType: 'ban_user',
  targetUserId: '456',
  userIdSource: 'manual',
  untilDate: 1735689600, // timestamp
  reason: 'Нарушение правил',
});
```

### Пример 3: Мут пользователя на 1 час

```typescript
generateAdmin({
  nodeId: 'admin_3',
  adminActionType: 'mute_user',
  targetUserId: '789',
  userIdSource: 'last_message',
  muteDuration: 3600, // 1 час в секундах
});
```

### Пример 4: Продвижение пользователя с правами

```typescript
generateAdmin({
  nodeId: 'admin_4',
  adminActionType: 'promote_user',
  adminTargetUserId: '111',
  userIdSource: 'last_message',
  canManageChat: true,
  canDeleteMessages: true,
  canRestrictMembers: true,
  canInviteUsers: true,
  canPinMessages: true,
});
```

### Пример 5: Удаление сообщения

```typescript
generateAdmin({
  nodeId: 'admin_5',
  adminActionType: 'delete_message',
  targetMessageId: '999',
  messageIdSource: 'manual',
});
```

## Примеры вывода

### Вывод 1: Закрепление сообщения

```python
@dp.message(Command("admin_pin_message_admin_1"))
async def handle_admin_pin_message_admin_1(message: types.Message):
    """Обработчик административного действия pin_message для узла admin_1"""
    user_id = message.from_user.id

    # Проверка прав администратора
    chat_member = await bot.get_chat_member(chat_id=message.chat.id, user_id=user_id)
    if chat_member.status not in ['creator', 'administrator']:
        await message.answer("❌ Требуется права администратора")
        return

    # Действия с сообщениями
    target_message_id = 123

    try:
        await bot.pin_chat_message(
            chat_id=message.chat.id,
            message_id=target_message_id,
            disable_notification=True
        )
        await message.answer(f"✅ Сообщение закреплено (ID: {target_message_id})")
    except Exception as e:
        logging.error(f"Ошибка закрепления сообщения: {e}")
        await message.answer("❌ Ошибка при закреплении сообщения")
```

### Вывод 2: Бан пользователя

```python
@dp.message(Command("admin_ban_user_admin_2"))
async def handle_admin_ban_user_admin_2(message: types.Message):
    """Обработчик административного действия ban_user для узла admin_2"""
    user_id = message.from_user.id

    # Проверка прав администратора
    chat_member = await bot.get_chat_member(chat_id=message.chat.id, user_id=user_id)
    if chat_member.status not in ['creator', 'administrator']:
        await message.answer("❌ Требуется права администратора")
        return

    # Действия с пользователями
    target_user_id = 456

    if target_user_id == 0:
        await message.answer("❌ Не указан целевой пользователь")
        return

    try:
        until_date = 1735689600
        await bot.ban_chat_member(
            chat_id=message.chat.id,
            user_id=target_user_id,
            until_date=until_date
        )
        await message.answer(f"✅ Пользователь заблокирован до {until_date}")
    except Exception as e:
        logging.error(f"Ошибка блокировки пользователя: {e}")
        await message.answer("❌ Ошибка при блокировке пользователя")
```

### Вывод 3: Продвижение пользователя

```python
@dp.message(Command("admin_promote_user_admin_4"))
async def handle_admin_promote_user_admin_4(message: types.Message):
    """Обработчик административного действия promote_user для узла admin_4"""
    user_id = message.from_user.id

    # Проверка прав администратора
    chat_member = await bot.get_chat_member(chat_id=message.chat.id, user_id=user_id)
    if chat_member.status not in ['creator', 'administrator']:
        await message.answer("❌ Требуется права администратора")
        return

    admin_target_user_id = 111

    try:
        await bot.promote_chat_member(
            chat_id=message.chat.id,
            user_id=admin_target_user_id,
            can_manage_chat=True,
            can_delete_messages=True,
            can_restrict_members=True,
            can_invite_users=True,
            can_pin_messages=True
        )
        await message.answer(f"✅ Пользователь повышен в правах")
    except Exception as e:
        logging.error(f"Ошибка продвижения пользователя: {e}")
        await message.answer("❌ Ошибка при продвижении пользователя")
```

## Логика условий

### Источники ID сообщений
- **manual**: Используется явно указанный targetMessageId
- **variable**: Берётся из user_data[user_id]["target_message_id"]
- **last_message**: Используется message.message_id (последнее сообщение)

### Источники ID пользователей
- **manual**: Используется явно указанный targetUserId
- **variable**: Берётся из user_data[user_id]["target_user_id"]
- **last_message**: Берётся из reply_to_message.from_user.id

### Права администратора
Все права по умолчанию false. При promote_user устанавливаются указанные права.

## Тесты

Запуск тестов:

```bash
npm test -- admin.test.ts
```

Тесты покрывают:
- Валидные данные (8 тестов)
- Невалидные данные (4 теста)
- Граничные случаи (6 тестов)
- Производительность (2 теста)
- Валидация схемы (5 тестов)

## Зависимости

- aiogram (Bot, types.Message, types.ChatPermissions, Command)
- datetime (для расчёта until_date при mute)
- logging (для логирования ошибок)

## Структура файлов

```
admin/
├── admin.py.jinja2       (шаблон обработчика)
├── admin.params.ts       (типы параметров)
├── admin.schema.ts       (Zod схема)
├── admin.renderer.ts     (функция рендеринга)
├── admin.fixture.ts      (тестовые данные)
├── admin.test.ts         (тесты)
├── admin.md              (документация)
└── index.ts              (экспорт)
```
