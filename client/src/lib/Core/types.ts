/**
 * Типы и интерфейсы для системы генерации кода ботов
 */

import { BotData, Node, BotGroup } from '../../../../shared/schema';

/**
 * Строгие типы для различных компонентов системы
 */

/**
 * Тип для соединений между узлами
 */
export interface NodeConnection {
  /** ID исходного узла */
  source: string;
  /** ID целевого узла */
  target: string;
  /** Тип соединения */
  type?: string;
  /** Дополнительные данные соединения */
  data?: Record<string, unknown>;
}

/**
 * Тип для карты медиа переменных
 */
export interface MediaVariable {
  /** Тип медиа */
  type: 'photo' | 'video' | 'audio' | 'document' | 'sticker' | 'voice' | 'animation';
  /** URL или путь к файлу */
  url: string;
  /** Дополнительные метаданные */
  metadata?: Record<string, unknown>;
}

/**
 * Строгий тип для карты медиа переменных
 */
export type MediaVariablesMap = Map<string, MediaVariable>;

/**
 * Параметры для создания контекста генерации
 */
export interface CreateGenerationContextParams {
  botData: BotData;
  botName: string;
  groups: BotGroup[];
  userDatabaseEnabled: boolean;
  projectId: number | null;
  enableLogging: boolean;
}

/**
 * Конфигурация для различных типов генераторов
 */
export interface GeneratorConfig {
  /** Включить отладочную информацию */
  enableDebug?: boolean;
  /** Использовать минифицированный вывод */
  minified?: boolean;
  /** Дополнительные опции */
  options?: Record<string, unknown>;
}

/**
 * Контекст генерации кода - содержит все необходимые данные для генерации
 */
export interface GenerationContext {
  /** Основные данные бота */
  readonly botData: BotData;
  /** Имя бота */
  readonly botName: string;
  /** Группы бота */
  readonly groups: readonly BotGroup[];
  /** Включена ли база данных пользователей */
  readonly userDatabaseEnabled: boolean;
  /** ID проекта */
  readonly projectId: number | null;
  /** Включено ли логирование */
  readonly enableLogging: boolean;
  /** Узлы бота */
  readonly nodes: readonly Node[];
  /** Соединения между узлами */
  readonly connections: readonly NodeConnection[];
  /** Карта медиа переменных */
  readonly mediaVariablesMap: MediaVariablesMap;
  /** Все ID узлов */
  readonly allNodeIds: readonly string[];
}

/**
 * Опции для генерации кода
 */
export interface GenerationOptions {
  /** Имя бота */
  readonly botName: string;
  /** Группы бота */
  readonly groups: readonly BotGroup[];
  /** Включена ли база данных пользователей */
  readonly userDatabaseEnabled: boolean;
  /** ID проекта */
  readonly projectId: number | null;
  /** Включено ли логирование */
  readonly enableLogging: boolean;
  /** Переопределения шаблонов */
  readonly templateOverrides?: Readonly<Record<string, string>>;
  /** Конфигурация генератора */
  readonly generatorConfig?: Readonly<GeneratorConfig>;
}

/**
 * Метаданные результата генерации
 */
export interface GenerationMetadata {
  /** Количество сгенерированных строк */
  readonly linesGenerated: number;
  /** Количество обработчиков */
  readonly handlersCount: number;
  /** Количество обработанных узлов */
  readonly nodesProcessed: number;
  /** Время генерации в миллисекундах */
  readonly generationTimeMs?: number;
  /** Размер сгенерированного кода в байтах */
  readonly codeSizeBytes?: number;
  /** Дополнительная статистика */
  readonly additionalStats?: Readonly<Record<string, number>>;
}

/**
 * Результат генерации кода
 */
export interface GenerationResult {
  /** Успешность генерации */
  readonly success: boolean;
  /** Сгенерированный код */
  readonly code?: string;
  /** Ошибки генерации */
  readonly errors?: readonly string[];
  /** Предупреждения */
  readonly warnings?: readonly string[];
  /** Метаданные генерации */
  readonly metadata?: GenerationMetadata;
}

/**
 * Типы ошибок генерации
 */
export enum GenerationErrorType {
  VALIDATION_ERROR = 'validation_error',
  TEMPLATE_ERROR = 'template_error',
  HANDLER_GENERATION_ERROR = 'handler_generation_error',
  IMPORT_ERROR = 'import_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Ошибка генерации
 */
export interface GenerationError {
  /** Тип ошибки */
  readonly type: GenerationErrorType;
  /** Сообщение об ошибке */
  readonly message: string;
  /** Модуль, в котором произошла ошибка */
  readonly module: string;
  /** Дополнительный контекст ошибки */
  readonly context?: Readonly<Record<string, unknown>>;
  /** Временная метка ошибки */
  readonly timestamp?: Date;
  /** Стек вызовов */
  readonly stack?: string;
}

/**
 * Типы обработчиков для различных узлов
 */
export type HandlerType = 
  | 'message'
  | 'callback'
  | 'multiselect'
  | 'media'
  | 'command'
  | 'start'
  | 'group'
  | 'admin'
  | 'synonym';

/**
 * Типы шаблонов
 */
export type TemplateType =
  | 'encoding'
  | 'imports'
  | 'bot_init'
  | 'main_function'
  | 'handler'
  | 'save_message'
  | 'middleware'
  | 'safe_edit_or_send';

/**
 * Параметры для генерации обработчиков
 */
export interface HandlerGenerationParams {
  /** Контекст генерации */
  readonly context: GenerationContext;
  /** Тип обработчика */
  readonly handlerType: HandlerType;
  /** Дополнительные опции */
  readonly options?: Readonly<Record<string, unknown>>;
}

/**
 * Результат генерации обработчика
 */
export interface HandlerGenerationResult {
  /** Сгенерированный код */
  readonly code: string;
  /** Количество созданных обработчиков */
  readonly handlersCount: number;
  /** Предупреждения */
  readonly warnings?: readonly string[];
}

/**
 * Интерфейс для генератора импортов
 */
export interface IImportsGenerator {
  /**
   * Генерирует импорты для Python файла
   * @param context Контекст генерации
   * @returns Сгенерированный код импортов
   */
  generateImports(context: GenerationContext): string;
  
  /**
   * Генерирует настройку кодировки
   * @returns Код настройки кодировки UTF-8
   */
  generateEncodingSetup(): string;
  
  /**
   * Генерирует команды для BotFather
   * @param nodes Узлы бота
   * @returns Код команд для BotFather
   */
  generateBotFatherCommands(nodes: readonly Node[]): string;
}

/**
 * Интерфейс для генератора базового Python кода
 */
export interface IPythonCodeGenerator {
  /**
   * Генерирует инициализацию бота
   * @param context Контекст генерации
   * @returns Код инициализации бота
   */
  generateBotInitialization(context: GenerationContext): string;
  
  /**
   * Генерирует глобальные переменные
   * @param context Контекст генерации
   * @returns Код глобальных переменных
   */
  generateGlobalVariables(context: GenerationContext): string;
  
  /**
   * Генерирует вспомогательные функции
   * @param context Контекст генерации
   * @returns Код вспомогательных функций
   */
  generateUtilityFunctions(context: GenerationContext): string;
  
  /**
   * Генерирует конфигурацию групп
   * @param context Контекст генерации
   * @returns Код конфигурации групп
   */
  generateGroupsConfiguration(context: GenerationContext): string;
}

/**
 * Интерфейс для генератора обработчиков
 */
export interface IHandlerGenerator {
  /**
   * Генерирует обработчики сообщений
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков сообщений
   */
  generateMessageHandlers(context: GenerationContext): HandlerGenerationResult;
  
  /**
   * Генерирует обработчики callback'ов
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков callback'ов
   */
  generateCallbackHandlers(context: GenerationContext): HandlerGenerationResult;
  
  /**
   * Генерирует обработчики множественного выбора
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков множественного выбора
   */
  generateMultiSelectHandlers(context: GenerationContext): HandlerGenerationResult;
  
  /**
   * Генерирует обработчики медиа
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков медиа
   */
  generateMediaHandlers(context: GenerationContext): HandlerGenerationResult;
  
  /**
   * Генерирует обработчики для групп
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков групп
   */
  generateGroupHandlers(context: GenerationContext): HandlerGenerationResult;
}

/**
 * Интерфейс для генератора основного цикла
 */
export interface IMainLoopGenerator {
  /**
   * Генерирует основную функцию main()
   * @param context Контекст генерации
   * @returns Код основной функции
   */
  generateMainFunction(context: GenerationContext): string;
  
  /**
   * Генерирует код запуска бота
   * @param context Контекст генерации
   * @returns Код запуска бота
   */
  generateBotStartup(context: GenerationContext): string;
  
  /**
   * Генерирует код остановки бота
   * @param context Контекст генерации
   * @returns Код остановки бота
   */
  generateBotShutdown(context: GenerationContext): string;
  
  /**
   * Генерирует точку входа в программу
   * @returns Код точки входа
   */
  generateEntryPoint(): string;
}

/**
 * Интерфейс для основного генератора кода
 */
export interface ICodeGenerator {
  /**
   * Генерирует полный код бота
   * @param context Контекст генерации
   * @returns Результат генерации
   */
  generate(context: GenerationContext): GenerationResult;
}

/**
 * Интерфейс для системы шаблонов Python
 */
export interface IPythonTemplates {
  /**
   * Получить шаблон настройки кодировки UTF-8
   * @returns Шаблон кодировки
   */
  getEncodingTemplate(): string;
  
  /**
   * Получить шаблон базовых импортов
   * @returns Шаблон импортов
   */
  getImportsTemplate(): string;
  
  /**
   * Получить шаблон инициализации бота
   * @returns Шаблон инициализации
   */
  getBotInitTemplate(): string;
  
  /**
   * Получить шаблон основной функции main()
   * @returns Шаблон функции main
   */
  getMainFunctionTemplate(): string;
  
  /**
   * Получить шаблон обработчика по типу
   * @param handlerType Тип обработчика
   * @returns Шаблон обработчика
   */
  getHandlerTemplate(handlerType: HandlerType): string;
  
  /**
   * Получить шаблон функции сохранения сообщений
   * @returns Шаблон функции сохранения
   */
  getSaveMessageTemplate(): string;
  
  /**
   * Получить шаблон middleware для логирования
   * @returns Шаблон middleware
   */
  getMiddlewareTemplate(): string;
  
  /**
   * Получить шаблон safe_edit_or_send функции
   * @returns Шаблон функции safe_edit_or_send
   */
  getSafeEditOrSendTemplate(): string;
}

/**
 * Интерфейс для шаблонов структуры бота
 */
export interface IBotStructureTemplate {
  /**
   * Получить полную структуру простого бота
   * @param context Контекст генерации
   * @returns Структура простого бота
   */
  getSimpleBotStructure(context: GenerationContext): string;
  
  /**
   * Получить структуру бота с базой данных
   * @param context Контекст генерации
   * @returns Структура бота с БД
   */
  getDatabaseBotStructure(context: GenerationContext): string;
  
  /**
   * Получить структуру бота с админ-панелью
   * @param context Контекст генерации
   * @returns Структура админ-бота
   */
  getAdminBotStructure(context: GenerationContext): string;
  
  /**
   * Получить структуру бота с медиа-обработкой
   * @param context Контекст генерации
   * @returns Структура медиа-бота
   */
  getMediaBotStructure(context: GenerationContext): string;
  
  /**
   * Получить структуру бота с множественным выбором
   * @param context Контекст генерации
   * @returns Структура бота с множественным выбором
   */
  getMultiSelectBotStructure(context: GenerationContext): string;
  
  /**
   * Получить шаблон регистрации middleware
   * @param enableDatabase Включить поддержку БД
   * @returns Шаблон регистрации middleware
   */
  getMiddlewareRegistrationTemplate(enableDatabase: boolean): string;
  
  /**
   * Получить шаблон регистрации обработчиков
   * @returns Шаблон регистрации обработчиков
   */
  getHandlerRegistrationTemplate(): string;
}
/**
 * 
Утилитарные типы для работы с генераторами
 */

/**
 * Тип для функций валидации
 */
export type ValidationFunction<T> = (value: T) => boolean;

/**
 * Тип для функций трансформации
 */
export type TransformFunction<T, U> = (value: T) => U;

/**
 * Тип для функций фильтрации
 */
export type FilterFunction<T> = (value: T) => boolean;

/**
 * Параметры для создания результата генерации
 */
export interface CreateGenerationResultParams {
  readonly success: boolean;
  readonly code?: string;
  readonly errors?: readonly string[];
  readonly warnings?: readonly string[];
  readonly metadata?: GenerationMetadata;
}

/**
 * Параметры для создания ошибки генерации
 */
export interface CreateGenerationErrorParams {
  readonly type: GenerationErrorType;
  readonly message: string;
  readonly module: string;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly stack?: string;
}

/**
 * Фабричные функции для создания объектов
 */
export namespace GenerationFactory {
  /**
   * Создает результат успешной генерации
   */
  export function createSuccessResult(
    code: string,
    metadata?: GenerationMetadata,
    warnings?: readonly string[]
  ): GenerationResult {
    return {
      success: true,
      code,
      metadata,
      warnings
    };
  }

  /**
   * Создает результат неуспешной генерации
   */
  export function createErrorResult(
    errors: readonly string[],
    warnings?: readonly string[]
  ): GenerationResult {
    return {
      success: false,
      errors,
      warnings
    };
  }

  /**
   * Создает ошибку генерации
   */
  export function createGenerationError(
    params: CreateGenerationErrorParams
  ): GenerationError {
    return {
      ...params,
      timestamp: new Date()
    };
  }

  /**
   * Создает контекст генерации
   */
  export function createGenerationContext(
    params: CreateGenerationContextParams
  ): GenerationContext {
    const { nodes, connections } = extractNodesAndConnections(params.botData);
    
    return {
      ...params,
      nodes,
      connections: connections as NodeConnection[],
      mediaVariablesMap: new Map(),
      allNodeIds: nodes.map(node => node.id)
    };
  }
}

/**
 * Импорт функции extractNodesAndConnections (будет определена в format модуле)
 */
declare function extractNodesAndConnections(botData: BotData): {
  nodes: Node[];
  connections: unknown[];
};
/**

 * Дополнительные утилитарные типы для разработчиков
 */

/**
 * Тип для функций проверки узлов
 */
export type NodeCheckFunction = (nodes: readonly Node[]) => boolean;

/**
 * Тип для функций форматирования текста
 */
export type TextFormatterFunction = (text: string) => string;

/**
 * Тип для функций генерации ID
 */
export type IdGeneratorFunction = (nodeId: string, allNodeIds: readonly string[]) => string;

/**
 * Конфигурация для различных утилитарных функций
 */
export interface UtilityConfig {
  /** Включить отладочный режим */
  readonly debug?: boolean;
  /** Максимальная длина генерируемых ID */
  readonly maxIdLength?: number;
  /** Префикс для генерируемых ID */
  readonly idPrefix?: string;
  /** Дополнительные опции */
  readonly options?: Readonly<Record<string, unknown>>;
}

/**
 * Результат валидации
 */
export interface ValidationResult {
  /** Успешность валидации */
  readonly isValid: boolean;
  /** Список ошибок валидации */
  readonly errors: readonly string[];
  /** Предупреждения */
  readonly warnings?: readonly string[];
  /** Дополнительная информация */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Параметры для валидации
 */
export interface ValidationParams {
  /** Строгий режим валидации */
  readonly strict?: boolean;
  /** Пропустить предупреждения */
  readonly skipWarnings?: boolean;
  /** Дополнительные правила валидации */
  readonly customRules?: readonly ValidationFunction<unknown>[];
}

/**
 * Тип для конфигурации экспорта
 */
export interface ExportConfig {
  /** Формат экспорта */
  readonly format: 'typescript' | 'javascript' | 'json';
  /** Включить типы в экспорт */
  readonly includeTypes?: boolean;
  /** Включить JSDoc комментарии */
  readonly includeJSDoc?: boolean;
  /** Минифицировать вывод */
  readonly minify?: boolean;
}

/**
 * Namespace для констант системы
 */
export namespace SystemConstants {
  /** Максимальный размер генерируемого кода в байтах */
  export const MAX_CODE_SIZE = 10 * 1024 * 1024; // 10MB
  
  /** Максимальное количество узлов в боте */
  export const MAX_NODES_COUNT = 1000;
  
  /** Максимальная глубина вложенности */
  export const MAX_NESTING_DEPTH = 10;
  
  /** Поддерживаемые версии Python */
  export const SUPPORTED_PYTHON_VERSIONS = ['3.8', '3.9', '3.10', '3.11', '3.12'] as const;
  
  /** Поддерживаемые типы узлов */
  export const SUPPORTED_NODE_TYPES = [
    'start', 'command', 'message', 'callback', 'input', 'media',
    'sticker', 'voice', 'animation', 'location', 'contact', 'photo',
    'ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user',
    'promote_user', 'demote_user'
  ] as const;
}

/**
 * Тип для поддерживаемых версий Python
 */
export type SupportedPythonVersion = typeof SystemConstants.SUPPORTED_PYTHON_VERSIONS[number];

/**
 * Тип для поддерживаемых типов узлов
 */
export type SupportedNodeType = typeof SystemConstants.SUPPORTED_NODE_TYPES[number];