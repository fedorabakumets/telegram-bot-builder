# Шаблон: utils.py.jinja2

## Описание

Генерирует Python утилитарные функции для Telegram бота: is_admin, is_private_chat, get_user_variables, check_auth.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Включена ли база данных пользователей |

## Использование

### Базовое

```typescript
import { generateUtils } from './utils-template.renderer';

const code = generateUtils({
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
# Утилитарные функции
from aiogram import types

async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

def get_user_variables(user_id):
    """Получает все переменные пользователя из локального хранилища"""
    return user_data.get(user_id, {})

async def check_auth(user_id: int) -> bool:
    # Проверяем наличие пользователя в БД или локальном хранилище
    if db_pool:
        user = await get_user_from_db(user_id)
        return user is not None
    return user_id in user_data
```

### База данных выключена

**Вход:**
```typescript
{ userDatabaseEnabled: false }
```

**Выход:**
```python
# Утилитарные функции
from aiogram import types

async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

def get_user_variables(user_id):
    """Получает все переменные пользователя из локального хранилища"""
    return user_data.get(user_id, {})

async def check_auth(user_id: int) -> bool:
    return user_id in user_data
```

## Логика условий

### check_auth с БД
```typescript
if (userDatabaseEnabled === true) {
  // Проверка через get_user_from_db
} else {
  // Проверка через user_data
}
```

## Тесты

### Запуск тестов

```bash
npm test -- utils-template.test.ts
```

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./utils-template.params` — типы параметров
- `./utils-template.schema` — Zod схема

## Файлы

```
utils/
├── utils.py.jinja2           # Шаблон (40 строк)
├── utils-template.params.ts  # Типы (12 строк)
├── utils-template.schema.ts  # Zod схема (14 строк)
├── utils-template.renderer.ts# Функция рендеринга (24 строк)
├── utils-template.fixture.ts # Тестовые данные (80 строк)
├── utils-template.test.ts    # Тесты (180 строк)
├── utils-template.md         # Документация
├── get-templates-dir.ts      # Утилита (существующая)
└── index.ts                  # Публичный экспорт
```

## См. также

- [`config.py.jinja2`](../config/config.md)
- [`database.py.jinja2`](../database/database.md)
