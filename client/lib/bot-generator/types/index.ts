/**
 * @fileoverview Экспорт всех типов генератора ботов
 * Агрегирует и переэкспортирует все типы из папки types
 */

export type { Button } from './button-types';
export type { ResponseOption } from './button-types';

export type { CodeNodeRange } from './code-types';
export type { CodeWithMap } from './code-types';

export type { BotNode } from './bot-node-types';

// Повторный экспорт функций каркаса
export {
  generateDockerfile,
  generateReadme,
  generateRequirementsTxt,
  generateEnvFile
} from '../../scaffolding';
