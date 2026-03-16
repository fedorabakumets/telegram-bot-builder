/**
 * @fileoverview Функция рендеринга шаблона сообщения
 * @module templates/message/message.renderer
 */

import type { MessageTemplateParams } from './message.params';
import { messageParamsSchema } from './message.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python кода обработчика сообщения с валидацией параметров
 * @param params - Параметры сообщения
 * @returns Сгенерированный Python код
 *
 * @example
 * ```typescript
 * const code = generateMessage({
 *   nodeId: 'msg_123',
 *   messageText: 'Привет! Выберите опцию:',
 *   keyboardType: 'inline',
 *   buttons: [...],
 * });
 * ```
 */
export function generateMessage(params: MessageTemplateParams): string {
  const validated = messageParamsSchema.parse({
    ...params,
    userDatabaseEnabled: params.userDatabaseEnabled ?? false,
    keyboardType: params.keyboardType ?? 'none',
    formatMode: params.formatMode ?? 'none',
  });
  return renderPartialTemplate('message/message.py.jinja2', validated);
}
