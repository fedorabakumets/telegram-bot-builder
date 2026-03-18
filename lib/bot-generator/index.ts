/**
 * @fileoverview Главный экспорт генератора ботов
 * 
 * Модуль агрегирует и переэкспортирует все модули генератора.
 * Используется для централизованного импорта функций и типов.
 * 
 * @module bot-generator/index
 */

// Главная функция генерации
export { generatePythonCode, type GeneratePythonCodeOptions } from '../bot-generator';

// Ядро: конфигурация и логирование
export { isLoggingEnabled, logFlowAnalysis } from './core';
export { setGlobalLoggingEnabled, getGlobalLoggingEnabled } from './core';

// Ядро: централизованное логирование
export { createLogger, generatorLogger } from './core/generator-logger';
export type { GeneratorLogger, LogLevel, LoggerOptions } from './core/generator-logger';


// Типы из types/
export type {
  Button,
  ResponseOption,
  ButtonAction
} from './types';
export type { CodeNodeRange, CodeWithMap } from './types';
export type { BotNode, BotNodeArray, LegacyEnhancedNode } from './types';
export type { NodeData, KeyboardType, FormatMode, InputType } from './types';
export type { EnhancedNode, EnhancedNodeArray } from './types';
export type {
  ButtonActionOverride,
  ButtonOverride,
  KeyboardTypeOverride,
  FormatModeOverride
} from './types';
export type {
  GenerationOptions,
  GenerationContext,
  InputCollectionCheckResult,
  PythonValidationResult,
  CallbackHandler
} from './types';

// Ядро: контекст и состояние генерации
export { createGenerationState, withLogging, withComments } from './core/generation-state';
export { markComponentGenerated, isComponentGenerated } from './core/generation-state';
export type { GenerationState } from './core/generation-state';

export { createGenerationContext, createGenerationContextFromNodes } from './core/create-generation-context';
export type { SectionContext } from './core/generation-context';
export { createSectionContext } from './core/generation-context';

export { DEFAULT_GENERATION_OPTIONS, normalizeGenerationOptions } from './core/generation-options.types';

// Функции каркаса
export {
  generateDockerfile,
  generateReadme,
  generateRequirementsTxt,
  generateEnvFile
} from './scaffolding';

// Утилиты конвертации и валидации
export { toEnhancedNode, toEnhancedNodes } from './utils/to-enhanced-node';
export { validateEnhancedNode, validateEnhancedNodes } from './validation/validate-enhanced-node';
export type { ValidationResult } from './validation/validate-enhanced-node';
