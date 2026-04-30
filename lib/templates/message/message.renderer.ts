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
 * Список HTML-тегов, поддерживаемых Telegram Bot API.
 * Используется для авто-определения режима форматирования.
 */
const TELEGRAM_HTML_TAG_PATTERN = /<(b|i|u|s|a|code|pre|blockquote|tg-spoiler)[\s>\/]/i;

/**
 * Проверяет, содержит ли текст HTML-теги, поддерживаемые Telegram.
 * @param text - Текст сообщения для проверки
 * @returns true если найден хотя бы один Telegram HTML-тег
 */
function containsTelegramHtmlTags(text: string): boolean {
  return TELEGRAM_HTML_TAG_PATTERN.test(text);
}

/**
 * Определяет эффективный режим форматирования для узла.
 * Если `formatMode` явно задан — использует его.
 * Если `formatMode` отсутствует (undefined/null) и текст содержит HTML-теги — возвращает 'html'.
 * @param formatMode - Явно заданный режим форматирования (может быть undefined)
 * @param messageText - Текст сообщения
 * @returns Эффективный режим форматирования
 */
function resolveFormatMode(
  formatMode: string | undefined | null,
  messageText: string | undefined,
): 'html' | 'markdown' | 'none' {
  const VALID_FORMAT_MODES = ['html', 'markdown', 'none'] as const;
  // Если formatMode явно задан и валиден — используем его без изменений
  if (VALID_FORMAT_MODES.includes(formatMode as any)) {
    return formatMode as 'html' | 'markdown' | 'none';
  }
  // formatMode отсутствует (undefined/null/невалидное значение) —
  // проверяем наличие HTML-тегов в тексте для авто-определения
  if (messageText && containsTelegramHtmlTags(messageText)) {
    return 'html';
  }
  return 'none';
}

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
  /** Нормализуем params до передачи в схему — авто-определяем HTML если formatMode отсутствует */
  const normalizedParams = {
    ...params,
    formatMode: resolveFormatMode(params.formatMode, params.messageText),
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
