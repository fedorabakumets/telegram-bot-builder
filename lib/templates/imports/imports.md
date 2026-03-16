# Шаблон: imports.py.jinja2

## Описание

Генерирует Python импорты для Telegram бота на основе параметров. Использует условные импорты для опциональных зависимостей (asyncpg, aiohttp, TelegramBadRequest).

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Включена ли база данных (asyncpg, json) |
| `hasInlineButtons` | `boolean` | `false` | Есть ли inline кнопки (TelegramBadRequest) |
| `hasAutoTransitions` | `boolean` | `false` | Есть ли автопереходы (TelegramBadRequest) |
| `hasMediaNodes` | `boolean` | `false` | Есть ли медиа узлы (aiohttp) |
| `hasUploadImages` | `boolean` | `false` | Есть ли /uploads/ ссылки (aiohttp) |

## Использование

### Базовое

```typescript
import { generateImports } from './imports.renderer';

const code = generateImports({
  userDatabaseEnabled: true,
  hasInlineButtons: false,
  hasMediaNodes: true,
});
```

### С валидацией

```typescript
import { generateImports, importsParamsSchema } from './imports.renderer';

try {
  const validated = importsParamsSchema.parse(params);
  const code = generateImports(validated);
} catch (error) {
  console.error('Невалидные параметры:', error);
}
```

### С fixtures (тесты)

```typescript
import { generateImports } from './imports.renderer';
import { validParamsAllEnabled } from './imports.fixture';

const code = generateImports(validParamsAllEnabled);
```

## Примеры вывода

### Все включено

**Вход:**
```typescript
{
  userDatabaseEnabled: true,
  hasInlineButtons: true,
  hasAutoTransitions: true,
  hasMediaNodes: true,
  hasUploadImages: true
}
```

**Выход:**
```python
import asyncio
import logging
import signal
from datetime import datetime

from aiogram import Bot, Dispatcher, types, F
from aiogram.types import (
    KeyboardButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    BotCommand,
    ReplyKeyboardRemove,
    FSInputFile
)
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from typing import Optional

from dotenv import load_dotenv
from aiogram.filters import CommandStart

import asyncpg
import json

from aiogram.exceptions import TelegramBadRequest

import aiohttp
from aiohttp import TCPConnector

import re
```

### Всё выключено

**Вход:**
```typescript
{
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false
}
```

**Выход:**
```python
import asyncio
import logging
import signal
from datetime import datetime

from aiogram import Bot, Dispatcher, types, F
from aiogram.types import (
    KeyboardButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    BotCommand,
    ReplyKeyboardRemove,
    FSInputFile
)
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from typing import Optional

from dotenv import load_dotenv
from aiogram.filters import CommandStart

import re
```

### Только база данных

**Вход:**
```typescript
{
  userDatabaseEnabled: true,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false
}
```

**Выход:**
```python
# ... базовые импорты ...

import asyncpg
import json

import re
```

### Только медиа

**Вход:**
```typescript
{
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: true,
  hasUploadImages: true
}
```

**Выход:**
```python
# ... базовые импорты ...

import aiohttp
from aiohttp import TCPConnector

import re
```

## Логика условий

### asyncpg + json
```typescript
if (userDatabaseEnabled === true)
```

### TelegramBadRequest
```typescript
if (hasInlineButtons === true || hasAutoTransitions === true)
```

### aiohttp + TCPConnector
```typescript
if (hasMediaNodes === true || hasUploadImages === true)
```

## Тесты

### Запуск тестов

```bash
npm test -- imports.test.ts
```

### Покрытие тестов

- ✅ Валидные данные (все включено/выключено)
- ✅ Частичные конфигурации (только БД, только медиа)
- ✅ Невалидные данные (неправильные типы)
- ✅ Значения по умолчанию
- ✅ Граничные случаи (OR условия)
- ✅ Производительность (< 10ms на генерацию)
- ✅ Структура Zod схемы

### Пример теста

```typescript
import { generateImports } from './imports.renderer';
import { validParamsAllEnabled } from './imports.fixture';

it('должен генерировать код со всеми импортами', () => {
  const result = generateImports(validParamsAllEnabled);
  
  assert.ok(result.includes('import asyncpg'));
  assert.ok(result.includes('import aiohttp'));
});
```

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./imports.params` — типы параметров
- `./imports.schema` — Zod схема
- `./imports.fixture` — тестовые данные

## Файлы

```
imports/
├── imports.py.jinja2       # Шаблон (50 строк)
├── imports.params.ts       # Типы (18 строк)
├── imports.schema.ts       # Zod схема (18 строк)
├── imports.renderer.ts     # Функция рендеринга (30 строк)
├── imports.fixture.ts      # Тестовые данные (120 строк)
├── imports.test.ts         # Тесты (250 строк)
├── imports.md              # Документация (этот файл)
└── index.ts                # Публичный экспорт
```

## Миграция

### До (старый подход)

```typescript
// partials/imports.py.jinja2 в корне templates/
// Разрозненные тесты в schemas.test.ts
// Нет документации использования
```

### После (новый подход)

```typescript
// imports/ папка со всеми файлами
// Полное покрытие тестами
// Документация с примерами
```

## См. также

- [`config.py.jinja2`](../config/config.md) — шаблон конфигурации
- [`database.py.jinja2`](../database/database.md) — шаблон БД
- [`macros/handler.py.jinja2`](../macros/handler.md) — макросы обработчиков
