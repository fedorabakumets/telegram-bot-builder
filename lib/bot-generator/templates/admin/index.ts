/**
 * @fileoverview Экспорт модуля административных действий
 * @module templates/admin/index
 */

export type { AdminTemplateParams, AdminActionType } from './admin.params';
export type { AdminParams } from './admin.schema';
export { adminParamsSchema } from './admin.schema';
export { generateAdmin } from './admin.renderer';
export * from './admin.fixture';
