/**
 * @fileoverview Экспорт модуля обработчика команд
 * @module templates/command/index
 */

export type { CommandTemplateParams, KeyboardType, FormatMode } from './command.params';
export type { CommandParams } from './command.schema';
export { commandParamsSchema } from './command.schema';
export { generateCommand } from './command.renderer';
export * from './command.fixture';
