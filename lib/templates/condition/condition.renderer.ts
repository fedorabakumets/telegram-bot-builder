/**
 * @fileoverview Функция рендеринга шаблона обработчиков узлов условия
 * @module templates/condition/condition.renderer
 */

import type { Node } from '@shared/schema';
import type { ConditionEntry, ConditionTemplateParams } from './condition.params';
import { conditionParamsSchema } from './condition.schema';
import { renderPartialTemplate } from '../template-renderer';

const SYSTEM_OPS = new Set(['is_private', 'is_group', 'is_channel', 'is_admin', 'is_premium', 'is_bot', 'is_subscribed', 'is_not_subscribed']);
const NUMERIC_OPS = new Set(['greater_than', 'less_than', 'between']);
const STRING_OPS = new Set(['filled', 'empty', 'equals', 'contains']);

/**
 * Собирает ConditionEntry[] из массива узлов графа.
 * Находит все узлы с type === 'condition', у которых есть variable
 * или хотя бы одна системная ветка (is_private, is_group, is_channel).
 *
 * @param nodes - Массив узлов холста
 * @returns Массив ConditionEntry для генерации обработчиков
 */
export function collectConditionEntries(nodes: Node[]): ConditionEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const entries: ConditionEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'condition') continue;

    const variable: string = (node.data as any).variable ?? '';
    const branches: any[] = (node.data as any).branches ?? [];
    if (branches.length === 0) continue;

    const validOperators = new Set(['filled', 'empty', 'equals', 'contains', 'greater_than', 'less_than', 'between', 'is_private', 'is_group', 'is_channel', 'is_admin', 'is_premium', 'is_bot', 'is_subscribed', 'is_not_subscribed', 'else']);
    const filteredBranches = branches.filter(b => validOperators.has(b.operator));

    const hasSystemBranch = filteredBranches.some(b => SYSTEM_OPS.has(b.operator));
    const hasOnlyElseBranch = filteredBranches.length > 0 && filteredBranches.every(b => b.operator === 'else');

    // Skip if no variable AND no system branches AND this is not a pass-through else-only node
    if (!variable.trim() && !hasSystemBranch && !hasOnlyElseBranch) continue;

    let firstNumericSeen = false;
    let firstStringSeen = false;
    let firstSystemSeen = false;

    const mappedBranches = filteredBranches.map(b => {
      const isFirstNumeric = NUMERIC_OPS.has(b.operator) && !firstNumericSeen;
      if (isFirstNumeric) firstNumericSeen = true;
      const isFirstString = STRING_OPS.has(b.operator) && !firstStringSeen;
      if (isFirstString) firstStringSeen = true;
      const isFirstSystem = SYSTEM_OPS.has(b.operator) && !firstSystemSeen;
      if (isFirstSystem) firstSystemSeen = true;

      const sanitizeValue = (v: string) => (v ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
      return {
        id: b.id ?? '',
        operator: b.operator,
        value: sanitizeValue(b.value ?? ''),
        value2: sanitizeValue(b.value2 ?? ''),
        target: b.target,
        isFirstNumeric,
        isFirstString,
        isFirstSystem,
        isFirstConditional: isFirstNumeric || isFirstString,
      };
    });

    if (mappedBranches.length === 0) continue;

    const hasNumericBranch = mappedBranches.some(b => NUMERIC_OPS.has(b.operator));
    const hasSubscriptionBranch = mappedBranches.some(b => b.operator === 'is_subscribed' || b.operator === 'is_not_subscribed');
    const skipVarLookup = !variable.trim() && (hasSystemBranch || hasOnlyElseBranch);

    entries.push({
      nodeId: node.id,
      variable,
      branches: mappedBranches,
      hasConditionalBranch: mappedBranches.some(b => b.operator !== 'else'),
      hasNumericBranch,
      hasSystemBranch,
      hasSubscriptionBranch,
      skipVarLookup,
    } as any);
  }

  return entries;
}

/**
 * Обогащает ветки entry флагами isFirstConditional, hasConditionalBranch, hasNumericBranch, hasSystemBranch.
 */
function enrichEntries(entries: ConditionEntry[]): any[] {
  return entries.map(entry => {
    let firstNumericSeen = false;
    let firstStringSeen = false;
    let firstSystemSeen = false;

    const mappedBranches = (entry.branches as any[]).map(b => {
      const isFirstNumeric = NUMERIC_OPS.has(b.operator) && !firstNumericSeen;
      if (isFirstNumeric) firstNumericSeen = true;
      const isFirstString = STRING_OPS.has(b.operator) && !firstStringSeen;
      if (isFirstString) firstStringSeen = true;
      const isFirstSystem = SYSTEM_OPS.has(b.operator) && !firstSystemSeen;
      if (isFirstSystem) firstSystemSeen = true;
      return {
        ...b,
        isFirstNumeric,
        isFirstString,
        isFirstSystem,
        isFirstConditional: isFirstNumeric || isFirstString,
      };
    });

    const hasNumericBranch = mappedBranches.some(b => NUMERIC_OPS.has(b.operator));
    const hasSystemBranch = mappedBranches.some(b => SYSTEM_OPS.has(b.operator));
    const hasSubscriptionBranch = mappedBranches.some(b => b.operator === 'is_subscribed' || b.operator === 'is_not_subscribed');
    const hasOnlyElseBranch = mappedBranches.length > 0 && mappedBranches.every(b => b.operator === 'else');
    const skipVarLookup = !entry.variable.trim() && (hasSystemBranch || hasOnlyElseBranch);

    return {
      ...entry,
      branches: mappedBranches,
      hasConditionalBranch: mappedBranches.some(b => b.operator !== 'else'),
      hasNumericBranch,
      hasSystemBranch,
      hasSubscriptionBranch,
      skipVarLookup,
    };
  });
}

/**
 * Генерация Python обработчиков узлов условия из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateConditionHandlers(nodes: Node[]): string;
export function generateConditionHandlers(params: ConditionTemplateParams): string;
export function generateConditionHandlers(input: Node[] | ConditionTemplateParams): string {
  if (Array.isArray(input)) {
    const entries = collectConditionEntries(input);
    if (entries.length === 0) return '';
    conditionParamsSchema.parse({ entries });
    return renderPartialTemplate('condition/condition.py.jinja2', {
      conditionEntries: entries,
    });
  }
  if (input.entries.length === 0) return '';
  conditionParamsSchema.parse(input);
  return renderPartialTemplate('condition/condition.py.jinja2', {
    conditionEntries: enrichEntries(input.entries),
  });
}
