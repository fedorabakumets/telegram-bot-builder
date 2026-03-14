# Шаблон: header.py.jinja2

## Описание

Генерирует Python заголовок с UTF-8 кодировкой для кроссплатформенной поддержки (Windows, Linux, macOS).

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Не используется (для совместимости API) |
| `hasInlineButtons` | `boolean` | `false` | Не используется (для совместимости API) |
| `hasMediaNodes` | `boolean` | `false` | Не используется (для совместимости API) |

> **Примечание:** Параметры не влияют на вывод. Шаблон всегда генерирует одинаковый код.

## Использование

### Базовое

```typescript
import { generateHeader } from './header.renderer';

const code = generateHeader({
  userDatabaseEnabled: true,
});
```

## Примеры вывода

### Стандартный заголовок

**Вход:**
```typescript
{ userDatabaseEnabled: true }
```

**Выход:**
```python
# -*- coding: utf-8 -*-
import os
import sys

# Устанавливаем UTF-8 кодировку для вывода
if sys.platform.startswith("win"):
    # Для Windows устанавливаем UTF-8 кодировку
    os.environ["PYTHONIOENCODING"] = "utf-8"
    try:
        import codecs
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, UnicodeError):
        # Fallback для старых версий Python
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())
```

## Логика условий

Шаблон не использует условную логику. Всегда генерирует одинаковый код.

## Тесты

### Запуск тестов

```bash
npm test -- header.test.ts
```

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./header.params` — типы параметров
- `./header.schema` — Zod схема

## Файлы

```
header/
├── header.py.jinja2        # Шаблон (20 строк)
├── header.params.ts        # Типы (16 строк)
├── header.schema.ts        # Zod схема (16 строк)
├── header.renderer.ts      # Функция рендеринга (24 строк)
├── header.fixture.ts       # Тестовые данные (60 строк)
├── header.test.ts          # Тесты (160 строк)
├── header.md               # Документация
└── index.ts                # Публичный экспорт
```

## См. также

- [`config.py.jinja2`](../config/config.md)
- [`imports.py.jinja2`](../imports/imports.md)
