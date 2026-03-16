/**
 * @fileoverview Публичный экспорт шаблона запуска
 * @module templates/main
 */

export type { MainTemplateParams } from './main.params';
export { mainParamsSchema, type MainParams } from './main.schema';
export { generateMain } from './main.renderer';
export * as mainFixtures from './main.fixture';
