# Core Module

Модуль Core содержит основную архитектуру и оркестрацию процесса генерации Python-кода для Telegram ботов.

## Архитектура

Модуль Core реализует паттерн "Оркестратор" и обеспечивает координацию между различными генераторами кода. Основные принципы:

- **Единая точка входа**: CodeGenerator служит главным оркестратором
- **Контекст генерации**: GenerationContext содержит все необходимые данные
- **Инверсия зависимостей**: Модули зависят от абстракций, а не от конкретных реализаций
- **Композиция**: Объединение различных генераторов через dependency injection

## Компоненты

### CodeGenerator
Главный оркестратор процесса генерации кода. Координирует работу всех генераторов и обеспечивает правильную последовательность генерации.

```typescript
const codeGenerator = new CodeGenerator(
  importsGenerator,
  pythonCodeGenerator, 
  handlerGenerator,
  mainLoopGenerator
);

const result = codeGenerator.generate(context);
```

### GenerationContext
Неизменяемый объект, содержащий все данные, необходимые для генерации кода:

- Данные бота (BotData)
- Конфигурация групп
- Настройки базы данных
- Узлы и связи
- Карта медиа-переменных

```typescript
const context = GenerationContext.create({
  botData,
  botName,
  groups,
  userDatabaseEnabled,
  projectId,
  enableLogging
});
```

### Типы и интерфейсы

#### ICodeGenerator
```typescript
interface ICodeGenerator {
  generate(context: GenerationContext): GenerationResult;
}
```

#### GenerationResult
```typescript
interface GenerationResult {
  success: boolean;
  code?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: GenerationMetadata;
}
```

#### GenerationOptions
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

## Обработка ошибок

Модуль Core реализует централизованную обработку ошибок:

- **Валидация входных данных** перед началом генерации
- **Graceful degradation** при ошибках в отдельных генераторах
- **Детальное логирование** всех операций
- **Типизированные ошибки** для различных сценариев

```typescript
enum GenerationErrorType {
  VALIDATION_ERROR = 'validation_error',
  TEMPLATE_ERROR = 'template_error',
  HANDLER_GENERATION_ERROR = 'handler_generation_error',
  IMPORT_ERROR = 'import_error',
  UNKNOWN_ERROR = 'unknown_error'
}
```

## Использование

### Базовое использование
```typescript
import { CodeGenerator, GenerationContext } from '@/lib/Core';
import { createAllGenerators } from '@/lib/Generators';

// Создание генераторов
const generators = createAllGenerators();
const codeGenerator = new CodeGenerator(...generators);

// Создание контекста
const context = GenerationContext.create({
  botData: myBotData,
  botName: 'MyBot',
  groups: botGroups,
  userDatabaseEnabled: true,
  projectId: 123,
  enableLogging: true
});

// Генерация кода
const result = codeGenerator.generate(context);

if (result.success) {
  console.log('Generated code:', result.code);
} else {
  console.error('Generation failed:', result.errors);
}
```

### Расширенное использование с кастомными генераторами
```typescript
import { CodeGenerator } from '@/lib/Core';
import { CustomImportsGenerator } from './CustomImportsGenerator';

// Использование кастомного генератора импортов
const codeGenerator = new CodeGenerator(
  new CustomImportsGenerator(),
  pythonCodeGenerator,
  handlerGenerator,
  mainLoopGenerator
);
```

## Тестирование

Модуль Core полностью покрыт unit и integration тестами:

```bash
# Запуск тестов модуля Core
npm test -- Core

# Запуск с покрытием
npm run test:coverage -- Core
```

## Производительность

- **Ленивая инициализация**: Генераторы создаются только при необходимости
- **Кэширование контекста**: Повторное использование валидированного контекста
- **Оптимизация памяти**: Минимальное потребление памяти при генерации больших ботов

## Расширение

Для добавления нового генератора:

1. Создайте интерфейс генератора в `types.ts`
2. Реализуйте генератор в соответствующем модуле
3. Добавьте генератор в конструктор CodeGenerator
4. Обновите логику генерации в методе `generate()`

## См. также

- [Generators Module](../Generators/README.md) - Модули генерации кода
- [Templates Module](../Templates/README.md) - Система шаблонов
- [Design Document](../../../../.kiro/specs/bot-generator-refactoring/design.md) - Подробное описание архитектуры