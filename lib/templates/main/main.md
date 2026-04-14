# Шаблон: main.py.jinja2

## Описание

Генерирует Python функцию main() для запуска Telegram бота: инициализация БД, настройка команд, middleware, polling.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Включена ли база данных пользователей |

## Особенности

### Distributed lock (Redis)
Если `REDIS_URL` задан — при старте бот ставит Redis lock `bot:lock:{последние 10 символов токена}` с TTL 60 секунд. Если lock уже занят — бот завершается (защита от двойного запуска). Фоновая задача `_refresh_lock` обновляет TTL каждые 30 секунд. При завершении lock удаляется.

### Stale update filter
Middleware `stale_update_filter_middleware` регистрируется первым — отсеивает апдейты старше `MAX_UPDATE_AGE_SECONDS` секунд (по умолчанию 300).

## Использование

### Базовое

```typescript
import { generateMain } from './main.renderer';

const code = generateMain({
  userDatabaseEnabled: true,
});
```

## Примеры вывода

### База данных включена

**Вход:**
```typescript
{ userDatabaseEnabled: true }
```

**Выход:**
```python
async def set_bot_commands():
    """Настройка меню команд для BotFather"""
    commands = [
        BotCommand(command="start", description="Запустить бота"),
    ]
    await bot.set_my_commands(commands)

async def main():
    """Главная функция запуска бота"""
    global db_pool

    def signal_handler(signum, frame):
        print(f"⚠️ Получен сигнал {signum}, начинаем корректное завершение...")
        import sys
        sys.exit(0)

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    try:
        await init_database()
        await set_bot_commands()
        dp.message.middleware(message_logging_middleware)
        print("🚀 Бот запущен и готов к работе!")
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        print("⚠️ Получен сигнал остановки, завершаем работу...")
    except SystemExit:
        print("⚠️ Системное завершение, завершаем работу...")
    except Exception as e:
        logging.error(f"Ошибка: {e}")
    finally:
        if db_pool:
            await db_pool.close()
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
```

### База данных выключена

**Вход:**
```typescript
{ userDatabaseEnabled: false }
```

**Выход:**
```python
async def set_bot_commands():
    """Настройка меню команд для BotFather"""
    commands = [BotCommand(command="start", description="Запустить бота")]
    await bot.set_my_commands(commands)

async def main():
    """Главная функция запуска бота"""
    # ... обработка сигналов ...
    try:
        await set_bot_commands()
        print("🚀 Бот запущен и готов к работе!")
        await dp.start_polling(bot)
    # ... обработка ошибок ...
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
```

## Логика условий

### init_database()
```typescript
if (userDatabaseEnabled === true) {
  // Вызвать init_database()
}
```

### middleware
```typescript
if (userDatabaseEnabled === true) {
  // Добавить dp.message.middleware(message_logging_middleware)
}
```

### db_pool.close()
```typescript
if (userDatabaseEnabled === true) {
  // Закрыть пул соединений
}
```

## Тесты

### Запуск тестов

```bash
npm test -- main.test.ts
```

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./main.params` — типы параметров
- `./main.schema` — Zod схема

## Файлы

```
main/
├── main.py.jinja2        # Шаблон (50 строк)
├── main.params.ts        # Типы (12 строк)
├── main.schema.ts        # Zod схема (14 строк)
├── main.renderer.ts      # Функция рендеринга (24 строк)
├── main.fixture.ts       # Тестовые данные (90 строк)
├── main.test.ts          # Тесты (180 строк)
├── main.md               # Документация
└── index.ts              # Публичный экспорт
```

## См. также

- [`config.py.jinja2`](../config/config.md)
- [`database.py.jinja2`](../database/database.md)
