# Templates Module

Модуль Templates предоставляет систему шаблонов для генерации Python-кода Telegram ботов. Шаблоны обеспечивают консистентность, переиспользование и легкую модификацию генерируемого кода.

## Архитектура

Система шаблонов построена на принципах:

- **Переиспользование**: Общие паттерны кода выделены в шаблоны
- **Кэширование**: Шаблоны кэшируются для повышения производительности
- **Кастомизация**: Возможность переопределения шаблонов
- **Типизация**: Строгая типизация всех шаблонов и параметров

## Компоненты

### PythonTemplates
Основной класс, содержащий все шаблоны Python-кода для генерации ботов.

**Категории шаблонов:**
- **Базовые шаблоны**: Кодировка, импорты, инициализация
- **Структурные шаблоны**: Функции, классы, декораторы
- **Обработчики**: Шаблоны для различных типов обработчиков
- **Утилиты**: Вспомогательные функции и middleware

```typescript
interface IPythonTemplates {
  // Базовые шаблоны
  getEncodingTemplate(): string;
  getImportsTemplate(): string;
  getBotInitTemplate(): string;
  
  // Структурные шаблоны
  getFunctionTemplate(name: string, params: string[], body: string): string;
  getClassTemplate(name: string, methods: string[]): string;
  getDecoratorTemplate(decorator: string, target: string): string;
  
  // Обработчики
  getHandlerTemplate(handlerType: HandlerType): string;
  getCallbackHandlerTemplate(): string;
  getMessageHandlerTemplate(): string;
  
  // Утилиты
  getUtilityFunctionTemplate(functionName: string): string;
  getMiddlewareTemplate(middlewareName: string): string;
}
```

### BotStructureTemplate
Специализированные шаблоны для структуры бота.

**Возможности:**
- Шаблоны основных функций бота
- Структура main() функции
- Шаблоны для различных типов ботов
- Конфигурационные шаблоны

```typescript
interface IBotStructureTemplate {
  getMainFunctionTemplate(): string;
  getBotConfigTemplate(): string;
  getStartupSequenceTemplate(): string;
  getShutdownSequenceTemplate(): string;
}
```

## Типы шаблонов

### Базовые шаблоны

#### Кодировка UTF-8
```python
# -*- coding: utf-8 -*-
```

#### Импорты
```python
import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
```

#### Инициализация бота
```python
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
```

### Шаблоны обработчиков

#### Обработчик сообщений
```python
@dp.message(Command("{command}"))
async def {handler_name}(message: types.Message):
    {handler_body}
```

#### Callback обработчик
```python
@dp.callback_query(lambda c: c.data == "{callback_data}")
async def {handler_name}(callback_query: types.CallbackQuery):
    {handler_body}
```

### Шаблоны утилит

#### Safe edit or send
```python
async def safe_edit_or_send(message, text, reply_markup=None):
    try:
        await message.edit_text(text, reply_markup=reply_markup)
    except:
        await message.answer(text, reply_markup=reply_markup)
```

## Использование

### Базовое использование
```typescript
import { PythonTemplates } from '@/lib/Templates';

const templates = new PythonTemplates();

// Получение базовых шаблонов
const encoding = templates.getEncodingTemplate();
const imports = templates.getImportsTemplate();
const botInit = templates.getBotInitTemplate();

// Генерация функции
const handlerCode = templates.getFunctionTemplate(
  'start_handler',
  ['message: types.Message'],
  'await message.answer("Привет!")'
);
```

### Кастомизация шаблонов
```typescript
import { PythonTemplates } from '@/lib/Templates';

class CustomPythonTemplates extends PythonTemplates {
  getImportsTemplate(): string {
    const baseImports = super.getImportsTemplate();
    return baseImports + '\nimport my_custom_module';
  }
  
  getBotInitTemplate(): string {
    return `
bot = Bot(token=BOT_TOKEN, parse_mode='HTML')
dp = Dispatcher()
`;
  }
}

const customTemplates = new CustomPythonTemplates();
```

### Использование с параметрами
```typescript
const templates = new PythonTemplates();

// Шаблон с параметрами
const handlerTemplate = templates.getHandlerTemplate('message');
const finalCode = handlerTemplate
  .replace('{command}', 'start')
  .replace('{handler_name}', 'start_handler')
  .replace('{handler_body}', 'await message.answer("Hello!")');
```

## Кэширование

Система автоматически кэширует часто используемые шаблоны:

```typescript
import { TemplateCache } from '@/lib/Templates';

// Включение кэширования (по умолчанию включено)
TemplateCache.enable();

// Очистка кэша
TemplateCache.clear();

// Получение статистики кэша
const stats = TemplateCache.getStats();
console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`);
```

## Валидация шаблонов

Все шаблоны проходят валидацию на корректность:

```typescript
import { validateTemplate } from '@/lib/Templates';

const template = templates.getFunctionTemplate('test', [], 'pass');
const isValid = validateTemplate(template, 'python');

if (!isValid) {
  throw new Error('Invalid Python template');
}
```

## Тестирование

### Unit тесты
```typescript
describe('PythonTemplates', () => {
  let templates: PythonTemplates;
  
  beforeEach(() => {
    templates = new PythonTemplates();
  });
  
  it('should generate valid encoding template', () => {
    const encoding = templates.getEncodingTemplate();
    expect(encoding).toBe('# -*- coding: utf-8 -*-');
  });
  
  it('should generate function template with parameters', () => {
    const func = templates.getFunctionTemplate(
      'test_func',
      ['param1: str', 'param2: int'],
      'return param1 + str(param2)'
    );
    
    expect(func).toContain('def test_func(param1: str, param2: int):');
    expect(func).toContain('return param1 + str(param2)');
  });
});
```

### Snapshot тесты
```typescript
describe('Template Snapshots', () => {
  it('should match bot structure snapshot', () => {
    const templates = new BotStructureTemplate();
    const mainFunction = templates.getMainFunctionTemplate();
    
    expect(mainFunction).toMatchSnapshot();
  });
});
```

## Производительность

### Оптимизации
- **Ленивая загрузка**: Шаблоны загружаются только при использовании
- **Кэширование**: Результаты кэшируются в памяти
- **Предкомпиляция**: Часто используемые шаблоны предкомпилируются
- **Пулинг строк**: Переиспользование строковых литералов

### Метрики производительности
```typescript
import { TemplatePerformance } from '@/lib/Templates';

// Измерение времени генерации
const startTime = performance.now();
const template = templates.getComplexTemplate();
const endTime = performance.now();

TemplatePerformance.recordGeneration('complex_template', endTime - startTime);

// Получение статистики
const stats = TemplatePerformance.getStats();
console.log(`Average generation time: ${stats.averageTime}ms`);
```

## Расширение

### Добавление нового шаблона

1. Добавьте метод в интерфейс:
```typescript
interface IPythonTemplates {
  getMyCustomTemplate(param: string): string;
}
```

2. Реализуйте в классе:
```typescript
class PythonTemplates implements IPythonTemplates {
  getMyCustomTemplate(param: string): string {
    return `
# Custom template with ${param}
def custom_function():
    pass
`;
  }
}
```

3. Добавьте тесты:
```typescript
it('should generate custom template', () => {
  const template = templates.getMyCustomTemplate('test');
  expect(template).toContain('Custom template with test');
});
```

### Создание специализированного набора шаблонов

```typescript
class WebhookBotTemplates extends PythonTemplates {
  getBotInitTemplate(): string {
    return `
from aiohttp import web
app = web.Application()
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
`;
  }
  
  getWebhookSetupTemplate(): string {
    return `
async def set_webhook():
    await bot.set_webhook(WEBHOOK_URL)
`;
  }
}
```

## Интернационализация

Поддержка многоязычных шаблонов:

```typescript
import { LocalizedTemplates } from '@/lib/Templates';

const templates = new LocalizedTemplates('ru');
const greeting = templates.getGreetingTemplate(); // "Привет!"

const enTemplates = new LocalizedTemplates('en');
const enGreeting = enTemplates.getGreetingTemplate(); // "Hello!"
```

## Отладка

### Режим отладки
```typescript
import { enableTemplateDebug } from '@/lib/Templates';

// Включить отладочный режим
enableTemplateDebug(true);

// Теперь все шаблоны будут содержать отладочную информацию
const template = templates.getFunctionTemplate('test', [], 'pass');
// Содержит комментарии с информацией о генерации
```

### Валидация в runtime
```typescript
import { enableRuntimeValidation } from '@/lib/Templates';

enableRuntimeValidation(true);

// Все шаблоны будут валидироваться при генерации
const template = templates.getHandlerTemplate('invalid_type'); // Throws error
```

## См. также

- [Core Module](../Core/README.md) - Основная архитектура
- [Generators Module](../Generators/README.md) - Генераторы кода
- [Design Document](../../../../.kiro/specs/bot-generator-refactoring/design.md) - Архитектурные решения
- [Python Template Reference](./TEMPLATE_REFERENCE.md) - Справочник по шаблонам