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
  const validated = adminParamsSchema.parse({
    ...params,
    canManageChat: params.canManageChat ?? false,
    canDeleteMessages: params.canDeleteMessages ?? false,
    canManageVideoChats: params.canManageVideoChats ?? false,
    canRestrictMembers: params.canRestrictMembers ?? false,
    canPromoteMembers: params.canPromoteMembers ?? false,
    canChangeInfo: params.canChangeInfo ?? false,
    canInviteUsers: params.canInviteUsers ?? false,
    canPinMessages: params.canPinMessages ?? false,
    canManageTopics: params.canManageTopics ?? false,
    isAnonymous: params.isAnonymous ?? false,
    disableNotification: params.disableNotification ?? false,
  });
  return renderPartialTemplate('admin/admin.py.jinja2', validated);
}
