/**
 * Типы и интерфейсы для системы генерации кода ботов
 */

import { BotData, Node, BotGroup } from '../../../../shared/schema';

/**
 * Контекст генерации кода - содержит все необходимые данные для генерации
 */
export interface GenerationContext {
  /** Основные данные бота */
  botData: BotData;
  /** Имя бота */
  botName: string;
  /** Группы бота */
  groups: BotGroup[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** ID проекта */
  projectId: number | null;
  /** Включено ли логирование */
  enableLogging: boolean;
  /** Узлы бота */
  nodes: Node[];
  /** Соединения между узлами */
  connections: any[];
  /** Карта медиа переменных */
  mediaVariablesMap: Map<string, any>;
  /** Все ID узлов */
  allNodeIds: string[];
}

/**
 * Опции для генерации кода
 */
export interface GenerationOptions {
  /** Имя бота */
  botName: string;
  /** Группы бота */
  groups: BotGroup[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** ID проекта */
  projectId: number | null;
  /** Включено ли логирование */
  enableLogging: boolean;
  /** Переопределения шаблонов */
  templateOverrides?: Record<string, string>;
}

/**
 * Результат генерации кода
 */
export interface GenerationResult {
  /** Успешность генерации */
  success: boolean;
  /** Сгенерированный код */
  code?: string;
  /** Ошибки генерации */
  errors?: string[];
  /** Предупреждения */
  warnings?: string[];
  /** Метаданные генерации */
  metadata?: {
    /** Количество сгенерированных строк */
    linesGenerated: number;
    /** Количество обработчиков */
    handlersCount: number;
    /** Количество обработанных узлов */
    nodesProcessed: number;
  };
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
  type: GenerationErrorType;
  /** Сообщение об ошибке */
  message: string;
  /** Модуль, в котором произошла ошибка */
  module: string;
  /** Дополнительный контекст ошибки */
  context?: any;
}

/**
 * Интерфейс для генератора импортов
 */
export interface IImportsGenerator {
  /**
   * Генерирует импорты для Python файла
   */
  generateImports(context: GenerationContext): string;
  
  /**
   * Генерирует настройку кодировки
   */
  generateEncodingSetup(): string;
  
  /**
   * Генерирует команды для BotFather
   */
  generateBotFatherCommands(nodes: Node[]): string;
}

/**
 * Интерфейс для генератора базового Python кода
 */
export interface IPythonCodeGenerator {
  /**
   * Генерирует инициализацию бота
   */
  generateBotInitialization(context: GenerationContext): string;
  
  /**
   * Генерирует глобальные переменные
   */
  generateGlobalVariables(context: GenerationContext): string;
  
  /**
   * Генерирует вспомогательные функции
   */
  generateUtilityFunctions(context: GenerationContext): string;
}

/**
 * Интерфейс для генератора обработчиков
 */
export interface IHandlerGenerator {
  /**
   * Генерирует обработчики сообщений
   */
  generateMessageHandlers(context: GenerationContext): string;
  
  /**
   * Генерирует обработчики callback'ов
   */
  generateCallbackHandlers(context: GenerationContext): string;
  
  /**
   * Генерирует обработчики множественного выбора
   */
  generateMultiSelectHandlers(context: GenerationContext): string;
  
  /**
   * Генерирует обработчики медиа
   */
  generateMediaHandlers(context: GenerationContext): string;
}

/**
 * Интерфейс для генератора основного цикла
 */
export interface IMainLoopGenerator {
  /**
   * Генерирует основную функцию main()
   */
  generateMainFunction(context: GenerationContext): string;
  
  /**
   * Генерирует код запуска бота
   */
  generateBotStartup(context: GenerationContext): string;
  
  /**
   * Генерирует код остановки бота
   */
  generateBotShutdown(context: GenerationContext): string;
  
  /**
   * Генерирует точку входа в программу
   */
  generateEntryPoint(): string;
}

/**
 * Интерфейс для основного генератора кода
 */
export interface ICodeGenerator {
  /**
   * Генерирует полный код бота
   */
  generate(context: GenerationContext): GenerationResult;
}