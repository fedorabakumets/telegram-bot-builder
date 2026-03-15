/**
 * @fileoverview Функция рендеринга шаблона обработчика /start
 * @module templates/start/start.renderer
 */

import type { StartTemplateParams } from './start.params';
import { startParamsSchema } from './start.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python обработчика команды /start с валидацией параметров
 * @param params - Параметры обработчика /start
 * @returns Сгенерированный Python код обработчика
 *
 * @example
 * ```typescript
 * const code = generateStart({
 *   nodeId: 'start_1',
 *   messageText: '👋 Добро пожаловать!',
 *   isPrivateOnly: false,
 *   adminOnly: false,
 *   requiresAuth: false,
 *   userDatabaseEnabled: true,
 * });
 * ```
 */
export function generateStart(params: StartTemplateParams): string {
  const validated = startParamsSchema.parse(params);
  return renderPartialTemplate('start/start.py.jinja2', validated);
}
