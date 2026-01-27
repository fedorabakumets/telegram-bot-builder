# Примеры использования новой архитектуры Bot Generator

Этот документ содержит практические примеры использования новой модульной архитектуры bot-generator.ts.

## Содержание

1. [Базовые примеры](#базовые-примеры)
2. [Работа с отдельными генераторами](#работа-с-отдельными-генераторами)
3. [Кастомизация генераторов](#кастомизация-генераторов)
4. [Использование шаблонов](#использование-шаблонов)
5. [Обработка ошибок](#обработка-ошибок)
6. [Продвинутые сценарии](#продвинутые-сценарии)

## Базовые примеры

### Пример 1: Обратная совместимость

```typescript
import { generatePythonCode } from '@/lib/bot-generator';

// Работает точно так же, как и раньше
const botData = {
  // ваши данные бота
};

const pythonCode = generatePythonCode(
  botData,
  'MyBot',
  groups,
  true, // userDatabaseEnabled
  123,  // projectId
  true  // enableLogging
);

console.log('Generated Python code:', pythonCode);
```

### Пример 2: Использование новой архитектуры

```typescript
import { CodeGenerator, GenerationContext } from '@/lib/Core';
import { createAllGenerators } from '@/lib/Generators';

// Создание контекста генерации
const context = GenerationContext.create({
  botData: myBotData,
  botName: 'AdvancedBot',
  groups: botGroups,
  userDatabaseEnabled: true,
  projectId: 456,
  enableLogging: true
});

// Создание генераторов
const generators = createAllGenerators();
const codeGenerator = new CodeGenerator(
  generators.importsGenerator,
  generators.pythonCodeGenerator,
  generators.handlerGenerator,
  generators.mainLoopGenerator
);

// Генерация кода
const result = codeGenerator.generate(context);

if (result.success) {
  console.log('✅ Generation successful!');
  console.log('Generated code length:', result.code?.length);
  console.log('Handlers count:', result.metadata?.handlersCount);
} else {
  console.error('❌ Generation failed:', result.errors);
}
```

## Работа с отдельными генераторами

### Пример 3: Генерация только импортов

```typescript
import { ImportsGenerator } from '@/lib/Generators';
import { GenerationContext } from '@/lib/Core';

const context = GenerationContext.create({
  botData: simpleBotData,
  botName: 'SimpleBot',
  groups: [],
  userDatabaseEnabled: false,
  projectId: null,
  enableLogging: false
});

const importsGenerator = new ImportsGenerator();

// Генерация кодировки UTF-8
const encoding = importsGenerator.generateEncodingSetup();
console.log('Encoding:', encoding);

// Генерация импортов
const imports = importsGenerator.generateImports(context);
console.log('Imports:', imports);

// Генерация команд для BotFather
const botFatherCommands = importsGenerator.generateBotFatherCommands(context.nodes);
console.log('BotFather commands:', botFatherCommands);
```

### Пример 4: Генерация обработчиков

```typescript
import { HandlerGenerator } from '@/lib/Generators';
import { GenerationContext } from '@/lib/Core';

const context = GenerationContext.create(options);
const handlerGenerator = new HandlerGenerator();

// Генерация обработчиков сообщений
const messageHandlers = handlerGenerator.generateMessageHandlers(context);
console.log('Message handlers:', messageHandlers);

// Генерация callback обработчиков
const callbackHandlers = handlerGenerator.generateCallbackHandlers(context);
console.log('Callback handlers:', callbackHandlers);

// Генерация multi-select обработчиков
const multiSelectHandlers = handlerGenerator.generateMultiSelectHandlers(context);
console.log('Multi-select handlers:', multiSelectHandlers);
```

### Пример 5: Генерация основного цикла

```typescript
import { MainLoopGenerator } from '@/lib/Generators';
import { GenerationContext } from '@/lib/Core';

const context = GenerationContext.create(options);
const mainLoopGenerator = new MainLoopGenerator();

// Генерация функции main()
const mainFunction = mainLoopGenerator.generateMainFunction(context);
console.log('Main function:', mainFunction);

// Генерация кода запуска бота
const startup = mainLoopGenerator.generateBotStartup(context);
console.log('Bot startup:', startup);
```

## Кастомизация генераторов

### Пример 6: Кастомный генератор импортов

```typescript
import { ImportsGenerator } from '@/lib/Generators';
import { GenerationContext } from '@/lib/Core';

class CustomImportsGenerator extends ImportsGenerator {
  generateImports(context: GenerationContext): string {
    // Получаем базовые импорты
    const baseImports = super.generateImports(context);
    
    // Добавляем кастомные импорты
    const customImports = `
# Custom imports for my project
import redis
import asyncpg
from my_custom_module import CustomHandler
`;
    
    return baseImports + customImports;
  }
}

// Использование кастомного генератора
const customImportsGenerator = new CustomImportsGenerator();
const context = GenerationContext.create(options);
const imports = customImportsGenerator.generateImports(context);
```

### Пример 7: Кастомный генератор обработчиков

```typescript
import { HandlerGenerator } from '@/lib/Generators';
import { GenerationContext } from '@/lib/Core';

class ProjectSpecificHandlerGenerator extends HandlerGenerator {
  generateMessageHandlers(context: GenerationContext): string {
    const baseHandlers = super.generateMessageHandlers(context);
    
    // Добавляем специфичные для проекта обработчики
    const projectHandlers = this.generateProjectSpecificHandlers(context);
    
    return baseHandlers + projectHandlers;
  }
  
  private generateProjectSpecificHandlers(context: GenerationContext): string {
    return `
# Project-specific handlers
@dp.message(Command("analytics"))
async def analytics_handler(message: types.Message):
    # Кастомная аналитика
    await send_analytics_report(message.from_user.id)
    await message.answer("📊 Отчет отправлен!")

@dp.message(Command("backup"))
async def backup_handler(message: types.Message):
    # Кастомное резервное копирование
    await create_backup()
    await message.answer("💾 Резервная копия создана!")
`;
  }
}
```

### Пример 8: Композиция кастомных генераторов

```typescript
import { CodeGenerator } from '@/lib/Core';
import { PythonCodeGenerator, MainLoopGenerator } from '@/lib/Generators';

// Создание CodeGenerator с кастомными генераторами
const codeGenerator = new CodeGenerator(
  new CustomImportsGenerator(),
  new PythonCodeGenerator(),
  new ProjectSpecificHandlerGenerator(),
  new MainLoopGenerator()
);

const result = codeGenerator.generate(context);
```

## Использование шаблонов

### Пример 9: Базовые шаблоны

```typescript
import { PythonTemplates } from '@/lib/Templates';

const templates = new PythonTemplates();

// Получение базовых шаблонов
const encoding = templates.getEncodingTemplate();
const imports = templates.getImportsTemplate();
const botInit = templates.getBotInitTemplate();

console.log('Encoding template:', encoding);
console.log('Imports template:', imports);
console.log('Bot init template:', botInit);
```

### Пример 10: Генерация функций с шаблонами

```typescript
import { PythonTemplates } from '@/lib/Templates';

const templates = new PythonTemplates();

// Создание функции с параметрами
const handlerFunction = templates.getFunctionTemplate(
  'welcome_handler',
  ['message: types.Message', 'user_data: dict'],
  `
    user_name = user_data.get('first_name', 'Пользователь')
    welcome_text = f"Добро пожаловать, {user_name}!"
    await message.answer(welcome_text)
`
);

console.log('Generated function:', handlerFunction);
```

### Пример 11: Кастомные шаблоны

```typescript
import { PythonTemplates } from '@/lib/Templates';

class MyProjectTemplates extends PythonTemplates {
  getBotInitTemplate(): string {
    return `
# Custom bot initialization with Redis
import redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

bot = Bot(token=BOT_TOKEN, parse_mode='HTML')
dp = Dispatcher()

# Custom middleware
@dp.middleware()
async def redis_middleware(handler, event, data):
    data['redis'] = redis_client
    return await handler(event, data)
`;
  }
  
  getCustomAnalyticsTemplate(): string {
    return `
async def track_user_action(user_id: int, action: str):
    timestamp = datetime.now().isoformat()
    analytics_data = {
        'user_id': user_id,
        'action': action,
        'timestamp': timestamp
    }
    redis_client.lpush('analytics', json.dumps(analytics_data))
`;
  }
}

const customTemplates = new MyProjectTemplates();
const botInit = customTemplates.getBotInitTemplate();
const analytics = customTemplates.getCustomAnalyticsTemplate();
```

## Обработка ошибок

### Пример 12: Обработка ошибок генерации

```typescript
import { CodeGenerator, GenerationContext } from '@/lib/Core';
import { createAllGenerators } from '@/lib/Generators';

try {
  const context = GenerationContext.create({
    botData: invalidBotData, // Некорректные данные
    botName: '',
    groups: [],
    userDatabaseEnabled: true,
    projectId: null,
    enableLogging: true
  });
  
  const generators = createAllGenerators();
  const codeGenerator = new CodeGenerator(...Object.values(generators));
  const result = codeGenerator.generate(context);
  
  if (!result.success) {
    console.error('Generation failed with errors:');
    result.errors?.forEach((error, index) => {
      console.error(`${index + 1}. ${error}`);
    });
    
    if (result.warnings?.length) {
      console.warn('Warnings:');
      result.warnings.forEach((warning, index) => {
        console.warn(`${index + 1}. ${warning}`);
      });
    }
  }
} catch (error) {
  console.error('Critical error during generation:', error);
}
```

### Пример 13: Валидация контекста

```typescript
import { GenerationContext } from '@/lib/Core';

function createSafeContext(options: any) {
  try {
    // Валидация входных данных
    if (!options.botData) {
      throw new Error('botData is required');
    }
    
    if (!options.botName || options.botName.trim() === '') {
      throw new Error('botName cannot be empty');
    }
    
    return GenerationContext.create(options);
  } catch (error) {
    console.error('Failed to create generation context:', error);
    return null;
  }
}

const context = createSafeContext({
  botData: myBotData,
  botName: 'ValidBot',
  groups: botGroups,
  userDatabaseEnabled: true,
  projectId: 123,
  enableLogging: true
});

if (context) {
  // Продолжаем генерацию
  const result = codeGenerator.generate(context);
}
```

## Продвинутые сценарии

### Пример 14: Условная генерация

```typescript
import { CodeGenerator, GenerationContext } from '@/lib/Core';
import { 
  ImportsGenerator,
  PythonCodeGenerator,
  HandlerGenerator,
  MainLoopGenerator 
} from '@/lib/Generators';

class ConditionalCodeGenerator extends CodeGenerator {
  generate(context: GenerationContext): GenerationResult {
    let code = '';
    
    // Условная генерация в зависимости от типа бота
    if (context.userDatabaseEnabled) {
      code += this.importsGenerator.generateImports(context);
      code += this.pythonCodeGenerator.generateBotInitialization(context);
    } else {
      // Упрощенная версия для ботов без БД
      code += this.generateSimpleBotCode(context);
    }
    
    // Всегда генерируем обработчики
    code += this.handlerGenerator.generateMessageHandlers(context);
    
    // Условная генерация основного цикла
    if (context.enableLogging) {
      code += this.mainLoopGenerator.generateMainFunction(context);
    } else {
      code += this.generateSimpleMainFunction(context);
    }
    
    return {
      success: true,
      code,
      metadata: {
        linesGenerated: code.split('\n').length,
        handlersCount: this.countHandlers(code),
        nodesProcessed: context.nodes.length
      }
    };
  }
  
  private generateSimpleBotCode(context: GenerationContext): string {
    return `
# Simple bot without database
from aiogram import Bot, Dispatcher
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
`;
  }
  
  private generateSimpleMainFunction(context: GenerationContext): string {
    return `
if __name__ == '__main__':
    dp.run_polling(bot)
`;
  }
  
  private countHandlers(code: string): number {
    return (code.match(/@dp\./g) || []).length;
  }
}
```

### Пример 15: Параллельная генерация

```typescript
import { GenerationContext } from '@/lib/Core';
import { createAllGenerators } from '@/lib/Generators';

async function generateCodeParallel(context: GenerationContext): Promise<string> {
  const generators = createAllGenerators();
  
  // Параллельная генерация независимых частей
  const [
    imports,
    pythonCode,
    handlers,
    mainLoop
  ] = await Promise.all([
    Promise.resolve(generators.importsGenerator.generateImports(context)),
    Promise.resolve(generators.pythonCodeGenerator.generateBotInitialization(context)),
    Promise.resolve(generators.handlerGenerator.generateMessageHandlers(context)),
    Promise.resolve(generators.mainLoopGenerator.generateMainFunction(context))
  ]);
  
  // Объединение результатов
  return [imports, pythonCode, handlers, mainLoop].join('\n\n');
}

// Использование
const context = GenerationContext.create(options);
const code = await generateCodeParallel(context);
console.log('Generated code:', code);
```

### Пример 16: Кэширование результатов

```typescript
import { GenerationContext } from '@/lib/Core';
import { ImportsGenerator } from '@/lib/Generators';

class CachedImportsGenerator extends ImportsGenerator {
  private cache = new Map<string, string>();
  
  generateImports(context: GenerationContext): string {
    // Создаем ключ кэша на основе конфигурации
    const cacheKey = this.createCacheKey(context);
    
    if (this.cache.has(cacheKey)) {
      console.log('Cache hit for imports generation');
      return this.cache.get(cacheKey)!;
    }
    
    console.log('Cache miss, generating imports');
    const imports = super.generateImports(context);
    this.cache.set(cacheKey, imports);
    
    return imports;
  }
  
  private createCacheKey(context: GenerationContext): string {
    return JSON.stringify({
      userDatabaseEnabled: context.userDatabaseEnabled,
      enableLogging: context.enableLogging,
      nodesCount: context.nodes.length,
      hasMediaNodes: context.nodes.some(node => node.type === 'media')
    });
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}
```

### Пример 17: Метрики и мониторинг

```typescript
import { CodeGenerator, GenerationContext } from '@/lib/Core';

class MonitoredCodeGenerator extends CodeGenerator {
  private metrics = {
    generationCount: 0,
    totalGenerationTime: 0,
    averageGenerationTime: 0,
    errorCount: 0
  };
  
  generate(context: GenerationContext): GenerationResult {
    const startTime = performance.now();
    
    try {
      const result = super.generate(context);
      
      // Обновляем метрики при успехе
      this.updateMetrics(startTime, true);
      
      return result;
    } catch (error) {
      // Обновляем метрики при ошибке
      this.updateMetrics(startTime, false);
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  private updateMetrics(startTime: number, success: boolean): void {
    const generationTime = performance.now() - startTime;
    
    this.metrics.generationCount++;
    this.metrics.totalGenerationTime += generationTime;
    this.metrics.averageGenerationTime = 
      this.metrics.totalGenerationTime / this.metrics.generationCount;
    
    if (!success) {
      this.metrics.errorCount++;
    }
    
    console.log('Generation metrics:', {
      ...this.metrics,
      lastGenerationTime: generationTime,
      successRate: ((this.metrics.generationCount - this.metrics.errorCount) / 
                   this.metrics.generationCount * 100).toFixed(2) + '%'
    });
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  resetMetrics(): void {
    this.metrics = {
      generationCount: 0,
      totalGenerationTime: 0,
      averageGenerationTime: 0,
      errorCount: 0
    };
  }
}
```

## Заключение

Эти примеры демонстрируют гибкость и мощь новой модульной архитектуры bot-generator.ts. Вы можете:

- Использовать существующий API без изменений
- Работать с отдельными генераторами для специфических задач
- Создавать кастомные генераторы для ваших нужд
- Использовать систему шаблонов для переиспользования кода
- Реализовывать продвинутые сценарии с кэшированием и мониторингом

Для получения дополнительной информации обратитесь к документации отдельных модулей:
- [Core Module](../client/src/lib/Core/README.md)
- [Generators Module](../client/src/lib/Generators/README.md)
- [Templates Module](../client/src/lib/Templates/README.md)