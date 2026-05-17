/**
 * @fileoverview Функция рендеринга шаблона фоновых задач schedule_trigger
 * @module templates/schedule-trigger/schedule-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { ScheduleTriggerEntry, ScheduleTriggerTemplateParams } from './schedule-trigger.params';
import { scheduleTriggerParamsSchema } from './schedule-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает ScheduleTriggerEntry[] из массива узлов графа.
 * Находит все узлы с type === 'schedule_trigger' и autoTransitionTo.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив ScheduleTriggerEntry для генерации фоновых задач
 */
export function collectScheduleTriggerEntries(nodes: Node[]): ScheduleTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));

  const entries: ScheduleTriggerEntry[] = [];

  for (const node of validNodes) {
    if ((node.type as string) !== 'schedule_trigger') continue;

    const targetNodeId: string = node.data.autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

    const rules = Array.isArray(node.data.rules) ? node.data.rules : [{ mode: 'interval', intervalMinutes: 5 }];
    const timezone = node.data.timezone ?? 'Europe/Moscow';
    const runOnStart = node.data.runOnStart ?? false;
    const enabled = node.data.enabled ?? true;
    const maxConcurrent = node.data.maxConcurrent ?? 1;

    entries.push({
      nodeId: node.id,
      safeName,
      targetNodeId,
      targetNodeType,
      rules,
      timezone,
      runOnStart,
      enabled,
      maxConcurrent,
    });
  }

  return entries;
}

/**
 * Генерация Python-кода фоновых задач schedule_trigger из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateScheduleTrigger(params: ScheduleTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = scheduleTriggerParamsSchema.parse(params);
  return renderPartialTemplate('schedule-trigger/schedule-trigger.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python-кода фоновых задач schedule_trigger из массива узлов (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateScheduleTriggerHandlers(nodes: Node[]): string {
  const entries = collectScheduleTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateScheduleTrigger({ entries });
}
