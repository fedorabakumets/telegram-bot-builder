/**
 * @fileoverview Функция рендеринга шаблона сообщения
 * @module templates/message/message.renderer
 */

import type { MessageTemplateParams } from './message.params';
import { messageParamsSchema } from './message.schema';
import { renderPartialTemplate } from '../template-renderer';
import { computeAdjustStr } from '../keyboard/keyboard.renderer';
import { generateUserInput, nodeToUserInputParams } from '../user-input/user-input.renderer';
import type { Node } from '@shared/schema';

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
  const VALID_FORMAT_MODES = ['html', 'markdown', 'none'] as const;
  const validated = messageParamsSchema.parse({
    userDatabaseEnabled: params.userDatabaseEnabled ?? false,
    keyboardType: params.keyboardType ?? 'none',
    formatMode: VALID_FORMAT_MODES.includes(params.formatMode as any) ? params.formatMode : 'none',
    requiresAuth: params.requiresAuth ?? false,
    isPrivateOnly: params.isPrivateOnly ?? false,
    adminOnly: params.adminOnly ?? false,
    enableAutoTransition: params.enableAutoTransition ?? false,
    allowMultipleSelection: params.allowMultipleSelection ?? false,
    collectUserInput: params.collectUserInput ?? false,
    enableConditionalMessages: params.enableConditionalMessages ?? false,
    oneTimeKeyboard: params.oneTimeKeyboard ?? false,
    resizeKeyboard: params.resizeKeyboard ?? true,
    ...params,
    // Перезаписываем после ...params чтобы нормализация не была перекрыта
    formatMode: VALID_FORMAT_MODES.includes(params.formatMode as any) ? params.formatMode : 'none',
  });

  // Вычисляем блок waiting_for_input если нужен сбор ввода
  let userInputBlock = '';
  if (params.collectUserInput) {
    const fakeNode = {
      id: params.nodeId,
      type: 'message',
      position: { x: 0, y: 0 },
      data: params as any,
    } as Node;
    userInputBlock = generateUserInput(nodeToUserInputParams(fakeNode));
  }

  return renderPartialTemplate('message/message.py.jinja2', {
    ...validated,
    handlerContext: 'callback',
    adjustStr: computeAdjustStr(params.keyboardLayout),
    userInputBlock,
  });
}
