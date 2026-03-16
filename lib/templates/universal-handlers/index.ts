/**
 * @fileoverview Публичный экспорт шаблона универсальных обработчиков
 * @module templates/universal-handlers
 */

export type { UniversalHandlersTemplateParams } from './universal-handlers.params';
export { universalHandlersParamsSchema, type UniversalHandlersParams } from './universal-handlers.schema';
export { generateUniversalHandlers } from './universal-handlers.renderer';
export * as universalHandlersFixtures from './universal-handlers.fixture';
