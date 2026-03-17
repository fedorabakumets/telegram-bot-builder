# Шаблон функции get_user_variables

## Описание

Генерирует Python-функцию `get_user_variables(user_id)`, которая возвращает все переменные пользователя из локального хранилища `user_data`.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `indentLevel` | `string` | Нет | `''` | Базовый отступ генерируемого кода |

## Пример использования

```typescript
import { generateGetUserVariablesFunction } from './user-variables-func.renderer';

// Без отступа (корневой уровень модуля)
const code = generateGetUserVariablesFunction();

// С отступом (внутри класса или другой функции)
const indented = generateGetUserVariablesFunction({ indentLevel: '    ' });
```

**Вывод (без отступа):**

```python
def get_user_variables(user_id):
    """Получает все переменные пользователя из локального хранилища

    Args:
        user_id (int): ID пользователя Telegram

    Returns:
        dict: Словарь с переменными пользователя или пустой словарь если пользователь не найден
    """
    # Возвращаем переменные пользователя из локального хранилища или пустой словарь
    return user_data.get(user_id, {})
```

## Тесты

```bash
npm test -- user-variables-func.test.ts
```

### Покрытие тестов

- Базовая генерация (4 теста)
- Отступы (5 тестов)
- Корректность Python-кода (3 теста)
- Производительность (2 теста)
- Валидация схемы (4 теста)

## Интеграция

Функция используется в генерируемых ботах для получения переменных пользователя:

```python
user_vars = get_user_variables(user_id)
name = user_vars.get("name", "")
```
