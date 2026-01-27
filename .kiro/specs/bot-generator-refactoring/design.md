# Design Document

## Overview

Данный документ описывает архитектурное решение для рефакторинга монолитного файла `bot-generator.ts` (7267 строк) в модульную систему. Анализ показал, что большинство функций уже выделено в отдельные модули, но основная функция `generatePythonCode` остается монолитной и содержит сложную логику генерации Python-кода для Telegram ботов.

Текущее состояние:
- ✅ Уже выделены модули: CommandHandler, Conditional, format, has, Keyboard, MediaHandler, MessageHandler, scaffolding, Synonyms, UserHandler, utils, validate, variable
- ❌ Основная функция `generatePythonCode` остается монолитной (~7000+ строк)
- ❌ Отсутствует четкое разделение ответственности внутри основной функции
- ❌ Сложно тестировать отдельные части генерации

## Architecture

### Принципы архитектуры

1. **Модульность**: Каждый модуль отвечает за конкретную область генерации кода
2. **Композиция**: Основная функция становится оркестратором модулей
3. **Инверсия зависимостей**: Модули зависят от абстракций, а не от конкретных реализаций
4. **Единственная ответственность**: Каждый модуль решает одну задачу

### Целевая архитектура

```
bot-generator.ts (< 500 строк)
├── Core/
│   ├── CodeGenerator.ts          # Основной оркестратор
│   ├── GenerationContext.ts      # Контекст генерации
│   └── index.ts
├── Generators/
│   ├── PythonCodeGenerator.ts    # Генерация базовой структуры Python
│   ├── ImportsGenerator.ts       # Генерация импортов
│   ├── HandlerGenerator.ts       # Генерация обработчиков
│   ├── MainLoopGenerator.ts      # Генерация основного цикла
│   └── index.ts
├── Templates/
│   ├── PythonTemplates.ts        # Шаблоны Python кода
│   ├── BotStructureTemplate.ts   # Шаблон структуры бота
│   └── index.ts
└── существующие модули...
```

## Components and Interfaces

### 1. Core Components

#### GenerationContext
```typescript
interface GenerationContext {
  botData: BotData;
  botName: string;
  groups: BotGroup[];
  userDatabaseEnabled: boolean;
  projectId: number | null;
  enableLogging: boolean;
  nodes: Node[];
  connections: any[];
  mediaVariablesMap: Map<string, any>;
  allNodeIds: string[];
}
```

#### CodeGenerator
```typescript
interface ICodeGenerator {
  generate(context: GenerationContext): string;
}

class CodeGenerator implements ICodeGenerator {
  constructor(
    private importsGenerator: ImportsGenerator,
    private pythonCodeGenerator: PythonCodeGenerator,
    private handlerGenerator: HandlerGenerator,
    private mainLoopGenerator: MainLoopGenerator
  ) {}
}
```

### 2. Generator Components

#### ImportsGenerator
Отвечает за генерацию всех импортов и начальной настройки Python файла.

```typescript
interface IImportsGenerator {
  generateImports(context: GenerationContext): string;
  generateEncodingSetup(): string;
  generateBotFatherCommands(nodes: Node[]): string;
}
```

#### PythonCodeGenerator
Генерирует базовую структуру Python кода, инициализацию бота и основные переменные.

```typescript
interface IPythonCodeGenerator {
  generateBotInitialization(context: GenerationContext): string;
  generateGlobalVariables(context: GenerationContext): string;
  generateUtilityFunctions(context: GenerationContext): string;
}
```

#### HandlerGenerator
Генерирует все обработчики сообщений, команд и callback'ов.

```typescript
interface IHandlerGenerator {
  generateMessageHandlers(context: GenerationContext): string;
  generateCallbackHandlers(context: GenerationContext): string;
  generateMultiSelectHandlers(context: GenerationContext): string;
  generateMediaHandlers(context: GenerationContext): string;
}
```

#### MainLoopGenerator
Генерирует основной цикл бота и функцию main().

```typescript
interface IMainLoopGenerator {
  generateMainFunction(context: GenerationContext): string;
  generateBotStartup(context: GenerationContext): string;
  generateBotShutdown(context: GenerationContext): string;
}
```

### 3. Template System

#### PythonTemplates
Содержит все шаблоны Python кода для переиспользования.

```typescript
interface IPythonTemplates {
  getEncodingTemplate(): string;
  getImportsTemplate(): string;
  getBotInitTemplate(): string;
  getMainFunctionTemplate(): string;
  getHandlerTemplate(handlerType: string): string;
}
```

## Data Models

### GenerationResult
```typescript
interface GenerationResult {
  success: boolean;
  code?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    linesGenerated: number;
    handlersCount: number;
    nodesProcessed: number;
  };
}
```

### GenerationOptions
```typescript
interface GenerationOptions {
  botName: string;
  groups: BotGroup[];
  userDatabaseEnabled: boolean;
  projectId: number | null;
  enableLogging: boolean;
  templateOverrides?: Partial<IPythonTemplates>;
}
```

## Error Handling

### Стратегия обработки ошибок

1. **Валидация входных данных**: Проверка корректности BotData перед генерацией
2. **Graceful degradation**: При ошибке в одном модуле, остальные продолжают работу
3. **Детальное логирование**: Каждый модуль логирует свои операции
4. **Rollback capability**: Возможность откатиться к предыдущей версии при критических ошибках

### Типы ошибок

```typescript
enum GenerationErrorType {
  VALIDATION_ERROR = 'validation_error',
  TEMPLATE_ERROR = 'template_error',
  HANDLER_GENERATION_ERROR = 'handler_generation_error',
  IMPORT_ERROR = 'import_error',
  UNKNOWN_ERROR = 'unknown_error'
}

interface GenerationError {
  type: GenerationErrorType;
  message: string;
  module: string;
  context?: any;
}
```

## Testing Strategy

### 1. Unit Testing

Каждый модуль будет иметь собственные unit тесты:

```typescript
// Пример теста для ImportsGenerator
describe('ImportsGenerator', () => {
  it('should generate correct imports for basic bot', () => {
    const context = createTestContext();
    const generator = new ImportsGenerator();
    const result = generator.generateImports(context);
    
    expect(result).toContain('import asyncio');
    expect(result).toContain('from aiogram import Bot, Dispatcher');
  });
});
```

### 2. Integration Testing

Тестирование взаимодействия между модулями:

```typescript
describe('CodeGenerator Integration', () => {
  it('should generate complete Python code', () => {
    const context = createComplexTestContext();
    const generator = new CodeGenerator(/* dependencies */);
    const result = generator.generate(context);
    
    expect(result).toMatchSnapshot();
    expect(result).toContain('async def main():');
  });
});
```

### 3. Regression Testing

Сравнение результатов генерации до и после рефакторинга:

```typescript
describe('Regression Tests', () => {
  it('should generate identical code for existing bot configurations', () => {
    const testCases = loadExistingBotConfigurations();
    
    testCases.forEach(testCase => {
      const oldResult = generatePythonCodeOld(testCase.botData);
      const newResult = generatePythonCode(testCase.botData);
      
      expect(normalizeCode(newResult)).toBe(normalizeCode(oldResult));
    });
  });
});
```

### 4. Performance Testing

Измерение производительности после рефакторинга:

```typescript
describe('Performance Tests', () => {
  it('should maintain generation speed', () => {
    const largeBot = createLargeBotData();
    
    const startTime = performance.now();
    generatePythonCode(largeBot);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(ACCEPTABLE_GENERATION_TIME);
  });
});
```

## Migration Strategy

### Этап 1: Подготовка инфраструктуры
1. Создание новых модулей и интерфейсов
2. Настройка системы тестирования
3. Создание baseline тестов для текущей функциональности

### Этап 2: Поэтапное выделение модулей
1. **ImportsGenerator**: Выделение логики генерации импортов
2. **PythonCodeGenerator**: Выделение базовой структуры
3. **HandlerGenerator**: Выделение генерации обработчиков
4. **MainLoopGenerator**: Выделение основного цикла

### Этап 3: Интеграция и оптимизация
1. Создание основного CodeGenerator
2. Рефакторинг generatePythonCode для использования новых модулей
3. Оптимизация производительности
4. Финальное тестирование

### Этап 4: Очистка и документация
1. Удаление устаревшего кода
2. Обновление документации
3. Создание migration guide

## Design Decisions and Rationales

### 1. Композиция вместо наследования
**Решение**: Использовать композицию для объединения генераторов
**Обоснование**: Большая гибкость, легче тестировать, избегаем проблем множественного наследования

### 2. Dependency Injection
**Решение**: Внедрение зависимостей через конструктор
**Обоснование**: Упрощает тестирование, повышает модульность, позволяет легко заменять реализации

### 3. Immutable Context
**Решение**: GenerationContext как неизменяемый объект
**Обоснование**: Предотвращает побочные эффекты, упрощает отладку, повышает предсказуемость

### 4. Template-based Generation
**Решение**: Использование шаблонов для генерации кода
**Обоснование**: Упрощает поддержку, позволяет легко изменять формат вывода, повышает читаемость

### 5. Сохранение обратной совместимости
**Решение**: Основная функция generatePythonCode остается с тем же интерфейсом
**Обоснование**: Минимизирует breaking changes, упрощает миграцию, сохраняет существующие интеграции

## Performance Considerations

### 1. Ленивая инициализация
Генераторы создаются только при необходимости для экономии памяти.

### 2. Кэширование шаблонов
Часто используемые шаблоны кэшируются для повышения производительности.

### 3. Потоковая генерация
Для очень больших ботов возможна потоковая генерация кода по частям.

### 4. Оптимизация строковых операций
Использование StringBuilder pattern для эффективной конкатенации строк.

## Security Considerations

### 1. Валидация входных данных
Все входные данные проходят валидацию перед обработкой.

### 2. Санитизация шаблонов
Шаблоны проверяются на наличие потенциально опасного кода.

### 3. Ограничение размера генерируемого кода
Установлены лимиты на размер генерируемого кода для предотвращения DoS атак.

## Monitoring and Observability

### 1. Метрики генерации
- Время генерации кода
- Количество обработанных узлов
- Размер генерируемого кода
- Количество ошибок

### 2. Логирование
Детальное логирование всех этапов генерации с возможностью включения/отключения.

### 3. Трассировка
Возможность отследить путь генерации для отладки сложных случаев.