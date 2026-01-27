# Bot Generator Library

Эта библиотека содержит утилиты для генерации Telegram ботов с модульной архитектурой.

## Архитектура

### Новая модульная структура (v2.0+):

- **`Core/`** - Основная архитектура и оркестрация генерации
  - `CodeGenerator.ts` - Главный оркестратор процесса генерации
  - `GenerationContext.ts` - Контекст и данные для генерации
  - `types.ts` - Интерфейсы и типы системы
- **`Generators/`** - Специализированные генераторы кода
  - `ImportsGenerator.ts` - Генерация импортов Python
  - `PythonCodeGenerator.ts` - Базовая структура Python кода
  - `HandlerGenerator.ts` - Генерация обработчиков событий
  - `MainLoopGenerator.ts` - Основной цикл бота
- **`Templates/`** - Система шаблонов для переиспользования
  - `PythonTemplates.ts` - Шаблоны Python кода
  - `BotStructureTemplate.ts` - Шаблоны структуры бота

### Основные файлы:

- **`bot-generator.ts`** - Основной генератор кода ботов (рефакторинг в модульную систему)
- **`user-utils.ts`** - Утилиты для работы с пользовательскими данными и переменными
- **`commands.ts`** - Генерация команд для BotFather

## Использование

### Базовое использование (обратная совместимость)

```typescript
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

### Продвинутое использование с новыми модулями

```typescript
import { CodeGenerator, GenerationContext } from '@/lib/Core';
import { createAllGenerators } from '@/lib/Generators';

// Создание контекста генерации
const context = GenerationContext.create({
  botData,
  botName,
  groups,
  userDatabaseEnabled,
  projectId,
  enableLogging
});

// Использование модульной системы
const generators = createAllGenerators();
const codeGenerator = new CodeGenerator(...Object.values(generators));
const result = codeGenerator.generate(context);

if (result.success) {
  console.log('Generated code:', result.code);
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

## Пользовательские переменные

### Системные переменные

Боты автоматически получают доступ к следующим системным переменным:

| Переменная | Описание | Пример | Источник |
|------------|----------|--------|----------|
| `{user_name}` | Имя для отображения (приоритет: first_name > username > "Пользователь") | "Алексей" | Telegram API |
| `{first_name}` | Имя из профиля Telegram | "Алексей" | Telegram API |
| `{last_name}` | Фамилия из профиля Telegram | "Иванов" | Telegram API |
| `{username}` | Никнейм без @ | "alex123" | Telegram API |

### Использование переменных

Переменные можно использовать в любом тексте сообщения или кнопки:

```
Привет, {user_name}!
Добро пожаловать, {first_name} {last_name}
```

### Функции для работы с переменными

#### `generateInitUserVariablesFunction(indentLevel?: string)`

Генерирует Python код функции `init_user_variables()`, которая:
- Извлекает данные пользователя из Telegram API
- Инициализирует системные переменные
- Сохраняет данные в `user_data`

#### `generateReplaceVariablesFunction(indentLevel?: string)`

Генерирует Python код функции `replace_variables_in_text()`, которая:
- Находит все переменные формата `{variable_name}` в тексте
- Заменяет их на соответствующие значения
- Обрабатывает случаи отсутствующих переменных

#### `generateUniversalVariableReplacement(indentLevel: string)`

Генерирует полный код для:
- Инициализации переменных пользователя
- Получения данных из базы данных
- Замены переменных в тексте

## Рефакторинг и миграция

### Что было изменено в v2.0:

1. **Модульная архитектура** - Монолитный bot-generator.ts разделен на специализированные модули
2. **Улучшенная типизация** - Добавлены строгие TypeScript интерфейсы для всех компонентов
3. **Система шаблонов** - Переиспользуемые шаблоны для генерации кода
4. **Лучшая тестируемость** - Каждый модуль может быть протестирован изолированно
5. **Расширяемость** - Легко добавлять новые генераторы и кастомизировать существующие

### Обратная совместимость

Все существующие API остаются без изменений. Ваш код продолжит работать:

```typescript
// ✅ Продолжает работать без изменений
import { generatePythonCode } from '@/lib/bot-generator';
const code = generatePythonCode(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);
```

### Миграция на новую архитектуру

Для новых проектов рекомендуется использовать модульную систему:

```typescript
// Новый подход (рекомендуется)
import { CodeGenerator, GenerationContext } from '@/lib/Core';
import { createAllGenerators } from '@/lib/Generators';

const context = GenerationContext.create(options);
const generators = createAllGenerators();
const codeGenerator = new CodeGenerator(...Object.values(generators));
const result = codeGenerator.generate(context);
```

**Подробное руководство по миграции**: [Migration Guide](../../../docs/MIGRATION_GUIDE.md)

### Преимущества новой архитектуры:

- **Модульность** - Четкое разделение ответственности между компонентами
- **Переиспользование** - Генераторы и шаблоны можно использовать независимо
- **Тестируемость** - Каждый модуль легко покрыть unit-тестами
- **Документированность** - Подробная документация для каждого модуля
- **Расширяемость** - Простое добавление новых генераторов и функций
- **Производительность** - Оптимизированная генерация с кэшированием шаблонов

## Примеры использования

### Добавление новой системной переменной

1. Обновите `SYSTEM_VARIABLES` в `user-utils.ts`:

```typescript
export const SYSTEM_VARIABLES = {
  // ... существующие переменные
  user_id: {
    description: 'Уникальный ID пользователя в Telegram',
    example: '123456789',
    source: 'Telegram API'
  }
} as const;
```

2. Обновите `generateInitUserVariablesFunction()` для инициализации новой переменной:

```typescript
code += `${indentLevel}    user_data[user_id]["user_id"] = user_id\n`;
```

### Тестирование

Запустите тесты для проверки функциональности:

```bash
npm test user-utils
```

## Совместимость

Рефакторинг полностью обратно совместим. Все существующие боты продолжат работать без изменений.