/**
 * @fileoverview Функция рендеринга шаблона рассылки
 * @module templates/broadcast/broadcast.renderer
 */

import type { BroadcastTemplateParams } from './broadcast.params';
import { broadcastParamsSchema } from './broadcast.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python обработчика рассылки с валидацией параметров
 * @param params - Параметры рассылки
 * @returns Сгенерированный Python код обработчика
 *
 * @example
 * ```typescript
 * const code = generateBroadcast({
 *   nodeId: 'broadcast_1',
 *   broadcastApiType: 'bot',
 *   enableBroadcast: true,
 *   idSourceType: 'bot_users',
 *   messageText: 'Hello!',
 * });
 * ```
 */
export function generateBroadcast(params: BroadcastTemplateParams): string {
  const validated = broadcastParamsSchema.parse(params);
  return renderPartialTemplate('broadcast/broadcast.py.jinja2', validated);
}
