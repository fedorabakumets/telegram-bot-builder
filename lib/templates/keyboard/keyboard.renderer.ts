/**
 * @fileoverview Функция рендеринга шаблона клавиатуры
 * @module templates/keyboard/keyboard.renderer
 */

import type { KeyboardTemplateParams } from './keyboard.params';
import type { Button } from '../../bot-generator/types/button-types';
import type { EnhancedNode } from '../../bot-generator/types/enhanced-node.types';
import { keyboardParamsSchema } from './keyboard.schema';
import { renderPartialTemplate } from '../template-renderer';
import { normalizeDynamicButtonsConfig, shouldUseDynamicButtons } from './dynamic-buttons';
import { buildStaticRowsAroundDynamic } from './keyboard-layout-rows';

/** Специальный ID виртуального ряда динамических кнопок */
const DYNAMIC_PLACEHOLDER = '__dynamic__';

/**
 * Нормализует идентификаторы кнопок строки раскладки к массиву.
 * @param buttonIds - Один ID, массив ID или произвольное значение
 * @returns Массив идентификаторов кнопок
 */
function normalizeRowButtonIds(buttonIds: unknown): string[] {
  if (Array.isArray(buttonIds)) {
    return buttonIds.filter((buttonId): buttonId is string => typeof buttonId === 'string');
  }
  return typeof buttonIds === 'string' && buttonIds.trim() ? [buttonIds] : [];
}

/**
 * Переупорядочивает кнопки согласно keyboardLayout.rows.
 * Пропускает виртуальный ряд __dynamic__ — он не является реальной кнопкой.
 * @param buttons - Массив кнопок
 * @param keyboardLayout - Раскладка клавиатуры
 * @returns Отсортированный массив кнопок без __dynamic__
 */
export function sortButtonsByLayout(buttons: any[], keyboardLayout?: any): any[] {
  if (!keyboardLayout || keyboardLayout.autoLayout || !keyboardLayout.rows?.length) {
    return buttons;
  }
  const orderedIds: string[] = [];
  for (const row of keyboardLayout.rows) {
    for (const id of normalizeRowButtonIds(row.buttonIds)) {
      if (id !== DYNAMIC_PLACEHOLDER) orderedIds.push(id);
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
 * Вычисляет строку аргументов для builder.adjust() на основе keyboardLayout.
 * Пропускает ряды с __dynamic__ при подсчёте.
 * @param keyboardLayout - Раскладка клавиатуры
 * @returns Строка для builder.adjust() или null для автоматического расчёта
 */
export function computeAdjustStr(keyboardLayout?: any): string | null {
  if (!keyboardLayout) return null;
  if (!keyboardLayout.autoLayout && keyboardLayout.rows?.length) {
    const counts = (keyboardLayout.rows as any[])
      .map((r: any) => normalizeRowButtonIds(r.buttonIds))
      .filter((rowButtonIds: string[]) => !rowButtonIds.includes(DYNAMIC_PLACEHOLDER))
      .map((rowButtonIds: string[]) => rowButtonIds.length)
      .filter((n: number) => n > 0);
    if (counts.length > 0) return counts.join(', ');
  }
  if (keyboardLayout.autoLayout && keyboardLayout.columns) {
    return String(keyboardLayout.columns);
  }
  return null;
}

/**
 * Разбивает кнопки на два массива относительно позиции __dynamic__ в раскладке.
 * Используется для генерации смешанного режима (динамические + статические).
 * @param buttons - Статические кнопки
 * @param keyboardLayout - Раскладка с виртуальным рядом __dynamic__
 * @returns Объект с массивами кнопок до и после динамического блока
 */
export function splitButtonsByDynamicPosition(
  buttons: any[],
  keyboardLayout?: any
): { staticButtonsBefore: any[]; staticButtonsAfter: any[] } {
  if (!keyboardLayout?.rows?.length) {
    return { staticButtonsBefore: [], staticButtonsAfter: buttons };
  }

  const dynamicRowIndex = keyboardLayout.rows.findIndex(
    (r: any) => normalizeRowButtonIds(r.buttonIds).includes(DYNAMIC_PLACEHOLDER)
  );

  if (dynamicRowIndex === -1) {
    return { staticButtonsBefore: [], staticButtonsAfter: buttons };
  }

  const btnMap = new Map(buttons.map((b: any) => [b.id, b]));
  const beforeIds: string[] = [];
  const afterIds: string[] = [];

  for (let i = 0; i < keyboardLayout.rows.length; i++) {
    const row = keyboardLayout.rows[i];
    for (const id of normalizeRowButtonIds(row.buttonIds)) {
      if (id === DYNAMIC_PLACEHOLDER) continue;
      if (i < dynamicRowIndex) beforeIds.push(id);
      else afterIds.push(id);
    }
  }

  const staticButtonsBefore = beforeIds.map((id: string) => btnMap.get(id)).filter(Boolean);
  const staticButtonsAfter = afterIds.map((id: string) => btnMap.get(id)).filter(Boolean);

  // Кнопки не упомянутые в layout — добавляем после
  const mentionedIds = new Set([...beforeIds, ...afterIds]);
  for (const btn of buttons) {
    if (!mentionedIds.has(btn.id)) staticButtonsAfter.push(btn);
  }

  return { staticButtonsBefore, staticButtonsAfter };
}

/**
 * Генерация Python кода клавиатуры с валидацией параметров.
 * Поддерживает смешанный режим: динамические + статические кнопки с позиционированием через __dynamic__.
 * @param params - Параметры клавиатуры
 * @returns Сгенерированный Python код
 */
export function generateKeyboard(params: KeyboardTemplateParams): string {
  const rawButtons = params.buttons ?? [];
  const dynamicButtons = normalizeDynamicButtonsConfig(params.dynamicButtons);
  const useDynamicButtons = shouldUseDynamicButtons({
    enableDynamicButtons: params.enableDynamicButtons,
    dynamicButtons,
    keyboardType: params.keyboardType,
  });

  // Определяем позиционирование статических кнопок относительно динамических
  const hasDynamicLayout = useDynamicButtons &&
    params.keyboardLayout?.rows?.some((r: any) => r.buttonIds?.includes(DYNAMIC_PLACEHOLDER));

  let sortedButtons: any[];
  let staticRowsBefore: any[][] | undefined;
  let staticRowsAfter: any[][] | undefined;

  if (hasDynamicLayout && rawButtons.length > 0) {
    const split = buildStaticRowsAroundDynamic(rawButtons, params.keyboardLayout);
    staticRowsBefore = split.staticRowsBefore;
    staticRowsAfter = split.staticRowsAfter;
    sortedButtons = sortButtonsByLayout(rawButtons, params.keyboardLayout);
  } else {
    sortedButtons = sortButtonsByLayout(rawButtons, params.keyboardLayout);
  }

  const adjustStr = computeAdjustStr(params.keyboardLayout);
  const withSortedButtons = {
    ...params,
    keyboardType: useDynamicButtons ? 'inline' : params.keyboardType,
    buttons: sortedButtons,
    dynamicButtons: dynamicButtons ?? undefined,
    enableDynamicButtons: useDynamicButtons,
  };
  const validated = keyboardParamsSchema.parse(withSortedButtons);
  return renderPartialTemplate('keyboard/keyboard.py.jinja2', {
    ...validated,
    adjustStr,
    dynamicButtons: validated.dynamicButtons ?? dynamicButtons ?? undefined,
    enableDynamicButtons: useDynamicButtons,
    staticRowsBefore: staticRowsBefore ?? [],
    staticRowsAfter: staticRowsAfter ?? [],
  });
}

/**
 * Собирает ID целевых узлов из inline кнопок в Set
 * @param inlineNodes - Массив узлов с inline кнопками
 * @param allReferencedNodeIds - Set для добавления найденных ID
 */
export function processInlineButtonNodes(inlineNodes: EnhancedNode[], allReferencedNodeIds: Set<string>): void {
  inlineNodes.forEach(node => {
    node.data.buttons.forEach((button: Button) => {
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
      const hasDynamicButtons = node.data?.keyboardType === 'inline' &&
        !!node.data?.enableDynamicButtons &&
        !!normalizeDynamicButtonsConfig(node.data?.dynamicButtons);
      const hasMain = node.data?.keyboardType === 'inline' &&
        Array.isArray(node.data?.buttons) && node.data.buttons.length > 0;
      const hasConditional = Array.isArray(node.data?.conditionalMessages) &&
        node.data.conditionalMessages.some((c: any) =>
          c.keyboardType === 'inline' && Array.isArray(c.buttons) && c.buttons.length > 0
        );
      return hasMain || hasDynamicButtons || hasConditional;
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

