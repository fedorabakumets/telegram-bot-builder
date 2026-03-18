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
/**
 * Переупорядочивает кнопки согласно keyboardLayout.rows
 * Если layout задан — кнопки идут в порядке buttonIds из rows
 */
export function sortButtonsByLayout(buttons: any[], keyboardLayout?: any): any[] {
  if (!keyboardLayout || keyboardLayout.autoLayout || !keyboardLayout.rows?.length) {
    return buttons;
  }
  const orderedIds: string[] = [];
  for (const row of keyboardLayout.rows) {
    if (Array.isArray(row.buttonIds)) {
      orderedIds.push(...row.buttonIds);
    }
  }
  if (orderedIds.length === 0) return buttons;

  const btnMap = new Map(buttons.map(b => [b.id, b]));
  const sorted: any[] = [];
  for (const id of orderedIds) {
    if (btnMap.has(id)) {
      sorted.push(btnMap.get(id));
      btnMap.delete(id);
    }
  }
  for (const btn of btnMap.values()) {
    sorted.push(btn);
  }
  return sorted;
}

/**
 * Вычисляет строку аргументов для builder.adjust() на основе keyboardLayout
 * Возвращает null если нужно использовать автоматический расчёт
 */
export function computeAdjustStr(keyboardLayout?: any): string | null {
  if (!keyboardLayout) return null;
  if (!keyboardLayout.autoLayout && keyboardLayout.rows?.length) {
    const counts = (keyboardLayout.rows as any[])
      .map((r: any) => Array.isArray(r.buttonIds) ? r.buttonIds.length : 0)
      .filter((n: number) => n > 0);
    if (counts.length > 0) return counts.join(', ');
  }
  if (keyboardLayout.autoLayout && keyboardLayout.columns) {
    return String(keyboardLayout.columns);
  }
  return null;
}

export function generateKeyboard(params: KeyboardTemplateParams): string {
  const sortedButtons = sortButtonsByLayout(params.buttons ?? [], params.keyboardLayout);
  const adjustStr = computeAdjustStr(params.keyboardLayout);
  const withSortedButtons = {
    ...params,
    buttons: sortedButtons,
  };
  const validated = keyboardParamsSchema.parse(withSortedButtons);
  return renderPartialTemplate('keyboard/keyboard.py.jinja2', { ...validated, adjustStr });
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

