# Generators Module

Модуль Generators содержит специализированные генераторы для различных частей Python-кода Telegram ботов. Каждый генератор отвечает за конкретную область функциональности и может работать независимо.

## Архитектура

Модуль построен на принципах:

- **Единственная ответственность**: Каждый генератор решает одну задачу
- **Композиция**: Генераторы объединяются в CodeGenerator для создания полного кода
- **Интерфейсы**: Все генераторы реализуют четко определенные интерфейсы
- **Тестируемость**: Каждый генератор может быть протестирован изолированно

## Генераторы

### ImportsGenerator
Отвечает за генерацию всех импортов Python и начальной настройки файла.

**Возможности:**
- Генерация UTF-8 кодировки
- Импорты стандартных библиотек Python
- Импорты aiogram и других зависимостей
- Условные импорты в зависимости от функций бота
- Генерация команд для BotFather

```typescript
interface IImportsGenerator {
  generateImports(context: GenerationContext): string;
  generateEncodingSetup(): string;
  generateBotFatherCommands(nodes: Node[]): string;
}
```

**Пример использования:**
```typescript
const importsGenerator = new ImportsGenerator();
const imports = importsGenerator.generateImports(context);
```

### PythonCodeGenerator
Генерирует базовую структуру Python кода, инициализацию бота и основные переменные.

**Возможности:**
- Инициализация бота и диспетчера
- Генерация глобальных переменных (ADMIN_IDS, API_BASE_URL)
- Настройка логирования
- Вспомогательные функции (safe_edit_or_send, API функции)
- Middleware для логирования

```typescript
interface IPythonCodeGenerator {
  generateBotInitialization(context: GenerationContext): string;
  generateGlobalVariables(context: GenerationContext): string;
  generateUtilityFunctions(context: GenerationContext): string;
}
```

**Пример использования:**
```typescript
const pythonGenerator = new PythonCodeGenerator();
const botInit = pythonGenerator.generateBotInitialization(context);
const globals = pythonGenerator.generateGlobalVariables(context);
```

### HandlerGenerator
Генерирует все обработчики сообщений, команд и callback'ов.

**Возможности:**
- Обработчики текстовых сообщений
- Обработчики команд
- Callback обработчики для inline кнопок
- Multi-select обработчики
- Обработчики медиа файлов
- Интеграция с существующими модулями (CommandHandler, MediaHandler, Keyboard)

```typescript
interface IHandlerGenerator {
  generateMessageHandlers(context: GenerationContext): string;
  generateCallbackHandlers(context: GenerationContext): string;
  generateMultiSelectHandlers(context: GenerationContext): string;
  generateMediaHandlers(context: GenerationContext): string;
}
```

**Пример использования:**
```typescript
const handlerGenerator = new HandlerGenerator();
const messageHandlers = handlerGenerator.generateMessageHandlers(context);
const callbackHandlers = handlerGenerator.generateCallbackHandlers(context);
```

### MainLoopGenerator
Генерирует основной цикл бота и функцию main().

**Возможности:**
- Функция main() с правильной структурой
- Регистрация всех обработчиков в диспетчере
- Запуск и остановка бота
- Обработка сигналов завершения
- Регистрация middleware

```typescript
interface IMainLoopGenerator {
  generateMainFunction(context: GenerationContext): string;
  generateBotStartup(context: GenerationContext): string;
  generateBotShutdown(context: GenerationContext): string;
}
```

**Пример использования:**
```typescript
const mainLoopGenerator = new MainLoopGenerator();
const mainFunction = mainLoopGenerator.generateMainFunction(context);
```

## Интеграция с существующими модулями

Генераторы активно используют уже существующие модули:

- **CommandHandler**: Для генерации команд
- **MediaHandler**: Для обработки медиа файлов
- **Keyboard**: Для создания клавиатур
- **MessageHandler**: Для обработки сообщений
- **UserHandler**: Для работы с пользователями
- **Conditional**: Для условной логики
- **validate**: Для валидации данных

## Использование

### Создание всех генераторов
```typescript
import { createAllGenerators } from '@/lib/Generators';

const {
  importsGenerator,
  pythonCodeGenerator,
  handlerGenerator,
  mainLoopGenerator
} = createAllGenerators();
```

### Использование отдельного генератора
```typescript
import { ImportsGenerator } from '@/lib/Generators';

const importsGenerator = new ImportsGenerator();
const context = GenerationContext.create(options);
const imports = importsGenerator.generateImports(context);
```

### Кастомизация генераторов
```typescript
import { HandlerGenerator } from '@/lib/Generators';

class CustomHandlerGenerator extends HandlerGenerator {
  generateMessageHandlers(context: GenerationContext): string {
    // Кастомная логика генерации
    const baseHandlers = super.generateMessageHandlers(context);
    return baseHandlers + this.addCustomHandlers(context);
  }
}
```

## Тестирование

Каждый генератор имеет полное покрытие тестами:

```bash
# Тесты всех генераторов
npm test -- Generators

# Тесты конкретного генератора
npm test -- ImportsGenerator
npm test -- PythonCodeGenerator
npm test -- HandlerGenerator
npm test -- MainLoopGenerator
```

### Примеры тестов

```typescript
describe('ImportsGenerator', () => {
  it('should generate correct imports for basic bot', () => {
    const context = createTestContext();
    const generator = new ImportsGenerator();
    const result = generator.generateImports(context);
    
    expect(result).toContain('import asyncio');
    expect(result).toContain('from aiogram import Bot, Dispatcher');
  });

  it('should include database imports when userDatabaseEnabled', () => {
    const context = createTestContext({ userDatabaseEnabled: true });
    const generator = new ImportsGenerator();
    const result = generator.generateImports(context);
    
    expect(result).toContain('import aiohttp');
  });
});
```

## Производительность

- **Ленивая генерация**: Код генерируется только для используемых функций
- **Кэширование шаблонов**: Часто используемые шаблоны кэшируются
- **Оптимизация строк**: Эффективная конкатенация больших объемов кода
- **Параллельная генерация**: Независимые части могут генерироваться параллельно

## Расширение

### Добавление нового генератора

1. Создайте интерфейс в `types.ts`:
```typescript
interface IMyCustomGenerator {
  generateCustomCode(context: GenerationContext): string;
}
```

2. Реализуйте генератор:
```typescript
export class MyCustomGenerator implements IMyCustomGenerator {
  generateCustomCode(context: GenerationContext): string {
    // Ваша логика генерации
  }
}
```

3. Добавьте в `index.ts`:
```typescript
export { MyCustomGenerator } from './MyCustomGenerator';
```

4. Обновите `createAllGenerators()` если необходимо.

### Модификация существующего генератора

Используйте наследование для расширения функциональности:

```typescript
class ExtendedHandlerGenerator extends HandlerGenerator {
  generateMessageHandlers(context: GenerationContext): string {
    const baseHandlers = super.generateMessageHandlers(context);
    return baseHandlers + this.generateAdditionalHandlers(context);
  }

  private generateAdditionalHandlers(context: GenerationContext): string {
    // Дополнительная логика
  }
}
```

## Отладка

Для отладки генераторов используйте:

```typescript
import { enableGeneratorLogging } from '@/lib/Generators';

// Включить детальное логирование
enableGeneratorLogging(true);

const result = generator.generateCode(context);
```

## См. также

- [Core Module](../Core/README.md) - Основная архитектура
- [Templates Module](../Templates/README.md) - Система шаблонов
- [Design Document](../../../../.kiro/specs/bot-generator-refactoring/design.md) - Архитектурные решения