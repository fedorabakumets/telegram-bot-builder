/**
 * @fileoverview Адаптер для генерации multi-select callback логики через Jinja2 шаблоны
 * @module bot-generator/Keyboard/generateMultiSelectCallbackLogic.adapter
 *
 * Этот адаптер обеспечивает обратную совместимость с существующим API
 * и использует Jinja2 шаблон для генерации Python кода.
 */

import { Node } from '@shared/schema';
import { generateMultiSelectCallback } from '../../templates/handlers';
import { generateUniqueShortId } from '../format';
import { escapePythonString } from '../format/escapePythonString';
import { calculateOptimalColumns } from './calculateOptimalColumns';
import { getAdjustCode } from './getAdjustCode';

/**
 * Подготовленная кнопка для шаблона
 */
interface PreparedButton {
  id: string;
  text: string;
  action: string;
  target?: string;
  url?: string;
  value: string;
  valueTruncated: string;
  escapedText: string;
  callbackData: string;
}

/**
 * Подготовленный узел для шаблона
 */
interface PreparedNode {
  id: string;
  shortNodeId: string;
  selectionButtons: PreparedButton[];
  regularButtons: Array<{
    id: string;
    text: string;
    action: 'goto' | 'url' | 'command';
    target?: string;
    url?: string;
  }>;
  completeButton?: {
    text: string;
    target: string;
  };
  doneCallbackData?: string;
  hasKeyboardLayout?: boolean;
  keyboardLayoutAuto?: boolean;
  adjustCode?: string;
  totalButtonsCount?: number;
}

/**
 * Генерация multi-select callback логики через Jinja2 шаблон
 *
 * @param multiSelectNodes - Узлы с множественным выбором
 * @param allNodeIds - Массив всех ID узлов
 * @returns Сгенерированный Python код
 *
 * @deprecated Используйте напрямую generateMultiSelectCallback из templates/handlers
 */
export function generateMultiSelectCallbackLogicAdapter(
  multiSelectNodes: Node[],
  allNodeIds: string[],
): string {
  // Подготавливаем данные для шаблона
  const preparedNodes: PreparedNode[] = multiSelectNodes.map((node) => {
    const shortNodeId = generateUniqueShortId(node.id, allNodeIds);

    // Подготовка кнопок выбора
    const selectionButtons = (node.data.buttons || [])
      .filter((btn: any) => btn.action === 'selection')
      .map((btn: any) => {
        const buttonValue = btn.target || btn.id || btn.text || '';
        const callbackData = `ms_${shortNodeId}_${buttonValue}`;

        return {
          id: btn.id || '',
          text: btn.text || '',
          action: 'selection',
          target: btn.target,
          value: buttonValue,
          valueTruncated: buttonValue.slice(-8),
          escapedText: btn.text.replace(/'/g, "\\'"),
          callbackData,
        };
      });

    // Подготовка обычных кнопок
    const regularButtons = (node.data.buttons || [])
      .filter((btn: any) => btn.action === 'goto' || btn.action === 'url')
      .map((btn: any) => ({
        id: btn.id || '',
        text: btn.text || '',
        action: btn.action as 'goto' | 'url' | 'command',
        target: btn.target,
        url: btn.url,
      }));

    // Кнопка "Готово"
    const completeButton = (node.data.buttons || []).find(
      (btn: any) => btn.action === 'complete'
    );

    const doneCallbackData = completeButton
      ? `done_${shortNodeId}`
      : undefined;

    // Раскладка
    const hasKeyboardLayout = !!node.data.keyboardLayout;
    const keyboardLayoutAuto = node.data.keyboardLayout?.autoLayout ?? true;

    // Код для adjust
    const allButtons = node.data.buttons || [];
    const adjustCode = hasKeyboardLayout && !keyboardLayoutAuto
      ? getAdjustCode(node.data.keyboardLayout, allButtons.length)
      : undefined;

    // Общее количество кнопок
    const totalButtonsCount = allButtons.length;

    return {
      id: node.id,
      shortNodeId,
      selectionButtons,
      regularButtons,
      completeButton: completeButton
        ? {
            text: completeButton.text,
            target: completeButton.target,
          }
        : undefined,
      doneCallbackData,
      hasKeyboardLayout,
      keyboardLayoutAuto,
      adjustCode,
      totalButtonsCount,
    };
  });

  // Генерация через Jinja2 шаблон
  return generateMultiSelectCallback({
    multiSelectNodes: preparedNodes,
    allNodeIds,
    indentLevel: '    ',
  });
}

/**
 * Алиас для обратной совместимости
 */
export const generateMultiSelectCallbackLogic = generateMultiSelectCallbackLogicAdapter;
