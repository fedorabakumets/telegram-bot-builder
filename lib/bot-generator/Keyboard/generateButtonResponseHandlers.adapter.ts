/**
 * @fileoverview Адаптер для генерации button-response обработчика через Jinja2 шаблоны
 * @module bot-generator/Keyboard/generateButtonResponseHandlers.adapter
 *
 * Этот адаптер обеспечивает обратную совместимость с существующим API
 * и использует Jinja2 шаблон для генерации Python кода.
 */

import { Node } from '@shared/schema';
import { generateButtonResponse } from '../../templates/handlers';

/**
 * Проверка наличия URL кнопок в проекте
 */
function hasUrlButtons(nodes: Node[]): boolean {
  for (const node of nodes) {
    if (node.data?.buttons && Array.isArray(node.data.buttons)) {
      for (const button of node.data.buttons) {
        if (button.action === 'url' && button.url) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Подготовленная опция ответа для шаблона
 */
interface PreparedResponseOption {
  text: string;
  value?: string;
  action?: string;
  target?: string;
  url?: string;
}

/**
 * Подготовленный узел с кнопочным вводом для шаблона
 */
interface PreparedUserInputNode {
  id: string;
  responseOptions: PreparedResponseOption[];
  allowSkip?: boolean;
}

/**
 * Генерация button-response обработчика через Jinja2 шаблон
 *
 * @param code - Исходный код (для обратной совместимости, не используется)
 * @param userInputNodes - Узлы с кнопочными ответами
 * @param nodes - Все узлы для навигации
 * @returns Сгенерированный Python код
 *
 * @deprecated Используйте напрямую generateButtonResponse из templates/handlers
 */
export function generateButtonResponseHandlersAdapter(
  code: string,
  userInputNodes: Node[],
  nodes: Node[],
): string {
  // Подготавливаем данные для шаблона
  const preparedNodes: PreparedUserInputNode[] = userInputNodes.map((node) => {
    const responseOptions = (node.data.responseOptions || []).map((option: any) => {
      // Нормализация опции к объекту
      if (typeof option === 'string') {
        return {
          text: option,
          value: option,
        };
      }

      return {
        text: option.text || '',
        value: option.value || option.text,
        action: option.action,
        target: option.target,
        url: option.url,
      };
    });

    return {
      id: node.id,
      responseOptions,
      allowSkip: node.data.allowSkip,
    };
  });

  // Проверка наличия URL кнопок в проекте
  const hasUrlButtonsInProject = hasUrlButtons(nodes);

  // Генерация через Jinja2 шаблон
  return generateButtonResponse({
    userInputNodes: preparedNodes,
    allNodes: nodes,
    hasUrlButtonsInProject,
    indentLevel: '',
  });
}

/**
 * Алиас для обратной совместимости
 */
export const generateButtonResponseHandlers = generateButtonResponseHandlersAdapter;
