/**
 * @fileoverview Публичный экспорт шаблона заголовка
 * @module templates/header
 */

export type { HeaderTemplateParams } from './header.params';
export { headerParamsSchema, type HeaderParams } from './header.schema';
export { generateHeader } from './header.renderer';
export * as headerFixtures from './header.fixture';
