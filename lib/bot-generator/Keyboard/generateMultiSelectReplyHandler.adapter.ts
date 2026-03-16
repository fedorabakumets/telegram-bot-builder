/**
 * @fileoverview Адаптер для генерации multi-select reply обработчика через Jinja2 шаблоны
 * @module bot-generator/Keyboard/generateMultiSelectReplyHandler.adapter
 *
 * Этот адаптер обеспечивает обратную совместимость с существующим API
 * и использует Jinja2 шаблон для генерации Python кода.
 */

import { Node } from '@shared/schema';
import { generateMultiSelectReply } from '../../templates/handlers';
import { escapePythonString } from '../format/escapePythonString';
import { generateInlineKeyboardCodeAdapter as generateInlineKeyboardCode } from './generateInlineKeyboardCode.adapter';
import { getAdjustCode } from './getAdjustCode';

/**
 * Подготовленная кнопка выбора для шаблона
 */
interface PreparedSelectionButton {
  id: string;
  text: string;
  action: 'selection';
  target?: string;
}

/**
 * Подготовленная обычная кнопка для шаблона
 */
interface PreparedRegularButton {
  id: string;
  text: string;
  action: 'goto' | 'url' | 'command';
  target?: string;
}

/**
 * Подготовленная кнопка перехода для шаблона
 */
interface PreparedGotoButton {
  id: string;
  text: string;
  action: 'goto';
  target: string;
  targetNode?: {
    id: string;
    type: string;
    data: {
      command?: string;
    };
  };
}

/**
 * Подготовленная кнопка завершения для шаблона
 */
interface PreparedCompleteButton {
  text: string;
  target?: string;
}

/**
 * Подготовленный целевой узел для шаблона
 */
interface PreparedTargetNode {
  id: string;
  type: string;
  data: {
    keyboardType?: 'inline' | 'reply' | 'none';
    messageText?: string;
    command?: string;
  };
  keyboardCode?: string;
}

/**
 * Подготовленный узел для шаблона
 */
interface PreparedNode {
  id: string;
  variableName: string;
  continueButtonTarget?: string;
  continueButtonText?: string;
  completeButton?: PreparedCompleteButton;
  selectionButtons: PreparedSelectionButton[];
  regularButtons: PreparedRegularButton[];
  gotoButtons: PreparedGotoButton[];
  adjustCode?: string;
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
  messageText?: string;
  targetNode?: PreparedTargetNode;
}

/**
 * Генерация multi-select reply обработчика через Jinja2 шаблон
 *
 * @param nodes - Все узлы
 * @param allNodeIds - Массив всех ID узлов
 * @returns Сгенерированный Python код
 *
 * @deprecated Используйте напрямую generateMultiSelectReply из templates/handlers
 */
export function generateMultiSelectReplyHandlerAdapter(
  nodes: Node[],
  allNodeIds: string[],
): string {
  // Фильтрация узлов с reply множественным выбором
  const multiSelectNodes = nodes.filter(
    (node) => node.data.allowMultipleSelection && node.data.keyboardType === 'reply'
  );

  if (multiSelectNodes.length === 0) {
    return '';
  }

  // Подготавливаем данные для шаблона
  const preparedNodes: PreparedNode[] = multiSelectNodes.map((node) => {
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    const continueButtonTarget = node.data.continueButtonTarget;
    const continueButtonText = node.data.continueButtonText || 'Готово';

    // Кнопка завершения
    const completeButtonNode = (node.data.buttons || []).find(
      (btn: any) => btn.action === 'complete'
    );

    const completeButton: PreparedCompleteButton | undefined = completeButtonNode
      ? {
          text: completeButtonNode.text || continueButtonText,
          target: completeButtonNode.target,
        }
      : {
          text: continueButtonText,
        };

    // Кнопки выбора
    const selectionButtons: PreparedSelectionButton[] = (node.data.buttons || [])
      .filter((btn: any) => btn.action === 'selection')
      .map((btn: any) => ({
        id: btn.id || '',
        text: btn.text || '',
        action: 'selection' as const,
        target: btn.target,
      }));

    // Обычные кнопки
    const regularButtons: PreparedRegularButton[] = (node.data.buttons || [])
      .filter((btn: any) => btn.action !== 'selection' && btn.action !== 'complete')
      .map((btn: any) => ({
        id: btn.id || '',
        text: btn.text || '',
        action: btn.action as 'goto' | 'url' | 'command',
        target: btn.target,
      }));

    // Кнопки перехода
    const gotoButtons: PreparedGotoButton[] = (node.data.buttons || [])
      .filter((btn: any) => btn.action === 'goto' && btn.target)
      .map((btn: any) => {
        const targetNode = nodes.find((n) => n.id === btn.target);
        return {
          id: btn.id || '',
          text: btn.text || '',
          action: 'goto' as const,
          target: btn.target,
          targetNode: targetNode
            ? {
                id: targetNode.id,
                type: targetNode.type,
                data: {
                  command: targetNode.data.command,
                },
              }
            : undefined,
        };
      });

    // Код для adjust
    const allButtons = node.data.buttons || [];
    let adjustCode: string | undefined;
    if (node.data.keyboardLayout && !node.data.keyboardLayout.autoLayout) {
      adjustCode = getAdjustCode(node.data.keyboardLayout, allButtons.length);
    } else {
      adjustCode = 'builder.adjust(2)';
    }

    // Целевой узел
    let targetNode: PreparedTargetNode | undefined;
    if (continueButtonTarget) {
      const target = nodes.find((n) => n.id === continueButtonTarget);

      if (target) {
        let keyboardCode: string | undefined;
        if (
          target.type === 'message' &&
          target.data.keyboardType === 'inline' &&
          target.data.buttons &&
          target.data.buttons.length > 0
        ) {
          keyboardCode = generateInlineKeyboardCode(
            target.data.buttons,
            '            ',
            target.id,
            target.data,
            allNodeIds
          );
        }

        targetNode = {
          id: target.id,
          type: target.type,
          data: {
            keyboardType: target.data.keyboardType,
            messageText: target.data.messageText,
            command: target.data.command,
          },
          keyboardCode,
        };
      }
    }

    return {
      id: node.id,
      variableName,
      continueButtonTarget,
      continueButtonText,
      completeButton,
      selectionButtons,
      regularButtons,
      gotoButtons,
      adjustCode,
      resizeKeyboard: node.data.resizeKeyboard,
      oneTimeKeyboard: node.data.oneTimeKeyboard,
      messageText: node.data.messageText,
      targetNode,
    };
  });

  // Генерация через Jinja2 шаблон
  return generateMultiSelectReply({
    multiSelectNodes: preparedNodes,
    allNodes: nodes,
    allNodeIds,
    indentLevel: '',
  });
}

/**
 * Алиас для обратной совместимости
 */
export const generateMultiSelectReplyHandler = generateMultiSelectReplyHandlerAdapter;
