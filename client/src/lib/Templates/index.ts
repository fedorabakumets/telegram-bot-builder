/**
 * Templates Module - Система шаблонов для генерации кода ботов
 * 
 * Экспортирует все шаблоны, интерфейсы и утилиты для работы с шаблонами.
 * Предоставляет переиспользуемые компоненты для генерации Python кода Telegram ботов.
 * 
 * @example
 * ```typescript
 * import { 
 *   pythonTemplates, 
 *   botStructureTemplate,
 *   templates,
 *   TemplateUtils 
 * } from '@/lib/Templates';
 * 
 * // Использование шаблонов Python
 * const encoding = pythonTemplates.getEncodingTemplate();
 * const imports = pythonTemplates.getImportsTemplate();
 * const mainFunc = pythonTemplates.getMainFunctionTemplate();
 * 
 * // Использование шаблонов структуры
 * const simpleBot = botStructureTemplate.getSimpleBotStructure(context);
 * const dbBot = botStructureTemplate.getDatabaseBotStructure(context);
 * 
 * // Работа с плейсхолдерами
 * const processed = TemplateUtils.replacePlaceholders(
 *   template, 
 *   { botName: 'MyBot', token: 'BOT_TOKEN' }
 * );
 * ```
 * 
 * @module Templates
 * @version 2.0.0
 * @since 2.0.0
 */

// ============================================================================
// ОСНОВНЫЕ ШАБЛОНЫ
// ============================================================================

/**
 * Классы шаблонов для генерации различных частей Python кода
 * 
 * @group Template Classes
 */
export {
  /** 
   * Класс для работы с шаблонами Python кода
   * 
   * Предоставляет шаблоны для:
   * - Настройки кодировки UTF-8
   * - Импортов библиотек
   * - Инициализации бота
   * - Основной функции main()
   * - Различных типов обработчиков
   * - Вспомогательных функций
   * 
   * Поддерживает кэширование для повышения производительности.
   * 
   * @see {@link IPythonTemplates}
   */
  PythonTemplates,
  
  /** 
   * Глобальный экземпляр шаблонов Python
   * 
   * Готовый к использованию экземпляр класса PythonTemplates
   * с предварительно настроенным кэшированием.
   * 
   * @example
   * ```typescript
   * import { pythonTemplates } from '@/lib/Templates';
   * 
   * const encoding = pythonTemplates.getEncodingTemplate();
   * const imports = pythonTemplates.getImportsTemplate();
   * ```
   */
  pythonTemplates
} from './PythonTemplates';

export {
  /** 
   * Класс для работы с шаблонами структуры бота
   * 
   * Предоставляет шаблоны для:
   * - Простых ботов
   * - Ботов с базой данных
   * - Ботов с админ-панелью
   * - Ботов с медиа-обработкой
   * - Ботов с множественным выбором
   * - Регистрации middleware и обработчиков
   * 
   * @see {@link IBotStructureTemplate}
   */
  BotStructureTemplate,
  
  /** 
   * Глобальный экземпляр шаблонов структуры бота
   * 
   * Готовый к использованию экземпляр класса BotStructureTemplate
   * для быстрого создания различных архитектур ботов.
   * 
   * @example
   * ```typescript
   * import { botStructureTemplate } from '@/lib/Templates';
   * 
   * const simpleBot = botStructureTemplate.getSimpleBotStructure(context);
   * const dbBot = botStructureTemplate.getDatabaseBotStructure(context);
   * ```
   */
  botStructureTemplate
} from './BotStructureTemplate';

// ============================================================================
// ИНТЕРФЕЙСЫ ШАБЛОНОВ
// ============================================================================

/**
 * Интерфейсы для типизации шаблонов
 * 
 * @group Template Interfaces
 */
export type {
  /** 
   * Интерфейс для системы шаблонов Python кода
   * 
   * Определяет методы для получения различных шаблонов:
   * - getEncodingTemplate() - настройка UTF-8 кодировки
   * - getImportsTemplate() - базовые импорты
   * - getBotInitTemplate() - инициализация бота
   * - getMainFunctionTemplate() - основная функция main()
   * - getHandlerTemplate() - шаблоны обработчиков по типу
   * - getSaveMessageTemplate() - функция сохранения сообщений
   * - getMiddlewareTemplate() - middleware для логирования
   * - getSafeEditOrSendTemplate() - безопасное редактирование сообщений
   * - getUtilityFunctionsTemplate() - вспомогательные функции
   * 
   * @interface
   */
  IPythonTemplates
} from './PythonTemplates';

export type {
  /** 
   * Интерфейс для шаблонов структуры бота
   * 
   * Определяет методы для получения различных архитектур ботов:
   * - getSimpleBotStructure() - простой бот
   * - getDatabaseBotStructure() - бот с базой данных
   * - getAdminBotStructure() - бот с админ-панелью
   * - getMediaBotStructure() - бот с медиа-обработкой
   * - getMultiSelectBotStructure() - бот с множественным выбором
   * - getMiddlewareRegistrationTemplate() - регистрация middleware
   * - getHandlerRegistrationTemplate() - регистрация обработчиков
   * - getGlobalVariablesTemplate() - глобальные переменные
   * 
   * @interface
   */
  IBotStructureTemplate
} from './BotStructureTemplate';

// ============================================================================
// ТИПЫ ИЗ CORE ДЛЯ УДОБСТВА
// ============================================================================

/**
 * Основные типы из Core модуля для работы с шаблонами
 * 
 * @group Core Types
 */
export type {
  /** 
   * Контекст генерации для передачи в шаблоны
   * 
   * Содержит все необходимые данные для генерации кода:
   * - Данные бота и узлы
   * - Настройки и конфигурацию
   * - Медиа переменные
   * 
   * @readonly
   */
  GenerationContext,
  
  /** 
   * Тип обработчика для шаблонов
   * 
   * Определяет, какой тип обработчика нужно сгенерировать:
   * - 'message' - текстовые сообщения
   * - 'callback' - callback кнопки
   * - 'multiselect' - множественный выбор
   * - 'media' - медиа файлы
   * - 'command' - команды
   * - 'start' - команда /start
   * - 'group' - групповые чаты
   * - 'admin' - админ функции
   * - 'synonym' - синонимы
   */
  HandlerType,
  
  /** 
   * Тип шаблона для категоризации
   * 
   * Определяет категорию шаблона:
   * - 'encoding' - кодировка
   * - 'imports' - импорты
   * - 'bot_init' - инициализация
   * - 'main_function' - основная функция
   * - 'handler' - обработчики
   * - 'save_message' - сохранение сообщений
   * - 'middleware' - middleware
   * - 'safe_edit_or_send' - безопасное редактирование
   */
  TemplateType
} from '../Core/types';

// ============================================================================
// ОБЪЕКТ ДЛЯ УДОБНОГО ДОСТУПА
// ============================================================================

// Импорты для создания объекта templates
import { pythonTemplates } from './PythonTemplates';
import { botStructureTemplate } from './BotStructureTemplate';

/**
 * Объект для удобного доступа ко всем шаблонам
 * 
 * Предоставляет централизованный доступ ко всем типам шаблонов
 * через единый интерфейс.
 * 
 * @example
 * ```typescript
 * import { templates } from '@/lib/Templates';
 * 
 * // Доступ к шаблонам Python
 * const encoding = templates.python.getEncodingTemplate();
 * const imports = templates.python.getImportsTemplate();
 * 
 * // Доступ к шаблонам структуры
 * const simpleBot = templates.structure.getSimpleBotStructure(context);
 * const dbBot = templates.structure.getDatabaseBotStructure(context);
 * ```
 * 
 * @constant
 * @readonly
 */
export const templates = {
  /** 
   * Шаблоны Python кода
   * @see {@link pythonTemplates}
   */
  python: pythonTemplates,
  
  /** 
   * Шаблоны структуры бота
   * @see {@link botStructureTemplate}
   */
  structure: botStructureTemplate
} as const;

// ============================================================================
// УТИЛИТАРНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Утилитарные функции для работы с шаблонами
 * 
 * Предоставляет набор полезных функций для обработки шаблонов,
 * работы с плейсхолдерами, валидации и управления кэшем.
 * 
 * @group Template Utilities
 * @example
 * ```typescript
 * import { TemplateUtils } from '@/lib/Templates';
 * 
 * // Замена плейсхолдеров
 * const result = TemplateUtils.replacePlaceholders(
 *   'Hello {name}! Your bot {botName} is ready.',
 *   { name: 'John', botName: 'MyBot' }
 * );
 * 
 * // Валидация шаблона
 * const isValid = TemplateUtils.isValidTemplate(template);
 * 
 * // Извлечение плейсхолдеров
 * const placeholders = TemplateUtils.extractPlaceholders(template);
 * 
 * // Управление кэшем
 * TemplateUtils.clearAllCaches();
 * const cacheInfo = TemplateUtils.getCacheInfo();
 * ```
 */
export class TemplateUtils {
  /**
   * Заменить плейсхолдеры в шаблоне
   * 
   * Заменяет все плейсхолдеры в формате {placeholder} на соответствующие значения
   * из объекта replacements. Поддерживает множественные замены и вложенные плейсхолдеры.
   * 
   * @param template Шаблон с плейсхолдерами в формате {placeholder}
   * @param replacements Объект с заменами, где ключ - имя плейсхолдера, значение - замена
   * @returns Шаблон с замененными плейсхолдерами
   * 
   * @example
   * ```typescript
   * const template = 'Hello {name}! Welcome to {app}.';
   * const result = TemplateUtils.replacePlaceholders(template, {
   *   name: 'John',
   *   app: 'Bot Generator'
   * });
   * // Результат: 'Hello John! Welcome to Bot Generator.'
   * ```
   */
  static replacePlaceholders(template: string, replacements: Readonly<Record<string, string>>): string {
    let result = template;
    
    for (const [placeholder, replacement] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
      result = result.replace(regex, replacement);
    }
    
    return result;
  }
  
  /**
   * Очистить все кэши шаблонов
   * 
   * Очищает кэши всех экземпляров шаблонов для освобождения памяти
   * или принудительного обновления шаблонов.
   * 
   * @example
   * ```typescript
   * // Очистка всех кэшей
   * TemplateUtils.clearAllCaches();
   * ```
   */
  static clearAllCaches(): void {
    pythonTemplates.clearCache();
  }
  
  /**
   * Получить информацию о размерах кэшей
   * 
   * Возвращает статистику по размерам кэшей различных типов шаблонов
   * для мониторинга использования памяти.
   * 
   * @returns Объект с размерами кэшей
   * 
   * @example
   * ```typescript
   * const cacheInfo = TemplateUtils.getCacheInfo();
   * console.log(`Python templates cache size: ${cacheInfo.python}`);
   * ```
   */
  static getCacheInfo(): Readonly<{ python: number }> {
    return {
      python: pythonTemplates.getCacheSize()
    };
  }
  
  /**
   * Валидировать шаблон на наличие обязательных плейсхолдеров
   * 
   * Проверяет, содержит ли шаблон все необходимые плейсхолдеры
   * из списка обязательных. Возвращает список отсутствующих плейсхолдеров.
   * 
   * @param template Шаблон для проверки
   * @param requiredPlaceholders Список обязательных плейсхолдеров
   * @returns Список отсутствующих плейсхолдеров
   * 
   * @example
   * ```typescript
   * const template = 'Hello {name}!';
   * const required = ['name', 'age'];
   * const missing = TemplateUtils.validateTemplate(template, required);
   * // Результат: ['age']
   * ```
   */
  static validateTemplate(template: string, requiredPlaceholders: readonly string[]): string[] {
    const missing: string[] = [];
    
    for (const placeholder of requiredPlaceholders) {
      const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
      if (!regex.test(template)) {
        missing.push(placeholder);
      }
    }
    
    return missing;
  }
  
  /**
   * Извлечь все плейсхолдеры из шаблона
   * 
   * Анализирует шаблон и возвращает список всех найденных плейсхолдеров
   * в формате {placeholder}. Полезно для автоматического определения
   * необходимых параметров для шаблона.
   * 
   * @param template Шаблон для анализа
   * @returns Список найденных плейсхолдеров
   * 
   * @example
   * ```typescript
   * const template = 'Hello {name}! Your {type} bot {botName} is ready.';
   * const placeholders = TemplateUtils.extractPlaceholders(template);
   * // Результат: ['name', 'type', 'botName']
   * ```
   */
  static extractPlaceholders(template: string): string[] {
    const regex = /\{([^}]+)\}/g;
    const placeholders: string[] = [];
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }
    
    return placeholders;
  }
  
  /**
   * Проверить, является ли строка валидным шаблоном
   * 
   * Валидирует синтаксис шаблона, проверяя корректность плейсхолдеров
   * и отсутствие синтаксических ошибок.
   * 
   * @param template Строка для проверки
   * @returns true, если шаблон валиден
   * 
   * @example
   * ```typescript
   * const validTemplate = 'Hello {name}!';
   * const invalidTemplate = 'Hello {invalid-name}!';
   * 
   * console.log(TemplateUtils.isValidTemplate(validTemplate)); // true
   * console.log(TemplateUtils.isValidTemplate(invalidTemplate)); // false
   * ```
   */
  static isValidTemplate(template: string): boolean {
    try {
      // Проверяем на корректность синтаксиса плейсхолдеров
      const regex = /\{([^}]+)\}/g;
      let match;
      
      while ((match = regex.exec(template)) !== null) {
        // Проверяем, что плейсхолдер не пустой и содержит только допустимые символы
        const placeholder = match[1];
        if (!placeholder || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(placeholder)) {
          return false;
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Создать шаблон из строки с автоматическим определением плейсхолдеров
   * 
   * Анализирует строку и создает объект шаблона с информацией о плейсхолдерах
   * и методами для работы с ним.
   * 
   * @param templateString Исходная строка шаблона
   * @returns Объект шаблона с метаданными
   * 
   * @example
   * ```typescript
   * const templateObj = TemplateUtils.createTemplate('Hello {name}! Age: {age}');
   * console.log(templateObj.placeholders); // ['name', 'age']
   * console.log(templateObj.isValid); // true
   * ```
   */
  static createTemplate(templateString: string): {
    readonly template: string;
    readonly placeholders: readonly string[];
    readonly isValid: boolean;
    readonly requiredCount: number;
    render: (replacements: Record<string, string>) => string;
  } {
    const placeholders = this.extractPlaceholders(templateString);
    const isValid = this.isValidTemplate(templateString);
    
    return {
      template: templateString,
      placeholders,
      isValid,
      requiredCount: placeholders.length,
      render: (replacements: Record<string, string>) => 
        this.replacePlaceholders(templateString, replacements)
    };
  }
}

// ============================================================================
// ИНФОРМАЦИЯ О МОДУЛЕ
// ============================================================================

/**
 * Информация о версии и возможностях Templates модуля
 * 
 * @constant
 * @readonly
 */
export const TEMPLATES_MODULE_INFO = {
  /** Версия модуля */
  version: '2.0.0',
  /** Название модуля */
  name: 'Templates',
  /** Описание модуля */
  description: 'Система шаблонов для генерации кода Telegram ботов',
  /** Поддерживаемые типы шаблонов */
  templateTypes: [
    'PythonTemplates - шаблоны Python кода',
    'BotStructureTemplate - шаблоны архитектуры ботов'
  ],
  /** Поддерживаемые возможности */
  features: [
    'Кэширование шаблонов',
    'Плейсхолдеры и замены',
    'Валидация шаблонов',
    'Утилитарные функции',
    'Типобезопасность'
  ],
  /** Поддерживаемые архитектуры ботов */
  botArchitectures: [
    'Простые боты',
    'Боты с базой данных',
    'Боты с админ-панелью',
    'Боты с медиа-обработкой',
    'Боты с множественным выбором'
  ],
  /** Зависимости */
  dependencies: ['Core'],
  /** Статистика экспорта */
  exports: {
    classes: 3,
    interfaces: 2,
    types: 3,
    utilities: 1,
    instances: 3
  }
} as const;