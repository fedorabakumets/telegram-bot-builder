/**
 * @fileoverview Функция рендеринга шаблона клавиатуры
 * @module templates/keyboard/keyboard.renderer
 */

import type { KeyboardTemplateParams } from './keyboard.params';
import { keyboardParamsSchema } from './keyboard.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python кода клавиатуры с валидацией параметров
 * @param params - Параметры клавиатуры
 * @returns Сгенерированный Python код
 *
 * @example
 * ```typescript
 * const code = generateKeyboard({
 *   keyboardType: 'inline',
 *   buttons: [
 *     { text: 'Button', action: 'goto', target: 'btn', id: 'btn_1' },
 *   ],
 *   oneTimeKeyboard: false,
 *   resizeKeyboard: true,
 * });
 * ```
 */
export function generateKeyboard(params: KeyboardTemplateParams): string {
  const validated = keyboardParamsSchema.parse(params);
  return renderPartialTemplate('keyboard/keyboard.py.jinja2', validated);
}

/**
 * Собирает ID целевых узлов из inline кнопок в Set
 * @param inlineNodes - Массив узлов с inline кнопками
 * @param allReferencedNodeIds - Set для добавления найденных ID
 */
export function processInlineButtonNodes(inlineNodes: any[], allReferencedNodeIds: Set<string>): void {
  inlineNodes.forEach(node => {
    node.data.buttons.forEach((button: { action: string; target: string }) => {
      if (button.action === 'goto' && button.target) {
        allReferencedNodeIds.add(button.target);
      }
    });
    if (node.data.continueButtonTarget) {
      allReferencedNodeIds.add(node.data.continueButtonTarget);
    }
  });
}
