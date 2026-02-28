# 🛡️ Модуль валидации Python кода

> Критически важный модуль для проверки сгенерированного кода бота

## 📋 Назначение

Модуль проверяет сгенерированный Python код на наличие обязательных компонентов и выбрасывает ошибку при отсутствии критических элементов.

## 🚀 Использование

### Базовая валидация

```typescript
import { validateGeneratedPython } from './bot-generator/validation';

const code = generatePythonCode(botData);
const result = validateGeneratedPython(code);

if (!result.isValid) {
  console.error('❌ Ошибки валидации:', result.missingComponents);
  throw new Error(result.errorMessage);
}
```

### Строгая валидация с выбросом ошибки

```typescript
import { assertValidPython } from './bot-generator/validation';

try {
  const code = generatePythonCode(botData);
  assertValidPython(code); // Бросает ошибку или ничего не делает
  console.log('✅ Код валиден');
} catch (error) {
  console.error('❌ Генерация не удалась:', error.message);
}
```

## ✅ Обязательные компоненты

Модуль проверяет наличие следующих компонентов в сгенерированном коде:

| Компонент | Описание |
|-----------|----------|
| `import asyncio` | Импорт asyncio для асинхронной работы |
| `from aiogram import Bot` | Импорт Bot из aiogram |
| `from aiogram import Dispatcher` | Импорт Dispatcher из aiogram |
| `dp = Dispatcher()` | Инициализация диспетчера |
| `async def main():` | Функция main() |
| `if __name__ == "__main__":` | Точка входа |
| `asyncio.run(main())` | Запуск бота |

## 📁 Структура модуля

```
validation/
├── validate-generated-python.ts  # Основная логика валидации
├── index.ts                      # Экспорт модуля
└── README.md                     # Документация
```

## 🔧 API

### validateGeneratedPython(code: string): PythonValidationResult

Проверяет код и возвращает результат валидации.

**Параметры:**
- `code: string` - Сгенерированный Python код

**Возвращает:**
```typescript
interface PythonValidationResult {
  isValid: boolean;           // Код валиден
  missingComponents: string[]; // Список отсутствующих компонентов
  errorMessage?: string;      // Сообщение об ошибке
}
```

### assertValidPython(code: string): void

Выбрасывает ошибку если код не прошёл валидацию.

**Параметры:**
- `code: string` - Сгенерированный Python код

**Бросает:**
- `Error` - Если код невалиден

## 🎯 Примеры

### Успешная валидация

```typescript
const code = `
import asyncio
from aiogram import Bot, Dispatcher

bot = Bot(token="123")
dp = Dispatcher()

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
`;

assertValidPython(code); // ✅ Ничего не происходит
```

### Провал валидации

```typescript
const code = `
# Отсутствуют импорты и точка входа
print("Hello")
`;

const result = validateGeneratedPython(code);
console.log(result.isValid); // false
console.log(result.missingComponents);
// ['import asyncio', 'from aiogram import Bot', ...]
```

## 🐛 Исправленные проблемы

Этот модуль решает критическую проблему, когда генератор создавал неполный Python файл:

- ❌ **До:** Файл начинался с середины кода
- ❌ **До:** Отсутствовали импорты и точка входа
- ❌ **До:** Нет проверки результата генерации
- ✅ **После:** Валидация перед возвратом кода
- ✅ **После:** Явная ошибка при проблемах

## 📝 Changelog

### v1.0.0 (2026-02-28)

- ✨ Создан модуль валидации
- ✨ Добавлена функция `validateGeneratedPython`
- ✨ Добавлена функция `assertValidPython`
- ✨ Интегрировано в `generatePythonCode`

---

<p align="center">
  Made with ❤️ for Telegram Bot Builder
</p>
