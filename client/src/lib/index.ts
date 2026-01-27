/**
 * Основной индексный файл библиотеки генерации ботов
 * 
 * Экспортирует все компоненты системы генерации кода для Telegram ботов.
 * Поддерживает как новую модульную архитектуру, так и обратную совместимость
 * со старыми путями импорта.
 */

// ============================================================================
// ОСНОВНЫЕ КОМПОНЕНТЫ ГЕНЕРАТОРА
// ============================================================================

// Главная функция генерации и связанные утилиты
export * from './bot-generator';
export * from './commands';
export * from './queryClient';

// ============================================================================
// НОВАЯ МОДУЛЬНАЯ АРХИТЕКТУРА
// ============================================================================

// Основные модули новой архитектуры
export * from './Core';
export * from './Generators';
export * from './Templates';

// ============================================================================
// СУЩЕСТВУЮЩИЕ МОДУЛИ (LEGACY SUPPORT)
// ============================================================================

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

// Основные генераторы доступны напрямую для удобства импорта
export {
  ImportsGenerator,
  PythonCodeGenerator,
  HandlerGenerator,
  MainLoopGenerator
} from './Generators';

// Основные шаблоны доступны напрямую
export {
  PythonTemplates,
  pythonTemplates,
  BotStructureTemplate,
  botStructureTemplate,
  templates,
  TemplateUtils
} from './Templates';

// Core компоненты доступны напрямую
export {
  CodeGenerator,
  GenerationContextBuilder,
  GenerationContextFactory
} from './Core';

// ============================================================================
// ЭКСПОРТ ТИПОВ И ИНТЕРФЕЙСОВ
// ============================================================================

// Все типы и интерфейсы доступны для TypeScript разработки
export type {
  // Основные типы контекста и результатов
  GenerationContext,
  GenerationOptions,
  GenerationResult,
  GenerationError,
  GenerationErrorType,
  
  // Интерфейсы генераторов
  IImportsGenerator,
  IPythonCodeGenerator,
  IHandlerGenerator,
  IMainLoopGenerator,
  ICodeGenerator,
  
  // Интерфейсы шаблонов
  IPythonTemplates,
  IBotStructureTemplate
} from './Core/types';

// ============================================================================
// ОБРАТНАЯ СОВМЕСТИМОСТЬ
// ============================================================================

// Алиасы для обратной совместимости со старыми импортами
export type {
  GenerationContext as IGenerationContext
} from './Core/types';

// Экспорт основной функции генерации под старым именем для совместимости
export { generatePythonCode } from './bot-generator';

// ============================================================================
// УТИЛИТЫ ДЛЯ РАЗРАБОТЧИКОВ
// ============================================================================

/**
 * Информация о версии и архитектуре библиотеки
 */
export const LIB_INFO = {
  version: '2.0.0',
  architecture: 'modular',
  compatibility: 'backward-compatible',
  modules: {
    core: ['CodeGenerator', 'GenerationContext'],
    generators: ['ImportsGenerator', 'PythonCodeGenerator', 'HandlerGenerator', 'MainLoopGenerator'],
    templates: ['PythonTemplates', 'BotStructureTemplate'],
    legacy: ['CommandHandler', 'MediaHandler', 'MessageHandler', 'UserHandler', 'Keyboard']
  }
} as const;