/**
 * Generators Module - Модули генерации кода для различных частей бота
 * 
 * Экспортирует все генераторы, их интерфейсы и связанные типы.
 * Предоставляет полный набор инструментов для генерации Python кода Telegram ботов.
 * 
 * @example
 * ```typescript
 * import { 
 *   ImportsGenerator, 
 *   PythonCodeGenerator,
 *   HandlerGenerator,
 *   MainLoopGenerator 
 * } from '@/lib/Generators';
 * 
 * // Создание генераторов
 * const importsGen = new ImportsGenerator();
 * const pythonGen = new PythonCodeGenerator();
 * const handlerGen = new HandlerGenerator();
 * const mainLoopGen = new MainLoopGenerator();
 * 
 * // Использование генераторов
 * const imports = importsGen.generateImports(context);
 * const botInit = pythonGen.generateBotInitialization(context);
 * const handlers = handlerGen.generateMessageHandlers(context);
 * const mainLoop = mainLoopGen.generateMainFunction(context);
 * ```
 * 
 * @module Generators
 * @version 2.0.0
 * @since 2.0.0
 */

// ============================================================================
// ОСНОВНЫЕ ГЕНЕРАТОРЫ
// ============================================================================

/**
 * Конкретные реализации генераторов для различных частей Python кода
 * 
 * @group Generator Classes
 */
export { 
  /** 
   * Генератор импортов и настройки кодировки Python файлов
   * 
   * Отвечает за:
   * - Генерацию UTF-8 кодировки
   * - Импорты Python библиотек
   * - Команды для BotFather
   * - Условную генерацию импортов в зависимости от возможностей бота
   * 
   * @see {@link IImportsGenerator}
   */
  ImportsGenerator 
} from './ImportsGenerator';

export { 
  /** 
   * Генератор базовой структуры Python кода
   * 
   * Отвечает за:
   * - Инициализацию бота и диспетчера
   * - Генерацию глобальных переменных
   * - Настройку логирования
   * - Вспомогательные функции
   * 
   * @see {@link IPythonCodeGenerator}
   */
  PythonCodeGenerator 
} from './PythonCodeGenerator';

export { 
  /** 
   * Генератор обработчиков сообщений и callback'ов
   * 
   * Отвечает за:
   * - Обработчики текстовых сообщений
   * - Обработчики callback кнопок
   * - Обработчики множественного выбора
   * - Обработчики медиа файлов
   * - Интеграцию с существующими модулями
   * 
   * @see {@link IHandlerGenerator}
   */
  HandlerGenerator 
} from './HandlerGenerator';

export { 
  /** 
   * Генератор основного цикла и функции main()
   * 
   * Отвечает за:
   * - Функцию main() и запуск бота
   * - Регистрацию всех обработчиков
   * - Регистрацию middleware
   * - Graceful shutdown
   * 
   * @see {@link IMainLoopGenerator}
   */
  MainLoopGenerator 
} from './MainLoopGenerator';

// ============================================================================
// ИНТЕРФЕЙСЫ ГЕНЕРАТОРОВ
// ============================================================================

/**
 * Интерфейсы для всех типов генераторов
 * 
 * Эти интерфейсы определяют контракты для реализации генераторов
 * и обеспечивают типобезопасность при работе с ними.
 * 
 * @group Generator Interfaces
 */
export type {
  /** 
   * Интерфейс для генератора импортов Python
   * 
   * Определяет методы для:
   * - generateImports() - генерация импортов библиотек
   * - generateEncodingSetup() - настройка UTF-8 кодировки
   * - generateBotFatherCommands() - команды для BotFather
   * 
   * @interface
   */
  IImportsGenerator,
  
  /** 
   * Интерфейс для генератора базового Python кода
   * 
   * Определяет методы для:
   * - generateBotInitialization() - инициализация бота
   * - generateGlobalVariables() - глобальные переменные
   * - generateUtilityFunctions() - вспомогательные функции
   * - generateGroupsConfiguration() - конфигурация групп
   * 
   * @interface
   */
  IPythonCodeGenerator,
  
  /** 
   * Интерфейс для генератора обработчиков
   * 
   * Определяет методы для:
   * - generateMessageHandlers() - обработчики сообщений
   * - generateCallbackHandlers() - обработчики callback'ов
   * - generateMultiSelectHandlers() - множественный выбор
   * - generateMediaHandlers() - обработчики медиа
   * - generateGroupHandlers() - обработчики групп
   * 
   * @interface
   */
  IHandlerGenerator,
  
  /** 
   * Интерфейс для генератора основного цикла
   * 
   * Определяет методы для:
   * - generateMainFunction() - основная функция main()
   * - generateBotStartup() - код запуска бота
   * - generateBotShutdown() - код остановки бота
   * - generateEntryPoint() - точка входа в программу
   * 
   * @interface
   */
  IMainLoopGenerator,
  
  /** 
   * Основной интерфейс генератора кода
   * 
   * Определяет метод:
   * - generate() - генерация полного кода бота
   * 
   * @interface
   */
  ICodeGenerator
} from '../Core/types';

// ============================================================================
// ТИПЫ ДЛЯ РАБОТЫ С ГЕНЕРАТОРАМИ
// ============================================================================

/**
 * Основные типы данных для работы с генераторами
 * 
 * @group Generator Data Types
 */
export type {
  /** 
   * Контекст генерации - основной объект с данными для генерации
   * 
   * Содержит:
   * - Данные бота (botData)
   * - Узлы и соединения (nodes, connections)
   * - Настройки (userDatabaseEnabled, enableLogging)
   * - Медиа переменные (mediaVariablesMap)
   * 
   * @readonly
   */
  GenerationContext,
  
  /** 
   * Опции для настройки процесса генерации
   * 
   * Включает:
   * - Базовые параметры (botName, groups)
   * - Переопределения шаблонов (templateOverrides)
   * - Конфигурацию генератора (generatorConfig)
   * 
   * @readonly
   */
  GenerationOptions,
  
  /** 
   * Результат генерации кода с метаданными
   * 
   * Содержит:
   * - Флаг успешности (success)
   * - Сгенерированный код (code)
   * - Ошибки и предупреждения (errors, warnings)
   * - Метаданные производительности (metadata)
   * 
   * @readonly
   */
  GenerationResult,
  
  /** 
   * Информация об ошибке генерации
   * 
   * Включает:
   * - Тип ошибки (type)
   * - Сообщение и модуль (message, module)
   * - Контекст и стек (context, stack)
   * 
   * @readonly
   */
  GenerationError,
  
  /** 
   * Метаданные результата генерации
   * 
   * Статистика:
   * - Количество строк (linesGenerated)
   * - Количество обработчиков (handlersCount)
   * - Время генерации (generationTimeMs)
   * - Размер кода (codeSizeBytes)
   * 
   * @readonly
   */
  GenerationMetadata,
  
  /** 
   * Результат генерации обработчика
   * 
   * Содержит:
   * - Сгенерированный код (code)
   * - Количество обработчиков (handlersCount)
   * - Предупреждения (warnings)
   * 
   * @readonly
   */
  HandlerGenerationResult,
  
  /** 
   * Параметры для генерации обработчиков
   * 
   * Включает:
   * - Контекст генерации (context)
   * - Тип обработчика (handlerType)
   * - Дополнительные опции (options)
   * 
   * @readonly
   */
  HandlerGenerationParams,
  
  /** 
   * Тип обработчика для различных узлов бота
   * 
   * Возможные значения:
   * - 'message' - текстовые сообщения
   * - 'callback' - callback кнопки
   * - 'multiselect' - множественный выбор
   * - 'media' - медиа файлы
   * - 'command' - команды бота
   * - 'start' - команда /start
   * - 'group' - групповые чаты
   * - 'admin' - административные функции
   * - 'synonym' - синонимы команд
   */
  HandlerType,
  
  /** 
   * Конфигурация генератора
   * 
   * Настройки:
   * - Отладочная информация (enableDebug)
   * - Минификация вывода (minified)
   * - Дополнительные опции (options)
   * 
   * @readonly
   */
  GeneratorConfig
} from '../Core/types';

// ============================================================================
// ПЕРЕЧИСЛЕНИЯ
// ============================================================================

/**
 * Перечисления для типизации ошибок
 * 
 * @group Enums
 */
export { 
  /** 
   * Типы ошибок генерации
   * 
   * Значения:
   * - VALIDATION_ERROR - ошибки валидации входных данных
   * - TEMPLATE_ERROR - ошибки в шаблонах
   * - HANDLER_GENERATION_ERROR - ошибки генерации обработчиков
   * - IMPORT_ERROR - ошибки импортов
   * - UNKNOWN_ERROR - неизвестные ошибки
   */
  GenerationErrorType 
} from '../Core/types';

// ============================================================================
// ФАБРИЧНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Фабричные функции для удобного создания объектов
 * 
 * @group Factory Functions
 * @example
 * ```typescript
 * import { GenerationFactory } from '@/lib/Generators';
 * 
 * // Создание успешного результата
 * const result = GenerationFactory.createSuccessResult(
 *   generatedCode,
 *   { linesGenerated: 100, handlersCount: 5 }
 * );
 * 
 * // Создание ошибки
 * const error = GenerationFactory.createGenerationError({
 *   type: GenerationErrorType.HANDLER_GENERATION_ERROR,
 *   message: 'Failed to generate handler',
 *   module: 'HandlerGenerator'
 * });
 * ```
 */
export { 
  /** 
   * Фабрика для создания объектов генерации
   * 
   * Методы:
   * - createSuccessResult() - успешный результат
   * - createErrorResult() - результат с ошибкой
   * - createGenerationError() - ошибка генерации
   * - createGenerationContext() - контекст генерации
   */
  GenerationFactory 
} from '../Core/types';

// ============================================================================
// ИНФОРМАЦИЯ О МОДУЛЕ
// ============================================================================

/**
 * Информация о версии и возможностях Generators модуля
 * 
 * @constant
 * @readonly
 */
export const GENERATORS_MODULE_INFO = {
  /** Версия модуля */
  version: '2.0.0',
  /** Название модуля */
  name: 'Generators',
  /** Описание модуля */
  description: 'Модули генерации кода для различных частей Telegram ботов',
  /** Поддерживаемые генераторы */
  generators: [
    'ImportsGenerator - генерация импортов и кодировки',
    'PythonCodeGenerator - базовая структура Python кода',
    'HandlerGenerator - обработчики сообщений и callback\'ов',
    'MainLoopGenerator - основной цикл и функция main()'
  ],
  /** Поддерживаемые возможности */
  features: [
    'Модульная архитектура',
    'Типобезопасность',
    'Композиция генераторов',
    'Обработка ошибок',
    'Производительность'
  ],
  /** Зависимости */
  dependencies: ['Core', 'Templates'],
  /** Статистика экспорта */
  exports: {
    classes: 4,
    interfaces: 5,
    types: 8,
    enums: 1,
    factories: 1
  }
} as const;