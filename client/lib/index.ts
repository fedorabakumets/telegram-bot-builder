/**
 * @fileoverview Главный экспорт библиотеки bot-generator
 * 
 * Модуль агрегирует и переэкспортирует все функции и типы библиотеки.
 * Используется для централизованного импорта в других модулях проекта.
 * 
 * @module lib/index
 */

// Main bot generator
export * from './bot-commands-setup';
export * from './bot-generator';
export * from './commands';
export * from './bot-generator/Keyboard/filterInlineNodes';
export * from './bot-generator/Keyboard/generateButtonResponseHandlers';
export * from './queryClient';
export * from './bot-generator/Synonyms';
export * from './bot-generator/utils/addAutoTransitionNodes';
export * from './bot-generator/utils/extractNodeData';

// Command handlers
export * from './bot-generator/CommandHandler';

// Conditional logic
export * from './bot-generator/Conditional';

// Formatting utilities
export * from './bot-generator/format';

// Feature detection
export { hasCommandButtons } from './bot-generator/CommandHandler/hasCommandButtons';
export { hasConditionalButtons } from './bot-generator/Conditional/hasConditionalButtons';
export { hasInlineButtons } from './bot-generator/Keyboard/hasInlineButtons';
export { hasMultiSelectNodes } from './bot-generator/Keyboard/hasMultiSelectNodes';
export { hasMediaNodes } from './bot-generator/MediaHandler/hasMediaNodes';
export { hasAutoTransitions } from './bot-generator/utils/hasAutoTransitions';
export { hasInputCollection } from './bot-generator/utils/hasInputCollection';
export { hasLocationFeatures } from './bot-generator/map-utils/hasLocationFeatures';
export { hasNodesRequiringSafeEditOrSend } from './bot-generator/utils/hasNodesRequiringSafeEditOrSend';

// Keyboard generators
export * from './bot-generator/Keyboard';

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

// Synonym handlers
export * from './bot-generator/Synonyms';

// User management handlers
export * from './bot-generator/UserHandler';

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
  GenerationOptions,
  GenerationContext,
  InputCollectionCheckResult,
  PythonValidationResult,
  ImportGeneratorOptions,
  CallbackHandler
} from './bot-generator/types';

export type { MenuCommand } from './bot-commands-setup';
export type { StandardCommand, CommandCategory } from './commands';
export type { CompleteBotScriptOptions } from './generate-complete-bot-script';
export type { ExtractNodeDataResult } from './bot-generator/utils/extractNodeData';

