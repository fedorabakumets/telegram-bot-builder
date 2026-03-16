/**
 * @fileoverview Адаптер для генерации multi-select done обработчика через Jinja2 шаблоны
 * @module bot-generator/Keyboard/generateMultiSelectDoneHandler.adapter
 *
 * Этот адаптер обеспечивает обратную совместимость с существующим API
 * и использует Jinja2 шаблон для генерации Python кода.
 */

import { Node } from '@shared/schema';
import { generateMultiSelectDone } from '../../templates/handlers';
import { generateUniqueShortId } from '../format';
import { formatTextForPython } from '../format/formatTextForPython';
import { toPythonBoolean } from '../format/toPythonBoolean';
import { generateInlineKeyboardCodeAdapter as generateInlineKeyboardCode } from './generateInlineKeyboardCode.adapter';
import { getAdjustCode } from './getAdjustCode';

/**
 * Подготовленная кнопка для шаблона
 */
interface PreparedButton {
  id: string;
  text: string;
  action: string;
  target?: string;
  callbackData?: string;
}

/**
 * Подготовленный целевой узел для шаблона
 */
interface PreparedTargetNode {
  id: string;
  type: string;
  data: {
    keyboardType?: 'inline' | 'reply' | 'none';
    allowMultipleSelection?: boolean;
    buttons?: PreparedButton[];
    messageText?: string;
    multiSelectVariable?: string;
    resizeKeyboard?: boolean;
    oneTimeKeyboard?: boolean;
    command?: string;
  };
  shortId?: string;
  keyboardCode?: string;
  adjustCode?: string;
}

/**
 * Подготовленный узел для шаблона
 */
interface PreparedNode {
  id: string;
  variableName: string;
  continueButtonTarget?: string;
  targetNode?: PreparedTargetNode;
}

/**
 * Генерация multi-select done обработчика через Jinja2 шаблон
 *
 * @param nodes - Все узлы
 * @param multiSelectNodes - Узлы с множественным выбором
 * @param allNodeIds - Массив всех ID узлов
 * @returns Сгенерированный Python код
 *
 * @deprecated Используйте напрямую generateMultiSelectDone из templates/handlers
 */
export function generateMultiSelectDoneHandlerAdapter(
  nodes: Node[],
  multiSelectNodes: Node[],
  allNodeIds: string[],
): string {
  // Подготавливаем данные для шаблона
  const preparedNodes: PreparedNode[] = multiSelectNodes.map((node) => {
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    const continueButtonTarget = node.data.continueButtonTarget;

    // Поиск целевого узла
    let targetNode: PreparedTargetNode | undefined;

    if (continueButtonTarget) {
      const target = nodes.find((n) => n.id === continueButtonTarget);

      if (target) {
        const shortId = generateUniqueShortId(target.id, allNodeIds);

        // Подготовка кнопок для целевого узла
        const buttons = (target.data.buttons || []).map((btn: any, index: number) => ({
          id: btn.id || '',
          text: btn.text || '',
          action: btn.action || 'selection',
          target: btn.target,
          callbackData: btn.action === 'selection'
            ? `ms_${shortId}_${(btn.target || btn.id || `btn${index}`).slice(-8)}`
            : undefined,
        }));

        // Генерация клавиатуры для inline узлов
        let keyboardCode: string | undefined;
        if (target.type === 'message' && target.data.keyboardType === 'inline' && buttons.length > 0) {
          keyboardCode = generateInlineKeyboardCode(
            target.data.buttons || [],
            '        ',
            target.id,
            target.data,
            allNodeIds
          );
        }

        // Код для adjust
        let adjustCode: string | undefined;
        if (target.data.keyboardLayout && !target.data.keyboardLayout.autoLayout) {
          adjustCode = getAdjustCode(target.data.keyboardLayout, buttons.length);
        } else if (buttons.length > 0) {
          adjustCode = 'builder.adjust(2)';
        }

        targetNode = {
          id: target.id,
          type: target.type,
          data: {
            keyboardType: target.data.keyboardType,
            allowMultipleSelection: target.data.allowMultipleSelection,
            buttons,
            messageText: target.data.messageText,
            multiSelectVariable: target.data.multiSelectVariable,
            resizeKeyboard: target.data.resizeKeyboard,
            oneTimeKeyboard: target.data.oneTimeKeyboard,
            command: target.data.command,
          },
          shortId,
          keyboardCode,
          adjustCode,
        };
      }
    }

    return {
      id: node.id,
      variableName,
      continueButtonTarget,
      targetNode,
    };
  });

  // Генерация через Jinja2 шаблон
  return generateMultiSelectDone({
    multiSelectNodes: preparedNodes,
    allNodes: nodes,
    allNodeIds,
    indentLevel: '',
  });
}

/**
 * Алиас для обратной совместимости
 */
export const generateMultiSelectDoneHandler = generateMultiSelectDoneHandlerAdapter;
