/**
 * @fileoverview Экспорт модуля отправки прикреплённых медиафайлов
 * @module templates/attached-media/index
 */

export type { AttachedMediaTemplateParams, MediaFileType, FormatMode } from './attached-media.params';
export type { AttachedMediaParams } from './attached-media.schema';
export { attachedMediaParamsSchema } from './attached-media.schema';
export { generateAttachedMedia } from './attached-media.renderer';
