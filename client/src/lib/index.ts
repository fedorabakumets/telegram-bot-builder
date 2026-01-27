/**
 * Основной индексный файл библиотеки генерации ботов
 * 
 * Экспортирует все компоненты системы генерации кода для Telegram ботов.
 * Поддерживает как новую модульную архитектуру, так и обратную совместимость
 * со старыми путями импорта.
 * 
 * @example
 * ```typescript
 * // Использование новой модульной архитектуры
 * import { 
 *   CodeGenerator, 
 *   GenerationContext,
 *   ImportsGenerator,
 *   pythonTemplates 
 * } from '@/lib';
 * 
 * // Создание контекста и генерация кода
 * const context: GenerationContext = createContext(botData);
 * const generator = new CodeGenerator();
 * const result = await generator.generate(context);
 * 
 * // Использование отдельных генераторов
 * const importsGen = new ImportsGenerator();
 * const imports = importsGen.generateImports(context);
 * 
 * // Использование шаблонов
 * const encoding = pythonTemplates.getEncodingTemplate();
 * ```
 * 
 * @module BotGenerator
 * @version 2.0.0
 * @since 1.0.0
 */

// ============================================================================
// ОСНОВНЫЕ КОМПОНЕНТЫ ГЕНЕРАТОРА
// ============================================================================

/**
 * Главная функция генерации и связанные утилиты
 * 
 * @group Core Functions
 */
// Главная функция генерации и связанные утилиты
export * from './bot-generator';
export * from './commands';
export * from './queryClient';

// ============================================================================
// НОВАЯ МОДУЛЬНАЯ АРХИТЕКТУРА
// ============================================================================

/**
 * Основные модули новой архитектуры
 * 
 * Модульная система обеспечивает:
 * - Разделение ответственности между компонентами
 * - Типобезопасность на всех уровнях
 * - Легкость тестирования и поддержки
 * - Возможность композиции генераторов
 * 
 * @group Modular Architecture
 */
// Основные модули новой архитектуры
export * from './Core';
export * from './Generators';
export * from './Templates';

// ============================================================================
// СУЩЕСТВУЮЩИЕ МОДУЛИ (LEGACY SUPPORT)
// ============================================================================

/**
 * Существующие модули для обратной совместимости
 * 
 * Эти модули сохранены для поддержки существующего кода
 * и будут постепенно интегрированы в новую архитектуру.
 * 
 * @group Legacy Modules
 */
// Обработчики команд
export * from './CommandHandler';

// Условная логика
export * from './Conditional';

// Утилиты форматирования
export * from './format';

// Определение возможностей
export * from './has';

// Генераторы клавиатур
export * from './Keyboard';

// Утилиты маппинга кода
export * from './map-utils';

// Обработчики медиа
export * from './MediaHandler';

// Обработчики сообщений
export * from './MessageHandler';

// Создание структуры проекта
export * from './scaffolding';

// Утилиты хранения
export * from './storage';

// Обработчики синонимов
export * from './Synonyms';

// Обработчики управления пользователями
export * from './UserHandler';

// Общие утилиты
export * from './utils';

// Утилиты валидации
export * from './validate';

// Обработка переменных
export * from './variable';

// ============================================================================
// ПРЯМЫЕ ЭКСПОРТЫ ДЛЯ УДОБСТВА ИСПОЛЬЗОВАНИЯ
// ============================================================================

/**
 * Основные генераторы доступны напрямую для удобства импорта
 * 
 * @group Direct Generator Exports
 */
// Основные генераторы доступны напрямую для удобства импорта
export {
  /** 
   * Генератор импортов и настройки кодировки Python файлов
   * @see {@link ImportsGenerator}
   */
  ImportsGenerator,
  
  /** 
   * Генератор базовой структуры Python кода
   * @see {@link PythonCodeGenerator}
   */
  PythonCodeGenerator,
  
  /** 
   * Генератор обработчиков сообщений и callback'ов
   * @see {@link HandlerGenerator}
   */
  HandlerGenerator,
  
  /** 
   * Генератор основного цикла и функции main()
   * @see {@link MainLoopGenerator}
   */
  MainLoopGenerator
} from './Generators';

/**
 * Основные шаблоны доступны напрямую
 * 
 * @group Direct Template Exports
 */
// Основные шаблоны доступны напрямую
export {
  /** 
   * Класс для работы с шаблонами Python кода
   * @see {@link PythonTemplates}
   */
  PythonTemplates,
  
  /** 
   * Глобальный экземпляр шаблонов Python
   * @see {@link pythonTemplates}
   */
  pythonTemplates,
  
  /** 
   * Класс для работы с шаблонами структуры бота
   * @see {@link BotStructureTemplate}
   */
  BotStructureTemplate,
  
  /** 
   * Глобальный экземпляр шаблонов структуры бота
   * @see {@link botStructureTemplate}
   */
  botStructureTemplate,
  
  /** 
   * Объект для удобного доступа ко всем шаблонам
   * @see {@link templates}
   */
  templates,
  
  /** 
   * Утилитарные функции для работы с шаблонами
   * @see {@link TemplateUtils}
   */
  TemplateUtils
} from './Templates';

/**
 * Core компоненты доступны напрямую
 * 
 * @group Direct Core Exports
 */
// Core компоненты доступны напрямую
export {
  /** 
   * Основной класс генератора кода
   * @see {@link CodeGenerator}
   */
  CodeGenerator,
  
  /** 
   * Строитель для создания контекста генерации
   * @see {@link GenerationContextBuilder}
   */
  GenerationContextBuilder,
  
  /** 
   * Фабрика для создания контекста генерации
   * @see {@link GenerationContextFactory}
   */
  GenerationContextFactory
} from './Core';

// ============================================================================
// ЭКСПОРТ ТИПОВ И ИНТЕРФЕЙСОВ
// ============================================================================

/**
 * Все типы и интерфейсы доступны для TypeScript разработки
 * 
 * Эти типы обеспечивают полную типобезопасность при работе с системой генерации.
 * Все интерфейсы документированы и содержат примеры использования.
 * 
 * @group Type Exports
 */
// Все типы и интерфейсы доступны для TypeScript разработки
export type {
  /** 
   * Основной контекст генерации, содержащий все необходимые данные
   * 
   * Включает данные бота, узлы, соединения, настройки и медиа переменные.
   * Является неизменяемым объектом для предотвращения побочных эффектов.
   * 
   * @example
   * ```typescript
   * const context: GenerationContext = {
   *   botData: myBotData,
   *   botName: 'MyBot',
   *   nodes: botNodes,
   *   userDatabaseEnabled: true,
   *   enableLogging: true
   * };
   * ```
   */
  GenerationContext,
  
  /** 
   * Опции для настройки процесса генерации
   * 
   * Позволяет настроить различные аспекты генерации, включая
   * переопределения шаблонов и конфигурацию генератора.
   * 
   * @example
   * ```typescript
   * const options: GenerationOptions = {
   *   botName: 'MyBot',
   *   groups: [],
   *   userDatabaseEnabled: true,
   *   templateOverrides: {
   *     'encoding': customEncodingTemplate
   *   }
   * };
   * ```
   */
  GenerationOptions,
  
  /** 
   * Результат генерации кода с информацией об успешности
   * 
   * Содержит сгенерированный код, информацию об ошибках,
   * предупреждения и метаданные производительности.
   * 
   * @example
   * ```typescript
   * const result: GenerationResult = await generator.generate(context);
   * if (result.success) {
   *   console.log('Generated code:', result.code);
   *   console.log('Lines generated:', result.metadata?.linesGenerated);
   * } else {
   *   console.error('Errors:', result.errors);
   * }
   * ```
   */
  GenerationResult,
  
  /** 
   * Информация об ошибке генерации с контекстом
   * 
   * Предоставляет детальную информацию об ошибках,
   * включая тип, сообщение, модуль и дополнительный контекст.
   * 
   * @example
   * ```typescript
   * const error: GenerationError = {
   *   type: GenerationErrorType.VALIDATION_ERROR,
   *   message: 'Invalid bot data',
   *   module: 'ImportsGenerator',
   *   context: { nodeId: 'start_node' }
   * };
   * ```
   */
  GenerationError,
  
  /** 
   * Перечисление типов ошибок генерации
   * 
   * Определяет категории ошибок для правильной обработки
   * и отображения пользователю.
   */
  GenerationErrorType
} from './Core/types';

/**
 * Интерфейсы генераторов для типобезопасной работы
 * 
 * @group Generator Interface Exports
 */
export type {
  /** 
   * Интерфейс для генератора импортов Python
   * 
   * Определяет контракт для генерации импортов, настройки кодировки
   * и команд BotFather. Реализуется классом ImportsGenerator.
   * 
   * @interface
   * @example
   * ```typescript
   * class CustomImportsGenerator implements IImportsGenerator {
   *   generateImports(context: GenerationContext): string {
   *     return 'import asyncio\n...';
   *   }
   *   
   *   generateEncodingSetup(): string {
   *     return '# -*- coding: utf-8 -*-\n';
   *   }
   *   
   *   generateBotFatherCommands(nodes: Node[]): string {
   *     return '# Commands for BotFather\n';
   *   }
   * }
   * ```
   */
  IImportsGenerator,
  
  /** 
   * Интерфейс для генератора базового Python кода
   * 
   * Определяет контракт для генерации инициализации бота,
   * глобальных переменных и вспомогательных функций.
   * 
   * @interface
   * @example
   * ```typescript
   * class CustomPythonGenerator implements IPythonCodeGenerator {
   *   generateBotInitialization(context: GenerationContext): string {
   *     return 'bot = Bot(token=BOT_TOKEN)\n';
   *   }
   *   
   *   generateGlobalVariables(context: GenerationContext): string {
   *     return 'ADMIN_IDS = [123456789]\n';
   *   }
   * }
   * ```
   */
  IPythonCodeGenerator,
  
  /** 
   * Интерфейс для генератора обработчиков сообщений
   * 
   * Определяет контракт для генерации различных типов обработчиков:
   * сообщений, callback'ов, медиа и множественного выбора.
   * 
   * @interface
   * @example
   * ```typescript
   * class CustomHandlerGenerator implements IHandlerGenerator {
   *   generateMessageHandlers(context: GenerationContext): HandlerGenerationResult {
   *     return {
   *       code: '@dp.message()\nasync def handle_message...',
   *       handlersCount: 5
   *     };
   *   }
   * }
   * ```
   */
  IHandlerGenerator,
  
  /** 
   * Интерфейс для генератора основного цикла бота
   * 
   * Определяет контракт для генерации функции main(),
   * кода запуска и остановки бота.
   * 
   * @interface
   * @example
   * ```typescript
   * class CustomMainLoopGenerator implements IMainLoopGenerator {
   *   generateMainFunction(context: GenerationContext): string {
   *     return 'async def main():\n    await dp.start_polling(bot)\n';
   *   }
   * }
   * ```
   */
  IMainLoopGenerator,
  
  /** 
   * Основной интерфейс генератора кода
   * 
   * Определяет контракт для полной генерации кода бота.
   * Обычно реализуется как композиция других генераторов.
   * 
   * @interface
   * @example
   * ```typescript
   * class CustomCodeGenerator implements ICodeGenerator {
   *   async generate(context: GenerationContext): Promise<GenerationResult> {
   *     // Логика генерации полного кода
   *     return { success: true, code: generatedCode };
   *   }
   * }
   * ```
   */
  ICodeGenerator
} from './Core/types';

/**
 * Интерфейсы шаблонов для работы с переиспользуемым кодом
 * 
 * @group Template Interface Exports
 */
export type {
  /** 
   * Интерфейс для системы шаблонов Python кода
   * 
   * Определяет контракт для получения различных шаблонов Python кода:
   * кодировки, импортов, инициализации, обработчиков и утилит.
   * 
   * @interface
   * @example
   * ```typescript
   * class CustomPythonTemplates implements IPythonTemplates {
   *   getEncodingTemplate(): string {
   *     return '# -*- coding: utf-8 -*-\n';
   *   }
   *   
   *   getImportsTemplate(): string {
   *     return 'import asyncio\nfrom aiogram import Bot\n';
   *   }
   * }
   * ```
   */
  IPythonTemplates,
  
  /** 
   * Интерфейс для шаблонов структуры бота
   * 
   * Определяет контракт для получения шаблонов различных
   * архитектур ботов: простых, с БД, с админ-панелью и т.д.
   * 
   * @interface
   * @example
   * ```typescript
   * class CustomBotStructure implements IBotStructureTemplate {
   *   getSimpleBotStructure(context: GenerationContext): string {
   *     return '# Simple bot structure\n...';
   *   }
   *   
   *   getDatabaseBotStructure(context: GenerationContext): string {
   *     return '# Database bot structure\n...';
   *   }
   * }
   * ```
   */
  IBotStructureTemplate
} from './Core/types';

// ============================================================================
// ОБРАТНАЯ СОВМЕСТИМОСТЬ
// ============================================================================

/**
 * Алиасы и экспорты для обратной совместимости со старыми импортами
 * 
 * @group Backward Compatibility
 */
// Алиасы для обратной совместимости со старыми импортами
export type {
  /** 
   * Алиас для GenerationContext для обратной совместимости
   * @deprecated Используйте GenerationContext вместо IGenerationContext
   */
  GenerationContext as IGenerationContext
} from './Core/types';

// Экспорт основной функции генерации под старым именем для совместимости
export { 
  /** 
   * Основная функция генерации Python кода для Telegram ботов
   * 
   * Генерирует полный Python код бота на основе данных из конструктора.
   * Поддерживает все возможности: команды, сообщения, callback кнопки,
   * медиа обработку, базу данных и административные функции.
   * 
   * @param botData Данные бота из конструктора
   * @param botName Имя бота
   * @param groups Группы бота
   * @param userDatabaseEnabled Включена ли база данных пользователей
   * @param projectId ID проекта для API
   * @param enableLogging Включено ли логирование
   * @returns Сгенерированный Python код
   * 
   * @example
   * ```typescript
   * import { generatePythonCode } from '@/lib';
   * 
   * const pythonCode = generatePythonCode(
   *   botData,
   *   'MyBot',
   *   [],
   *   true,  // userDatabaseEnabled
   *   123,   // projectId
   *   true   // enableLogging
   * );
   * 
   * console.log('Generated Python code:', pythonCode);
   * ```
   */
  generatePythonCode 
} from './bot-generator';

// ============================================================================
// УТИЛИТЫ ДЛЯ РАЗРАБОТЧИКОВ
// ============================================================================

/**
 * Информация о версии и архитектуре библиотеки
 * 
 * Содержит метаданные о текущей версии библиотеки,
 * архитектуре и доступных модулях.
 * 
 * @constant
 * @readonly
 * @example
 * ```typescript
 * import { LIB_INFO } from '@/lib';
 * 
 * console.log(`Library version: ${LIB_INFO.version}`);
 * console.log(`Architecture: ${LIB_INFO.architecture}`);
 * console.log('Available modules:', LIB_INFO.modules);
 * ```
 */
export const LIB_INFO = {
  /** Версия библиотеки */
  version: '2.0.0',
  /** Тип архитектуры */
  architecture: 'modular',
  /** Обратная совместимость */
  compatibility: 'backward-compatible',
  /** Доступные модули */
  modules: {
    /** Основные модули */
    core: ['CodeGenerator', 'GenerationContext'],
    /** Генераторы кода */
    generators: ['ImportsGenerator', 'PythonCodeGenerator', 'HandlerGenerator', 'MainLoopGenerator'],
    /** Система шаблонов */
    templates: ['PythonTemplates', 'BotStructureTemplate'],
    /** Устаревшие модули */
    legacy: ['CommandHandler', 'MediaHandler', 'MessageHandler', 'UserHandler', 'Keyboard']
  },
  /** Поддерживаемые возможности */
  features: [
    'Модульная архитектура',
    'Типобезопасность',
    'Композиция генераторов',
    'Система шаблонов',
    'Обработка ошибок',
    'Кэширование',
    'Обратная совместимость'
  ],
  /** Статистика экспорта */
  exports: {
    /** Общее количество экспортов */
    total: 50,
    /** Классы */
    classes: 12,
    /** Интерфейсы */
    interfaces: 15,
    /** Типы */
    types: 20,
    /** Функции */
    functions: 3
  }
} as const;

/**
 * Информация о миграции на новую архитектуру
 * 
 * @constant
 * @readonly
 */
export const MIGRATION_INFO = {
  /** Версия, с которой началась новая архитектура */
  newArchitectureSince: '2.0.0',
  /** Рекомендации по миграции */
  recommendations: [
    'Используйте новые модули Core, Generators, Templates',
    'Переходите на типизированные интерфейсы',
    'Используйте композицию генераторов вместо монолитной функции',
    'Применяйте систему шаблонов для переиспользования кода'
  ],
  /** Устаревшие импорты */
  deprecatedImports: [
    'IGenerationContext -> GenerationContext'
  ],
  /** Новые возможности */
  newFeatures: [
    'Модульная архитектура',
    'Система шаблонов',
    'Улучшенная типизация',
    'Фабричные функции',
    'Утилитарные классы'
  ]
} as const;