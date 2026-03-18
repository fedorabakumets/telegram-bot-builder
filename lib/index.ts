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
export * from './queryClient';
export { generateSynonymHandlers, generateSynonyms, collectSynonymEntries } from './templates/synonyms';
export * from './bot-generator/utils/addAutoTransitionNodes';
export * from './bot-generator/utils/extractNodeData';

// Command handlers - удалено, функциональность перенесена в Jinja2 шаблоны
// export * from './bot-generator/CommandHandler';

// Conditional logic
export * from './bot-generator/Conditional';

// Formatting utilities
export * from './templates/filters';

// Feature detection
export { hasCommandButtons } from './bot-generator/utils/hasCommandButtons';
export { hasConditionalButtons } from './bot-generator/Conditional/hasConditionalButtons';
// hasInlineButtons и hasMultiSelectNodes экспортируются из './bot-generator/Keyboard'
export { hasMediaNodes } from './bot-generator/MediaHandler/hasMediaNodes';
export { hasAutoTransitions } from './bot-generator/utils/hasAutoTransitions';
export { hasInputCollection } from './bot-generator/utils/hasInputCollection';
export { hasLocationFeatures } from './bot-generator/map-utils/hasLocationFeatures';
export { hasNodesRequiringSafeEditOrSend } from './bot-generator/utils/hasNodesRequiringSafeEditOrSend';

// Keyboard generators - после миграции на Jinja2
// Основные генераторы клавиатур используют адаптеры к Jinja2 шаблонам
export * from './templates/keyboard/keyboard.renderer';

// Code mapping utilities
export * from './bot-generator/map-utils';

// Media handlers
export * from './bot-generator/MediaHandler';

// Message handlers
export * from './bot-generator/MessageHandler';

// Project scaffolding
export * from './bot-generator/scaffolding';

// Storage utilities
export * from './storage';

// Synonym handlers — перенесено в templates/synonyms (Jinja2)
// export * from './bot-generator/Synonyms';

// User management handlers — перенесено в templates/user-handler (Jinja2)
export { generateUserHandler, generateUserHandlerFromNode, nodeToUserHandlerParams } from './templates/user-handler';
// admin-rights перенесён в templates/admin-rights (Jinja2)
export { generateAdminRightsHandler, generateAdminRightsFromNode, nodeToAdminRightsParams } from './templates/admin-rights';

// Additional utilities
export { addInputTargetNodes } from './bot-generator/utils/addInputTargetNodes';

// Collection utilities
export { collectInputTargetNodes } from './bot-generator/utils/collectInputTargetNodes';

// General utilities
export * from './bot-generator/utils';

// Node navigation
export * from './bot-generator/node-navigation';

// Handle node functions generator
export { generateHandleNodeFunctions } from './generate/generateHandleNodeFunctions';

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
  LegacyEnhancedNode,
  ButtonActionOverride,
  ButtonOverride,
  KeyboardTypeOverride,
  FormatModeOverride
} from './bot-generator/types';

export type { StandardCommand, CommandCategory } from './commands';
export type { ExtractNodeDataResult } from './bot-generator/utils/extractNodeData';

// Утилиты конвертации и валидации
export { toEnhancedNode, toEnhancedNodes } from './bot-generator/utils/to-enhanced-node';
export { validateEnhancedNode, validateEnhancedNodes } from './bot-generator/validation/validate-enhanced-node';
export type { ValidationResult } from './bot-generator/validation/validate-enhanced-node';

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

// Константы
export * from './bot-generator/constants';

