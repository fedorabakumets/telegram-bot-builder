/**
 * @fileoverview Публичный экспорт шаблона утилит
 * @module templates/utils
 */

export type { UtilsTemplateParams } from './utils-template.params';
export { utilsParamsSchema, type UtilsParams } from './utils-template.schema';
export { generateUtils } from './utils-template.renderer';
export * as utilsFixtures from './utils-template.fixture';
