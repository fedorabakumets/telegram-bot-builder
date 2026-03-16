/**
 * @fileoverview Публичный экспорт шаблона импортов
 * @module templates/imports
 */

export type { ImportsTemplateParams } from './imports.params';
export { importsParamsSchema, type ImportsParams } from './imports.schema';
export { generateImports } from './imports.renderer';
export * as importsFixtures from './imports.fixture';
