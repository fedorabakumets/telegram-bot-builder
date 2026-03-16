/**
 * @fileoverview Экспорт модуля рассылки
 * @module templates/broadcast/index
 */

export type { BroadcastTemplateParams } from './broadcast.params';
export type { BroadcastParams } from './broadcast.schema';
export { broadcastParamsSchema } from './broadcast.schema';
export { generateBroadcast } from './broadcast.renderer';
export * from './broadcast.fixture';
