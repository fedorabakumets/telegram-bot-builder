/**
 * @fileoverview Функция рендеринга шаблона клавиатуры
 * @module templates/keyboard/keyboard.renderer
 */

import type { KeyboardTemplateParams } from './keyboard.params';
import type { EnhancedNode } from '../../bot-generator/types/enhanced-node.types';
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
export function processInlineButtonNodes(inlineNodes: EnhancedNode[], allReferencedNodeIds: Set<string>): void {
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

/**
 * Идентифицирует узлы, требующие логики множественного выбора
 * @param nodes - Массив узлов для проверки
 * @returns Массив узлов с включенным множественным выбором
 */
export function identifyNodesRequiringMultiSelectLogic(nodes: EnhancedNode[]): EnhancedNode[] {
  return nodes
    .filter(node => node !== null && node !== undefined)
    .filter(node => node.data?.allowMultipleSelection);
}

/**
 * Фильтрует узлы с inline callback кнопками (action === 'selection' | 'complete')
 */
export function filterInlineNodes(nodes: EnhancedNode[]): EnhancedNode[] {
  return nodes
    .filter(node => node !== null && node !== undefined)
    .filter(node => {
      const buttons = node.data?.buttons;
      return Array.isArray(buttons) && buttons.some(
        (btn: any) => btn.action === 'selection' || btn.action === 'complete'
      );
    });
}

/**
 * Проверяет наличие inline (callback) кнопок в узлах
 */
export function hasInlineButtons(nodes: EnhancedNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => {
      const hasMain = node.data?.keyboardType === 'inline' &&
        Array.isArray(node.data?.buttons) && node.data.buttons.length > 0;
      const hasConditional = Array.isArray(node.data?.conditionalMessages) &&
        node.data.conditionalMessages.some((c: any) =>
          c.keyboardType === 'inline' && Array.isArray(c.buttons) && c.buttons.length > 0
        );
      return hasMain || hasConditional;
    });
}

/**
 * Проверяет наличие узлов с множественным выбором
 */
export function hasMultiSelectNodes(nodes: EnhancedNode[]): boolean {
  return nodes.some(node => {
    if (!node?.data) return false;
    if (node.data.allowMultipleSelection) return true;
    return (node.data.buttons ?? []).some(
      (btn: any) => btn.action === 'selection' || btn.action === 'complete'
    );
  });
}

/**
 * Генерирует базовую структуру callback обработчика
 */
export function generateBaseCallbackHandlerStructure(code: string, safeFunctionName: any): string {
  code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
  code += '    # Безопасное получение данных из callback_query\n';
  code += '    callback_data = None  # Инициализируем переменную\n';
  code += '    try:\n';
  code += '        user_id = callback_query.from_user.id\n';
  code += '        callback_data = callback_query.data\n';
  code += `        logging.info(f"🔵 Вызван callback handler: handle_callback_${safeFunctionName} для пользователя {user_id}")\n`;
  code += '    except Exception as e:\n';
  code += `        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_${safeFunctionName}: {e}")\n`;
  code += '        return\n';
  code += '    \n';
  code += '    try:\n';
  code += '        await callback_query.answer()\n';
  code += '    except Exception:\n';
  code += '        pass\n';
  code += '    \n';
  code += '    user_name = await init_user_variables(user_id, callback_query.from_user)\n';
  code += '    \n';
  return code;
}
