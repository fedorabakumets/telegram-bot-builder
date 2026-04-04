/**
 * @fileoverview Функции рендеринга шаблона обработчиков триггеров inline-кнопок
 * @module templates/callback-trigger/callback-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { CallbackTriggerEntry, CallbackTriggerTemplateParams } from './callback-trigger.params';
import { callbackTriggerParamsSchema } from './callback-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает узлы типа callback_trigger из массива узлов
 * @param nodes - Массив всех узлов проекта
 * @returns Массив записей триггеров inline-кнопок
 */
export function collectCallbackTriggerEntries(nodes: Node[]): CallbackTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: CallbackTriggerEntry[] = [];

  for (const node of validNodes) {
    if ((node.type as string) !== 'callback_trigger') continue;

    const callbackData: string = (node.data as any).callbackData ?? '';
    if (!callbackData.trim()) continue;

    const targetNodeId: string = (node.data as any).autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const matchType: 'exact' | 'startswith' = (node.data as any).matchType ?? 'exact';
    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    // Ищем текст кнопки по callbackData среди всех кнопок проекта
    let buttonText = '';
    for (const n of validNodes) {
      const buttons: any[] = (n.data as any).buttons ?? [];
      const btn = buttons.find((b: any) => b.customCallbackData === callbackData);
      if (btn?.text) { buttonText = btn.text; break; }
    }

    entries.push({
      nodeId: node.id,
      callbackData,
      matchType,
      adminOnly: node.data.adminOnly,
      requiresAuth: node.data.requiresAuth,
      targetNodeId,
      targetNodeType,
      buttonText,
    });
  }

  return entries;
}

/**
 * Генерирует Python-код обработчиков триггеров inline-кнопок из параметров
 * @param params - Параметры шаблона с массивом записей
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateCallbackTriggers(params: CallbackTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = callbackTriggerParamsSchema.parse(params);
  return renderPartialTemplate('callback-trigger/callback-trigger.py.jinja2', {
    callbackTriggerEntries: validated.entries,
  });
}

/**
 * Генерирует Python-код обработчиков триггеров inline-кнопок из массива узлов
 * @param nodes - Массив узлов проекта
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateCallbackTriggerHandlers(nodes: Node[]): string {
  const entries = collectCallbackTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateCallbackTriggers({ entries });
}
