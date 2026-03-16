# Шаблон рассылки (broadcast.py.jinja2)

## Описание

Шаблон генерирует Python обработчик для рассылки сообщений пользователям через Telegram бота или клиента.

## Параметры

| Параметр | Тип | Описание | Значение по умолчанию |
|----------|-----|----------|----------------------|
| nodeId | string | Уникальный идентификатор узла | - |
| broadcastApiType | 'bot' \| 'client' | Тип API для рассылки | 'bot' |
| broadcastTargetNode | string | ID узла для получения целевых пользователей | '' |
| enableBroadcast | boolean | Включить ли рассылку | false |
| enableConfirmation | boolean | Требуется ли подтверждение | false |
| confirmationText | string | Текст подтверждения | 'Подтвердите рассылку' |
| successMessage | string | Сообщение об успехе | 'Рассылка выполнена успешно' |
| errorMessage | string | Сообщение об ошибке | 'Произошла ошибка при рассылке' |
| idSourceType | 'user_ids' \| 'bot_users' \| 'both' | Источник ID пользователей | 'bot_users' |
| messageText | string | Текст сообщения для рассылки | '' |

## Примеры использования

### Пример 1: Рассылка через бота всем bot_users

```typescript
generateBroadcast({
  nodeId: 'broadcast_1',
  broadcastApiType: 'bot',
  enableBroadcast: true,
  idSourceType: 'bot_users',
  messageText: 'Привет! Это важная новость.',
});
```

### Пример 2: Рассылка через клиента с подтверждением

```typescript
generateBroadcast({
  nodeId: 'broadcast_2',
  broadcastApiType: 'client',
  enableBroadcast: true,
  enableConfirmation: true,
  confirmationText: 'Вы уверены, что хотите отправить рассылку?',
  idSourceType: 'user_ids',
  messageText: 'Клиентская рассылка',
});
```

### Пример 3: Рассылка всем пользователям (и bot_users и user_ids)

```typescript
generateBroadcast({
  nodeId: 'broadcast_3',
  broadcastApiType: 'bot',
  enableBroadcast: true,
  idSourceType: 'both',
  messageText: 'Рассылка всем пользователям',
});
```

### Пример 4: Отключенная рассылка

```typescript
generateBroadcast({
  nodeId: 'broadcast_4',
  enableBroadcast: false,
});
```

## Примеры вывода

### Вывод 1: Рассылка через бота

```python
@dp.message(Command("broadcast_broadcast_1"))
async def handle_broadcast_broadcast_1(message: types.Message):
    """Обработчик рассылки сообщений для узла broadcast_1"""
    user_id = message.from_user.id

    target_users = []

    if db_pool:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT user_id FROM users WHERE is_bot = TRUE")
            target_users.extend([row['user_id'] for row in rows])

    broadcast_text = "Привет! Это важная новость."
    all_user_vars = await init_all_user_vars(user_id)
    broadcast_text = replace_variables_in_text(broadcast_text, all_user_vars, variable_filters)

    success_count = 0
    error_count = 0

    for target_user_id in target_users:
        try:
            await bot.send_message(target_user_id, broadcast_text)
            success_count += 1
        except Exception as e:
            logging.error(f"Ошибка отправки пользователю {target_user_id}: {e}")
            error_count += 1
        await asyncio.sleep(0.1)

    result_text = f"✅ Рассылка завершена\nУспешно: {success_count}\nОшибок: {error_count}"
    await message.answer(result_text)
```

### Вывод 2: Рассылка отключена

```python
@dp.message(Command("broadcast_broadcast_4"))
async def handle_broadcast_broadcast_4(message: types.Message):
    """Обработчик рассылки (отключен) для узла broadcast_4"""
    await message.answer("Рассылка отключена")
```

## Логика условий

- **enableBroadcast = false**: Генерируется обработчик с сообщением "Рассылка отключена"
- **enableBroadcast = true**: Генерируется полный обработчик рассылки
- **enableConfirmation = true**: Добавляется проверка подтверждения перед рассылкой
- **idSourceType = 'user_ids'**: Получение только user_ids (is_bot = FALSE)
- **idSourceType = 'bot_users'**: Получение только bot_users (is_bot = TRUE)
- **idSourceType = 'both'**: Получение обоих типов пользователей
- **broadcastApiType = 'bot'**: Отправка через bot.send_message()
- **broadcastApiType = 'client'**: Отправка через клиент (требует дополнительной настройки)

## Тесты

Запуск тестов:

```bash
npm test -- broadcast.test.ts
```

Тесты покрывают:
- Валидные данные (8 тестов)
- Невалидные данные (4 теста)
- Граничные случаи (5 тестов)
- Производительность (2 теста)
- Валидация схемы (5 тестов)

## Зависимости

- aiogram (Bot, types.Message, Command)
- asyncpg (для работы с базой данных)
- asyncio (для задержек)
- logging (для логирования ошибок)

## Структура файлов

```
broadcast/
├── broadcast.py.jinja2       (шаблон обработчика)
├── broadcast.params.ts       (типы параметров)
├── broadcast.schema.ts       (Zod схема)
├── broadcast.renderer.ts     (функция рендеринга)
├── broadcast.fixture.ts      (тестовые данные)
├── broadcast.test.ts         (тесты)
├── broadcast.md              (документация)
└── index.ts                  (экспорт)
```
