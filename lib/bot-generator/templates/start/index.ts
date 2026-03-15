/**
 * @fileoverview Экспорт модуля обработчика команды /start
 * @module templates/start/index
 */

export type { StartTemplateParams, KeyboardType, FormatMode } from './start.params';
export type { StartParams } from './start.schema';
export { startParamsSchema } from './start.schema';
export { generateStart } from './start.renderer';
export * from './start.fixture';
