# Шаблон: middleware.py.jinja2

## Описание

Генерирует Python middleware для логирования сообщений Telegram бота.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Не используется (для совместимости API) |

> **Примечание:** Параметры не влияют на вывод. Шаблон всегда генерирует одинаковый код.

## Использование

### Базовое

```typescript
import { generateMiddleware } from './middleware.renderer';

const code = generateMiddleware({
  userDatabaseEnabled: true,
});
```

## Примеры вывода

### Middleware

**Вход:**
```typescript
{ userDatabaseEnabled: true }
```

**Выход:**
```python
async def message_logging_middleware(handler, event: types.Message, data: dict):
    """Middleware для автоматического сохранения входящих сообщений"""
    try:
        user_id = str(event.from_user.id)
        message_text = event.text or event.caption or "[медиа]"

        await save_message_to_api(
            user_id=user_id,
            message_type="user",
            message_text=message_text,
        )
    except Exception as e:
        logging.error(f"Ошибка в middleware сохранения сообщений: {e}")

    return await handler(event, data)
```

## Логика условий

Шаблон не использует условную логику. Всегда генерирует одинаковый код.

## Тесты

### Запуск тестов

```bash
npm test -- middleware.test.ts
```

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./middleware.params` — типы параметров
- `./middleware.schema` — Zod схема

## Файлы

```
middleware/
├── middleware.py.jinja2    # Шаблон (15 строк)
├── middleware.params.ts    # Типы (12 строк)
├── middleware.schema.ts    # Zod схема (14 строк)
├── middleware.renderer.ts  # Функция рендеринга (24 строк)
├── middleware.fixture.ts   # Тестовые данные (40 строк)
├── middleware.test.ts      # Тесты (160 строк)
├── middleware.md           # Документация
└── index.ts                # Публичный экспорт
```

## См. также

- [`main.py.jinja2`](../main/main.md)
- [`utils.py.jinja2`](../utils/utils.md)
