/**
 * @fileoverview Функция рендеринга шаблона административных действий
 * @module templates/admin/admin.renderer
 */

import type { AdminTemplateParams } from './admin.params';
import { adminParamsSchema } from './admin.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python обработчика административного действия с валидацией параметров
 * @param params - Параметры административного действия
 * @returns Сгенерированный Python код обработчика
 *
 * @example
 * ```typescript
 * const code = generateAdmin({
 *   nodeId: 'admin_1',
 *   adminActionType: 'ban_user',
 *   userIdSource: 'last_message',
 *   untilDate: 1234567890,
 * });
 * ```
 */
export function generateAdmin(params: AdminTemplateParams): string {
  const validated = adminParamsSchema.parse(params);
  return renderPartialTemplate('admin/admin.py.jinja2', validated);
}
