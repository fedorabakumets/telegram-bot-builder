/**
 * @fileoverview Главный экспорт генератора ботов
 * 
 * Модуль агрегирует и переэкспортирует все модули генератора.
 * Используется для централизованного импорта функций и типов.
 * 
 * @module bot-generator/index
 */

// Главная функция генерации
export { generatePythonCode } from '../bot-generator';

// Ядро: конфигурация и логирование
export { isLoggingEnabled, logFlowAnalysis } from './core';
export { setGlobalLoggingEnabled, getGlobalLoggingEnabled } from './core';

// Импорт: генерация Python импортов
export { generatePythonImports, type ImportGeneratorOptions } from './imports';

// Генерация импортов по типам (для переиспользования)
export { generateCommandImports } from './imports';
export { generateUrlImageImports, generateDatetimeImports } from './imports';
export { generateParseModeImports } from './imports';
export { generateTelegramBadRequestImports } from './imports';

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
