/**
 * @fileoverview Функция рендеринга шаблона сообщения
 * @module templates/message/message.renderer
 */

import type { MessageTemplateParams } from './message.params';
import { messageParamsSchema } from './message.schema';
import { renderPartialTemplate } from '../template-renderer';
import { computeAdjustStr, sortButtonsByLayout } from '../keyboard/keyboard.renderer';
import { generateUserInput, nodeToUserInputParams } from '../user-input/user-input.renderer';
import { normalizeDynamicButtonsConfig, shouldUseDynamicButtons } from '../keyboard/dynamic-buttons';
import { buildStaticRowsAroundDynamic } from '../keyboard/keyboard-layout-rows';
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
  /** Нормализуем params до передачи в схему — убираем невалидные значения */
  const normalizedParams = {
    ...params,
    formatMode: VALID_FORMAT_MODES.includes(params.formatMode as any) ? params.formatMode : 'none',
  };
  const normalizedDynamicButtons = normalizeDynamicButtonsConfig(normalizedParams.dynamicButtons);
  const useDynamicButtons = shouldUseDynamicButtons({
    enableDynamicButtons: normalizedParams.enableDynamicButtons,
    dynamicButtons: normalizedDynamicButtons,
    keyboardType: normalizedParams.keyboardType,
  });
  const rawButtons = normalizedParams.buttons ?? [];
  const hasDynamicLayout = useDynamicButtons &&
    normalizedParams.keyboardLayout?.rows?.some((row: any) => row.buttonIds?.includes('__dynamic__'));
  const sortedButtons = sortButtonsByLayout(rawButtons, normalizedParams.keyboardLayout);
  const staticRowsAroundDynamic = hasDynamicLayout
    ? buildStaticRowsAroundDynamic(rawButtons, normalizedParams.keyboardLayout)
    : { staticRowsBefore: [], staticRowsAfter: [] };
  const validated = messageParamsSchema.parse({
    ...normalizedParams,
    buttons: sortedButtons,
    userDatabaseEnabled: normalizedParams.userDatabaseEnabled ?? false,
    keyboardType: useDynamicButtons ? 'inline' : (normalizedParams.keyboardType ?? 'none'),
    requiresAuth: normalizedParams.requiresAuth ?? false,
    adminOnly: normalizedParams.adminOnly ?? false,
    enableAutoTransition: normalizedParams.enableAutoTransition ?? false,
    allowMultipleSelection: normalizedParams.allowMultipleSelection ?? false,
    collectUserInput: normalizedParams.collectUserInput ?? false,
    enableConditionalMessages: normalizedParams.enableConditionalMessages ?? false,
    enableDynamicButtons: useDynamicButtons,
    oneTimeKeyboard: normalizedParams.oneTimeKeyboard ?? false,
    resizeKeyboard: normalizedParams.resizeKeyboard ?? true,
    dynamicButtons: normalizedDynamicButtons ?? normalizedParams.dynamicButtons ?? undefined,
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
    callbackPattern: params.callbackPattern || params.nodeId,
    messageSendRecipients: params.messageSendRecipients || [],
    staticRowsBefore: staticRowsAroundDynamic.staticRowsBefore,
    staticRowsAfter: staticRowsAroundDynamic.staticRowsAfter,
  });
}
