/**
 * @fileoverview Функция рендеринга шаблона safe_edit_or_send
 * @module templates/safe-edit-or-send/safe-edit-or-send.renderer
 */

import type { SafeEditOrSendTemplateParams } from './safe-edit-or-send.params';
import { safeEditOrSendParamsSchema } from './safe-edit-or-send.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python кода функции safe_edit_or_send с валидацией параметров
 * @param params - Параметры функции
 * @returns Сгенерированный Python код
 *
 * @example
 * ```typescript
 * const code = generateSafeEditOrSend({
 *   hasInlineButtonsOrSpecialNodes: true,
 *   hasAutoTransitions: false,
 * });
 * ```
 */
export function generateSafeEditOrSend(params: SafeEditOrSendTemplateParams): string {
  const validated = safeEditOrSendParamsSchema.parse({
    ...params,
    hasInlineButtonsOrSpecialNodes: params.hasInlineButtonsOrSpecialNodes ?? false,
    hasAutoTransitions: params.hasAutoTransitions ?? false,
  });
  return renderPartialTemplate('safe-edit-or-send/safe-edit-or-send.py.jinja2', validated);
}
