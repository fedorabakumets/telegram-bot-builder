/**
 * @fileoverview Функция рендеринга шаблона обработчиков узлов условия
 * @module templates/condition/condition.renderer
 */

import type { Node } from '@shared/schema';
import type { ConditionEntry, ConditionTemplateParams } from './condition.params';
import { conditionParamsSchema } from './condition.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает ConditionEntry[] из массива узлов графа.
 * Находит все узлы с type === 'condition', у которых есть variable
 * и хотя бы одна ветка.
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
    if (!variable.trim()) continue;

    const branches: any[] = (node.data as any).branches ?? [];
    if (branches.length === 0) continue;

    const validOperators = new Set(['filled', 'empty', 'equals', 'contains', 'greater_than', 'less_than', 'between', 'else']);
    const numericOps = new Set(['greater_than', 'less_than', 'between']);
    const stringOps = new Set(['filled', 'empty', 'equals', 'contains']);
    // Определяем первые ветки в каждой группе для корректного if/elif
    let firstNumericSeen = false;
    let firstStringSeen = false;
    const mappedBranches = branches
      .filter(b => validOperators.has(b.operator))
      .map(b => {
        const isFirstNumeric = numericOps.has(b.operator) && !firstNumericSeen;
        if (isFirstNumeric) firstNumericSeen = true;
        const isFirstString = stringOps.has(b.operator) && !firstStringSeen;
        if (isFirstString) firstStringSeen = true;
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
          // legacy: для обратной совместимости с тестами
          isFirstConditional: isFirstNumeric || isFirstString,
        };
      });

    if (mappedBranches.length === 0) continue;

    const hasNumericBranch = mappedBranches.some(b =>
      b.operator === 'greater_than' || b.operator === 'less_than' || b.operator === 'between'
    );

    entries.push({
      nodeId: node.id,
      variable,
      branches: mappedBranches,
      hasConditionalBranch: mappedBranches.some(b => b.operator !== 'else'),
      hasNumericBranch,
    } as any);
  }

  return entries;
}

/**
 * Обогащает ветки entry флагами isFirstConditional, hasConditionalBranch, hasNumericBranch.
 */
function enrichEntries(entries: ConditionEntry[]): any[] {
  const numericOps = new Set(['greater_than', 'less_than', 'between']);
  const stringOps = new Set(['filled', 'empty', 'equals', 'contains']);
  return entries.map(entry => {
    let firstNumericSeen = false;
    let firstStringSeen = false;
    const mappedBranches = (entry.branches as any[]).map(b => {
      const isFirstNumeric = numericOps.has(b.operator) && !firstNumericSeen;
      if (isFirstNumeric) firstNumericSeen = true;
      const isFirstString = stringOps.has(b.operator) && !firstStringSeen;
      if (isFirstString) firstStringSeen = true;
      return {
        ...b,
        isFirstNumeric,
        isFirstString,
        isFirstConditional: isFirstNumeric || isFirstString,
      };
    });
    const hasNumericBranch = mappedBranches.some(b =>
      b.operator === 'greater_than' || b.operator === 'less_than' || b.operator === 'between'
    );
    return {
      ...entry,
      branches: mappedBranches,
      hasConditionalBranch: mappedBranches.some(b => b.operator !== 'else'),
      hasNumericBranch,
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
    // Валидируем базовую структуру, но используем оригинальные entries (с isFirstConditional)
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
