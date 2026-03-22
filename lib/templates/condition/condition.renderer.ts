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

    entries.push({
      nodeId: node.id,
      variable,
      branches: branches.map(b => ({
        id: b.id ?? '',
        operator: b.operator,
        value: b.value ?? '',
        target: b.target,
      })),
    });
  }

  return entries;
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
    const validated = conditionParamsSchema.parse({ entries });
    return renderPartialTemplate('condition/condition.py.jinja2', {
      conditionEntries: validated.entries,
    });
  }
  if (input.entries.length === 0) return '';
  const validated = conditionParamsSchema.parse(input);
  return renderPartialTemplate('condition/condition.py.jinja2', {
    conditionEntries: validated.entries,
  });
}
