/**
 * @fileoverview Экспорт всех типов генератора ботов
 * 
 * Модуль агрегирует и переэкспортирует все типы из папки types.
 * Используется для централизованного импорта типов в других модулях.
 * 
 * @module bot-generator/types/index
 */

export type { Button } from './button-types';
export type { ResponseOption } from './button-types';
export type { ButtonAction } from './button-types';

export type { CodeNodeRange } from './code-types';
export type { CodeWithMap } from './code-types';

export type { BotNode } from './bot-node-types';
export type { BotNodeArray } from './bot-node-types';

export type { NodeData } from './node-data.types';
export type { KeyboardType } from './node-data.types';
export type { FormatMode } from './node-data.types';
export type { InputType } from './node-data.types';

export type { EnhancedNode } from './enhanced-node.types';
export type { EnhancedNodeArray } from './enhanced-node.types';

export type { ButtonActionOverride } from './node-data-override.types';
export type { ButtonOverride } from './node-data-override.types';
export type { KeyboardTypeOverride } from './node-data-override.types';
export type { FormatModeOverride } from './node-data-override.types';

export type { GenerationOptions } from '../core/generation-options.types';
export type { GenerationContext } from '../core/generation-context';
export type { InputCollectionCheckResult } from './generation.types';
export type { PythonValidationResult } from './generation.types';
export type { ImportGeneratorOptions } from './generation.types';
export type { CallbackHandler } from './generation.types';

// Повторный экспорт функций каркаса
export {
  generateDockerfile,
  generateReadme,
  generateRequirementsTxt,
  generateEnvFile
} from '../scaffolding';
