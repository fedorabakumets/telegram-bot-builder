/**
 * @fileoverview Функция рендеринга шаблона обработчика команд
 * @module templates/command/command.renderer
 */

import type { CommandTemplateParams } from './command.params';
import { commandParamsSchema } from './command.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python обработчика команды с валидацией параметров
 * @param params - Параметры обработчика команды
 * @returns Сгенерированный Python код обработчика
 *
 * @example
 * ```typescript
 * const code = generateCommand({
 *   nodeId: 'cmd_1',
 *   command: '/help',
 *   messageText: '🤖 Доступные команды:',
 *   isPrivateOnly: false,
 *   adminOnly: false,
 *   requiresAuth: false,
 *   userDatabaseEnabled: true,
 * });
 * ```
 */
export function generateCommand(params: CommandTemplateParams): string {
  const validated = commandParamsSchema.parse({
    ...params,
    isPrivateOnly: params.isPrivateOnly ?? false,
    keyboardType: params.keyboardType ?? 'none',
    formatMode: params.formatMode ?? 'none',
    buttons: params.buttons ?? [],
    synonyms: params.synonyms ?? [],
  });
  return renderPartialTemplate('command/command.py.jinja2', validated);
}
