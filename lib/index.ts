/**
 * @fileoverview Главный экспорт библиотеки bot-generator
 * 
 * Модуль агрегирует и переэкспортирует все функции и типы библиотеки.
 * Используется для централизованного импорта в других модулях проекта.
 * 
 * @module lib/index
 */

// Main bot generator
export * from './bot-generator';
export * from './commands';
// Keyboard exports are now aggregated in './bot-generator/Keyboard'
export { generateSynonymHandlers, generateSynonyms, collectSynonymEntries } from './templates/synonyms';
export * from './bot-generator/core/add-auto-transition-nodes';
export * from './bot-generator/core/extract-node-data';

// Conditional logic
export * from './bot-generator/Conditional';

// Formatting utilities
export * from './templates/filters';

// Feature detection
export { hasCommandButtons } from './templates/filters';
export { hasConditionalButtons } from './bot-generator/Conditional/hasConditionalButtons';
// hasInlineButtons и hasMultiSelectNodes экспортируются из './bot-generator/Keyboard'
export { hasMediaNodes } from './bot-generator/MediaHandler/hasMediaNodes';
export { hasAutoTransitions } from './templates/filters';
export { hasInputCollection } from './templates/filters';
export { hasLocationFeatures } from './bot-generator/map-utils/hasLocationFeatures';
export { hasNodesRequiringSafeEditOrSend } from './templates/filters';

// Keyboard generators - после миграции на Jinja2
// Основные генераторы клавиатур используют адаптеры к Jinja2 шаблонам
export * from './templates/keyboard/keyboard.renderer';

// Code mapping utilities
export * from './bot-generator/map-utils';

// Media handlers
export * from './bot-generator/MediaHandler';

// Message handlers
export * from './templates/message-handler';

// Project scaffolding
export * from './bot-generator/scaffolding';

// User management handlers — перенесено в templates/user-handler (Jinja2)
export { generateUserHandler, generateUserHandlerFromNode, nodeToUserHandlerParams } from './templates/user-handler';
// admin-rights перенесён в templates/admin-rights (Jinja2)
export { generateAdminRightsHandler, generateAdminRightsFromNode, nodeToAdminRightsParams } from './templates/admin-rights';

// Additional utilities
export { addInputTargetNodes } from './bot-generator/core/add-input-target-nodes';

// Collection utilities
export { collectInputTargetNodes } from './bot-generator/core/collect-input-target-nodes';

// General utilities (migrated to core/ and templates/filters/)

// Node navigation
export * from './bot-generator/node-navigation';

// Handle node functions generator
export { generateHandleNodeFunctions } from './templates/handle-node-function';

// Validation utilities
export { validateGeneratedPython, assertValidPython } from './bot-generator/validation';

// Types re-export
export type {
  BotNode,
  BotNodeArray,
  Button,
  ButtonAction,
  ResponseOption,
  NodeData,
  KeyboardType,
  FormatMode,
  InputType,
  CodeNodeRange,
  CodeWithMap,
  GenerationContext,
  InputCollectionCheckResult,
  PythonValidationResult,
  ImportGeneratorOptions,
  CallbackHandler,
  EnhancedNode,
  EnhancedNodeArray,
  ButtonActionOverride,
  ButtonOverride,
  KeyboardTypeOverride,
  FormatModeOverride
} from './bot-generator/types';

export type { StandardCommand, CommandCategory } from './commands';
export type { ExtractNodeDataResult } from './bot-generator/core/extract-node-data';

// Утилиты конвертации и валидации
export { toEnhancedNode, toEnhancedNodes } from './bot-generator/core/to-enhanced-node';
export { validateEnhancedNode, validateEnhancedNodes } from './bot-generator/validation';
export type { ValidationResult } from './bot-generator/validation';

// Ядро: контекст и состояние генерации
export { createGenerationState, withLogging, withComments } from './bot-generator/core/generation-state';
export { markComponentGenerated, isComponentGenerated } from './bot-generator/core/generation-state';
export type { GenerationState } from './bot-generator/core/generation-state';

export { createGenerationContext, createGenerationContextFromNodes } from './bot-generator/core/create-generation-context';
export type { SectionContext } from './bot-generator/core/generation-context';
export { createSectionContext } from './bot-generator/core/generation-context';

export { DEFAULT_GENERATION_OPTIONS, normalizeGenerationOptions } from './bot-generator/core/generation-options.types';

// Ядро: централизованное логирование
export { createLogger, generatorLogger } from './bot-generator/core/generator-logger';
export type { GeneratorLogger, LogLevel, LoggerOptions } from './bot-generator/core/generator-logger';


