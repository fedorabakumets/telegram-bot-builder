/**
 * Модуль Core - основные компоненты системы генерации кода
 * 
 * Экспортирует все типы, интерфейсы и классы для работы с системой генерации.
 * Предоставляет полный набор инструментов для создания модульных генераторов кода.
 * 
 * @example
 * ```typescript
 * import { 
 *   GenerationContext, 
 *   ICodeGenerator, 
 *   GenerationResult 
 * } from '@/lib/Core';
 * 
 * // Использование основных типов
 * const context: GenerationContext = createContext(botData);
 * const generator: ICodeGenerator = new CodeGenerator();
 * const result: GenerationResult = await generator.generate(context);
 * ```
 * 
 * @module Core
 * @version 2.0.0
 * @since 2.0.0
 */

// ============================================================================
// ОСНОВНЫЕ ТИПЫ ДАННЫХ
// ============================================================================

/**
 * Основные типы данных для работы с узлами и медиа
 * 
 * @group Data Types
 */
export type {
  /** 
   * Интерфейс для описания соединений между узлами бота
   * @see {@link NodeConnection}
   */
  NodeConnection,
  
  /** 
   * Интерфейс для описания медиа переменных
   * @see {@link MediaVariable}
   */
  MediaVariable,
  
  /** 
   * Тип карты медиа переменных для эффективного хранения
   * @see {@link MediaVariablesMap}
   */
  MediaVariablesMap,
  
  /** 
   * Параметры для создания контекста генерации
   * @see {@link CreateGenerationContextParams}
   */
  CreateGenerationContextParams,
  
  /** 
   * Конфигурация для различных типов генераторов
   * @see {@link GeneratorConfig}
   */
  GeneratorConfig
} from './types';

// ============================================================================
// КОНТЕКСТ И ОПЦИИ ГЕНЕРАЦИИ
// ============================================================================

/**
 * Типы для управления процессом генерации кода
 * 
 * @group Generation Context
 */
export type {
  /** 
   * Основной контекст генерации, содержащий все необходимые данные
   * @see {@link GenerationContext}
   */
  GenerationContext,
  
  /** 
   * Опции для настройки процесса генерации
   * @see {@link GenerationOptions}
   */
  GenerationOptions,
  
  /** 
   * Метаданные результата генерации для анализа производительности
   * @see {@link GenerationMetadata}
   */
  GenerationMetadata,
  
  /** 
   * Результат генерации кода с информацией об успешности
   * @see {@link GenerationResult}
   */
  GenerationResult
} from './types';

// ============================================================================
// ТИПЫ ОШИБОК И ОБРАБОТКА
// ============================================================================

/**
 * Типы для обработки ошибок в процессе генерации
 * 
 * @group Error Handling
 */
export type {
  /** 
   * Интерфейс для описания ошибок генерации
   * @see {@link GenerationError}
   */
  GenerationError
} from './types';

// ============================================================================
// ТИПЫ ДЛЯ ОБРАБОТЧИКОВ
// ============================================================================

/**
 * Типы для работы с различными обработчиками узлов
 * 
 * @group Handler Types
 */
export type {
  /** 
   * Перечисление типов обработчиков для различных узлов
   * @see {@link HandlerType}
   */
  HandlerType,
  
  /** 
   * Перечисление типов шаблонов кода
   * @see {@link TemplateType}
   */
  TemplateType,
  
  /** 
   * Параметры для генерации обработчиков
   * @see {@link HandlerGenerationParams}
   */
  HandlerGenerationParams,
  
  /** 
   * Результат генерации обработчика с метаданными
   * @see {@link HandlerGenerationResult}
   */
  HandlerGenerationResult
} from './types';

// ============================================================================
// ИНТЕРФЕЙСЫ ГЕНЕРАТОРОВ
// ============================================================================

/**
 * Интерфейсы для различных типов генераторов кода
 * 
 * @group Generator Interfaces
 */
export type {
  /** 
   * Интерфейс для генератора импортов Python
   * @see {@link IImportsGenerator}
   */
  IImportsGenerator,
  
  /** 
   * Интерфейс для генератора базового Python кода
   * @see {@link IPythonCodeGenerator}
   */
  IPythonCodeGenerator,
  
  /** 
   * Интерфейс для генератора обработчиков сообщений
   * @see {@link IHandlerGenerator}
   */
  IHandlerGenerator,
  
  /** 
   * Интерфейс для генератора основного цикла бота
   * @see {@link IMainLoopGenerator}
   */
  IMainLoopGenerator,
  
  /** 
   * Основной интерфейс генератора кода
   * @see {@link ICodeGenerator}
   */
  ICodeGenerator
} from './types';

// ============================================================================
// ИНТЕРФЕЙСЫ ШАБЛОНОВ
// ============================================================================

/**
 * Интерфейсы для системы шаблонов кода
 * 
 * @group Template Interfaces
 */
export type {
  /** 
   * Интерфейс для системы шаблонов Python кода
   * @see {@link IPythonTemplates}
   */
  IPythonTemplates,
  
  /** 
   * Интерфейс для шаблонов структуры бота
   * @see {@link IBotStructureTemplate}
   */
  IBotStructureTemplate
} from './types';

// ============================================================================
// УТИЛИТАРНЫЕ ТИПЫ
// ============================================================================

/**
 * Утилитарные типы для работы с функциями и валидацией
 * 
 * @group Utility Types
 */
export type {
  /** 
   * Тип функции валидации для проверки данных
   * @see {@link ValidationFunction}
   */
  ValidationFunction,
  
  /** 
   * Тип функции трансформации данных
   * @see {@link TransformFunction}
   */
  TransformFunction,
  
  /** 
   * Тип функции фильтрации данных
   * @see {@link FilterFunction}
   */
  FilterFunction,
  
  /** 
   * Параметры для создания результата генерации
   * @see {@link CreateGenerationResultParams}
   */
  CreateGenerationResultParams,
  
  /** 
   * Параметры для создания ошибки генерации
   * @see {@link CreateGenerationErrorParams}
   */
  CreateGenerationErrorParams
} from './types';

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ УТИЛИТАРНЫЕ ТИПЫ
// ============================================================================

/**
 * Расширенные утилитарные типы для специализированных задач
 * 
 * @group Advanced Utilities
 */
export type {
  /** 
   * Тип функции проверки узлов бота
   * @see {@link NodeCheckFunction}
   */
  NodeCheckFunction,
  
  /** 
   * Тип функции форматирования текста
   * @see {@link TextFormatterFunction}
   */
  TextFormatterFunction,
  
  /** 
   * Тип функции генерации уникальных ID
   * @see {@link IdGeneratorFunction}
   */
  IdGeneratorFunction,
  
  /** 
   * Конфигурация для утилитарных функций
   * @see {@link UtilityConfig}
   */
  UtilityConfig,
  
  /** 
   * Результат валидации с детальной информацией
   * @see {@link ValidationResult}
   */
  ValidationResult,
  
  /** 
   * Параметры для настройки валидации
   * @see {@link ValidationParams}
   */
  ValidationParams,
  
  /** 
   * Конфигурация для экспорта данных
   * @see {@link ExportConfig}
   */
  ExportConfig,
  
  /** 
   * Поддерживаемые версии Python
   * @see {@link SupportedPythonVersion}
   */
  SupportedPythonVersion,
  
  /** 
   * Поддерживаемые типы узлов бота
   * @see {@link SupportedNodeType}
   */
  SupportedNodeType
} from './types';

// ============================================================================
// ПЕРЕЧИСЛЕНИЯ И КОНСТАНТЫ
// ============================================================================

/**
 * Перечисления для типизации ошибок и системных констант
 * 
 * @group Enums & Constants
 */
export { 
  /** 
   * Перечисление типов ошибок генерации
   * @see {@link GenerationErrorType}
   */
  GenerationErrorType 
} from './types';

// ============================================================================
// ФАБРИЧНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Фабричные функции для создания объектов системы генерации
 * 
 * @group Factory Functions
 * @example
 * ```typescript
 * import { GenerationFactory } from '@/lib/Core';
 * 
 * // Создание успешного результата
 * const result = GenerationFactory.createSuccessResult(
 *   generatedCode, 
 *   metadata, 
 *   warnings
 * );
 * 
 * // Создание ошибки
 * const error = GenerationFactory.createGenerationError({
 *   type: GenerationErrorType.VALIDATION_ERROR,
 *   message: 'Invalid input data',
 *   module: 'ImportsGenerator'
 * });
 * ```
 */
export { 
  /** 
   * Фабрика для создания объектов генерации
   * @see {@link GenerationFactory}
   */
  GenerationFactory 
} from './types';

// ============================================================================
// ОСНОВНЫЕ КЛАССЫ
// ============================================================================

/**
 * Основные классы для работы с контекстом и генерацией кода
 * 
 * @group Core Classes
 * @example
 * ```typescript
 * import { 
 *   GenerationContextBuilder, 
 *   CodeGenerator 
 * } from '@/lib/Core';
 * 
 * // Создание контекста
 * const context = new GenerationContextBuilder()
 *   .setBotData(botData)
 *   .setBotName('MyBot')
 *   .setUserDatabaseEnabled(true)
 *   .build();
 * 
 * // Генерация кода
 * const generator = new CodeGenerator();
 * const result = await generator.generate(context);
 * ```
 */
export { 
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
} from './GenerationContext';

/**
 * Основной генератор кода и его фабрика
 * 
 * @group Code Generation
 */
export { 
  /** 
   * Основной класс генератора кода
   * @see {@link CodeGenerator}
   */
  CodeGenerator, 
  
  /** 
   * Фабрика для создания генератора кода
   * @see {@link CodeGeneratorFactory}
   */
  CodeGeneratorFactory 
} from './CodeGenerator';

// ============================================================================
// СИСТЕМНЫЕ КОНСТАНТЫ
// ============================================================================

/**
 * Системные константы и ограничения
 * 
 * @group System Constants
 */
export { 
  /** 
   * Системные константы для ограничений и конфигурации
   * @see {@link SystemConstants}
   */
  SystemConstants 
} from './types';

// ============================================================================
// ИНФОРМАЦИЯ О МОДУЛЕ
// ============================================================================

/**
 * Информация о версии и возможностях Core модуля
 * 
 * @constant
 * @readonly
 */
export const CORE_MODULE_INFO = {
  /** Версия модуля */
  version: '2.0.0',
  /** Название модуля */
  name: 'Core',
  /** Описание модуля */
  description: 'Основные компоненты системы генерации кода',
  /** Поддерживаемые возможности */
  features: [
    'Типизированные интерфейсы',
    'Контекст генерации',
    'Фабричные функции',
    'Обработка ошибок',
    'Валидация данных'
  ],
  /** Зависимости */
  dependencies: ['shared/schema'],
  /** Экспортируемые типы */
  exports: {
    types: 25,
    interfaces: 12,
    enums: 1,
    classes: 4,
    factories: 3
  }
} as const;