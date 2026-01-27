# Migration Guide: Bot Generator Refactoring

Этот документ описывает миграцию с монолитной архитектуры bot-generator.ts на новую модульную систему.

## Обзор изменений

### Что изменилось

**До рефакторинга:**
- Монолитный файл `bot-generator.ts` (7267 строк)
- Функция `generatePythonCode` содержала всю логику генерации
- Сложно тестировать отдельные части
- Трудно расширять функциональность

**После рефакторинга:**
- Модульная архитектура с четким разделением ответственности
- Основной файл `bot-generator.ts` (<500 строк)
- Новые модули: Core, Generators, Templates
- Полная обратная совместимость

### Новая структура

```
client/src/lib/
├── Core/                     # Основная архитектура
│   ├── CodeGenerator.ts      # Главный оркестратор
│   ├── GenerationContext.ts  # Контекст генерации
│   ├── types.ts             # Интерфейсы и типы
│   └── index.ts
├── Generators/              # Специализированные генераторы
│   ├── ImportsGenerator.ts   # Генерация импортов
│   ├── PythonCodeGenerator.ts # Базовая структура Python
│   ├── HandlerGenerator.ts   # Обработчики событий
│   ├── MainLoopGenerator.ts  # Основной цикл бота
│   └── index.ts
├── Templates/               # Система шаблонов
│   ├── PythonTemplates.ts    # Python шаблоны
│   ├── BotStructureTemplate.ts # Структура бота
│   └── index.ts
└── bot-generator.ts         # Обновленный главный файл
```

## Обратная совместимость

### ✅ Что остается без изменений

1. **Публичный API**: Функция `generatePythonCode` сохраняет ту же сигнатуру
2. **Импорты**: Все существующие импорты продолжают работать
3. **Результат генерации**: Генерируемый Python код идентичен
4. **Конфигурация**: Все параметры и настройки остаются теми же

### Примеры совместимости

```typescript
// ✅ Это продолжает работать без изменений
import { generatePythonCode } from '@/lib/bot-generator';

const pythonCode = generatePythonCode(
  botData,
  botName,
  groups,
  userDatabaseEnabled,
  projectId,
  enableLogging
);
```

```typescript
// ✅ Существующие импорты работают
import { 
  generatePythonCode,
  // Все остальные экспорты остаются доступными
} from '@/lib';
```

## Новые возможности

### 1. Модульное использование

Теперь можно использовать отдельные генераторы:

```typescript
import { ImportsGenerator, GenerationContext } from '@/lib/Core';

const importsGenerator = new ImportsGenerator();
const context = GenerationContext.create({
  botData,
  botName,
  groups,
  userDatabaseEnabled,
  projectId,
  enableLogging
});

const imports = importsGenerator.generateImports(context);
```

### 2. Кастомизация генераторов

```typescript
import { HandlerGenerator } from '@/lib/Generators';

class CustomHandlerGenerator extends HandlerGenerator {
  generateMessageHandlers(context: GenerationContext): string {
    const baseHandlers = super.generateMessageHandlers(context);
    return baseHandlers + this.addCustomLogic(context);
  }
}
```

### 3. Использование шаблонов

```typescript
import { PythonTemplates } from '@/lib/Templates';

const templates = new PythonTemplates();
const functionCode = templates.getFunctionTemplate(
  'my_handler',
  ['message: types.Message'],
  'await message.answer("Hello!")'
);
```

## Пошаговая миграция

### Этап 1: Обновление зависимостей (Рекомендуется)

Если вы хотите использовать новые возможности:

```typescript
// Старый способ (продолжает работать)
import { generatePythonCode } from '@/lib/bot-generator';

// Новый способ (рекомендуется для новых проектов)
import { CodeGenerator, GenerationContext } from '@/lib/Core';
import { createAllGenerators } from '@/lib/Generators';
```

### Этап 2: Постепенное внедрение новых модулей

```typescript
// 1. Создайте контекст генерации
const context = GenerationContext.create({
  botData,
  botName,
  groups,
  userDatabaseEnabled,
  projectId,
  enableLogging
});

// 2. Используйте отдельные генераторы по необходимости
const { importsGenerator } = createAllGenerators();
const imports = importsGenerator.generateImports(context);

// 3. Или используйте полный CodeGenerator
const generators = createAllGenerators();
const codeGenerator = new CodeGenerator(...Object.values(generators));
const result = codeGenerator.generate(context);
```

### Этап 3: Кастомизация (Опционально)

```typescript
// Создайте кастомные генераторы для специфических нужд
class MyProjectHandlerGenerator extends HandlerGenerator {
  generateMessageHandlers(context: GenerationContext): string {
    // Ваша кастомная логика
    return super.generateMessageHandlers(context) + this.addProjectSpecificHandlers();
  }
}
```

## Примеры использования

### Базовое использование (без изменений)

```typescript
import { generatePythonCode } from '@/lib/bot-generator';

// Работает точно так же, как и раньше
const code = generatePythonCode(
  botData,
  'MyBot',
  groups,
  true,
  123,
  true
);
```

### Продвинутое использование с новыми модулями

```typescript
import { CodeGenerator, GenerationContext } from '@/lib/Core';
import { 
  ImportsGenerator,
  PythonCodeGenerator,
  HandlerGenerator,
  MainLoopGenerator 
} from '@/lib/Generators';

// Создание кастомного пайплайна генерации
const context = GenerationContext.create({
  botData: myBotData,
  botName: 'AdvancedBot',
  groups: botGroups,
  userDatabaseEnabled: true,
  projectId: 456,
  enableLogging: true
});

const codeGenerator = new CodeGenerator(
  new ImportsGenerator(),
  new PythonCodeGenerator(),
  new HandlerGenerator(),
  new MainLoopGenerator()
);

const result = codeGenerator.generate(context);

if (result.success) {
  console.log('Generated code:', result.code);
  console.log('Metadata:', result.metadata);
} else {
  console.error('Generation failed:', result.errors);
}
```

### Использование отдельных генераторов

```typescript
import { ImportsGenerator, HandlerGenerator } from '@/lib/Generators';
import { GenerationContext } from '@/lib/Core';

const context = GenerationContext.create(options);

// Генерация только импортов
const importsGenerator = new ImportsGenerator();
const imports = importsGenerator.generateImports(context);

// Генерация только обработчиков
const handlerGenerator = new HandlerGenerator();
const handlers = handlerGenerator.generateMessageHandlers(context);
```

### Кастомизация шаблонов

```typescript
import { PythonTemplates } from '@/lib/Templates';

class MyCustomTemplates extends PythonTemplates {
  getBotInitTemplate(): string {
    return `
# Custom bot initialization
bot = Bot(token=BOT_TOKEN, parse_mode='HTML')
dp = Dispatcher()
# Add custom middleware
dp.middleware.setup(MyCustomMiddleware())
`;
  }
}

// Использование кастомных шаблонов
const customTemplates = new MyCustomTemplates();
const initCode = customTemplates.getBotInitTemplate();
```

## Тестирование после миграции

### 1. Regression тесты

```bash
# Запуск всех тестов для проверки совместимости
npm test

# Специфические regression тесты
npm test -- --grep "regression"
```

### 2. Тестирование новых модулей

```bash
# Тесты Core модуля
npm test -- Core

# Тесты Generators
npm test -- Generators

# Тесты Templates
npm test -- Templates
```

### 3. Performance тесты

```bash
# Проверка производительности после рефакторинга
npm run test:performance
```

## Устранение проблем

### Проблема: Импорты не работают

**Решение**: Убедитесь, что используете правильные пути импорта:

```typescript
// ✅ Правильно
import { generatePythonCode } from '@/lib/bot-generator';
import { CodeGenerator } from '@/lib/Core';

// ❌ Неправильно
import { generatePythonCode } from '@/lib/Core/CodeGenerator';
```

### Проблема: Результат генерации отличается

**Решение**: Проверьте, что используете те же параметры:

```typescript
// Убедитесь, что все параметры переданы корректно
const result = generatePythonCode(
  botData,        // ✅ Тот же объект
  botName,        // ✅ Та же строка
  groups,         // ✅ Тот же массив
  userDatabaseEnabled, // ✅ То же булево значение
  projectId,      // ✅ То же число или null
  enableLogging   // ✅ То же булево значение
);
```

### Проблема: TypeScript ошибки

**Решение**: Обновите типы:

```typescript
// Импортируйте необходимые типы
import type { 
  GenerationContext, 
  GenerationResult,
  GenerationOptions 
} from '@/lib/Core';
```

## Производительность

### Ожидаемые изменения

- **Время генерации**: Без изменений или незначительное улучшение
- **Потребление памяти**: Незначительное увеличение из-за модульности
- **Размер бандла**: Минимальное увеличение (~5-10%)

### Оптимизация

```typescript
// Используйте ленивую загрузку для больших проектов
const generators = await import('@/lib/Generators');
const codeGenerator = new generators.CodeGenerator(/* ... */);
```

## Поддержка

### Период поддержки старого API

- **Полная поддержка**: До версии 3.0
- **Deprecation warnings**: Начиная с версии 2.5
- **Удаление**: Версия 3.0 (планируется через 12 месяцев)

### Получение помощи

1. **Документация**: Читайте README файлы в каждом модуле
2. **Примеры**: Смотрите тесты для примеров использования
3. **Issues**: Создавайте issue в репозитории для вопросов

## Заключение

Рефакторинг bot-generator.ts обеспечивает:

- ✅ **Полную обратную совместимость**
- ✅ **Улучшенную архитектуру**
- ✅ **Лучшую тестируемость**
- ✅ **Простоту расширения**
- ✅ **Четкое разделение ответственности**

Существующий код продолжит работать без изменений, но новые проекты могут воспользоваться преимуществами модульной архитектуры.