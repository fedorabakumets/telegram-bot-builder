/**
 * @fileoverview Публичный экспорт шаблона middleware
 * @module templates/middleware
 */

export type { MiddlewareTemplateParams } from './middleware.params';
export { middlewareParamsSchema, type MiddlewareParams } from './middleware.schema';
export { generateMiddleware } from './middleware.renderer';
export * as middlewareFixtures from './middleware.fixture';
