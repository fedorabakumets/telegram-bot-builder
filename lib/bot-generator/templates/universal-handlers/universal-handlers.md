# Шаблон: universal-handlers.py.jinja2

## Описание

Генерирует Python fallback обработчики для необработанных сообщений Telegram бота (текст, фото).

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Не используется (для совместимости API) |

> **Примечание:** Параметры не влияют на вывод. Шаблон всегда генерирует одинаковый код.

## Использование

### Базовое

```typescript
import { generateUniversalHandlers } from './universal-handlers.renderer';

const code = generateUniversalHandlers({
  userDatabaseEnabled: true,
});
```

## Примеры вывода

### Обработчики

**Вход:**
```typescript
{ userDatabaseEnabled: true }
```

**Выход:**
```python
@dp.message(F.text)
async def fallback_text_handler(message: types.Message):
    """
    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.
    """
    logging.info(f"📩 Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")


@dp.message(F.photo)
async def handle_unhandled_photo(message: types.Message):
    """
    Обрабатывает фотографии, которые не были обработаны другими обработчиками.
    """
    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")
```

## Логика условий

Шаблон не использует условную логику. Всегда генерирует одинаковый код.

## Тесты

### Запуск тестов

```bash
npm test -- universal-handlers.test.ts
```

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./universal-handlers.params` — типы параметров
- `./universal-handlers.schema` — Zod схема

## Файлы

```
universal-handlers/
├── universal-handlers.py.jinja2  # Шаблон (20 строк)
├── universal-handlers.params.ts  # Типы (12 строк)
├── universal-handlers.schema.ts  # Zod схема (14 строк)
├── universal-handlers.renderer.ts# Функция рендеринга (24 строк)
├── universal-handlers.fixture.ts # Тестовые данные (40 строк)
├── universal-handlers.test.ts    # Тесты (160 строк)
├── universal-handlers.md         # Документация
└── index.ts                      # Публичный экспорт
```

## См. также

- [`macros/handler.py.jinja2`](../macros/handler.md) — макросы обработчиков
- [`main.py.jinja2`](../main/main.md) — шаблон запуска
