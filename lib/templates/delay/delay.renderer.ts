/**
 * @fileoverview Функции рендеринга шаблона узла delay
 * @module templates/delay/delay.renderer
 */

import type { Node } from '@shared/schema';
import type { DelayEntry, DelayTemplateParams } from './delay.params';
import { delayParamsSchema } from './delay.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает DelayEntry[] из массива узлов.
 * @param nodes - Массив узлов холста
 * @returns Массив DelayEntry
 */
export function collectDelayEntries(nodes: Node[]): DelayEntry[] {
  const validNodes = nodes.filter(n => n != null);
  return validNodes
    .filter(n => (n.type as string) === 'delay')
    .map(node => {
      const targetNode = validNodes.find(n => n.id === node.data?.autoTransitionTo);
      return {
        nodeId: node.id,
        seconds: node.data?.seconds || '3',
        unit: node.data?.unit || 'seconds',
        mode: node.data?.mode || 'blocking',
        autoTransitionTo: node.data?.autoTransitionTo || '',
        targetNodeType: targetNode?.type || 'message',
      };
    });
}

/**
 * Генерирует Python-код обработчиков для всех узлов delay.
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateDelayHandlers(nodes: Node[]): string {
  const entries = collectDelayEntries(nodes);
  if (entries.length === 0) return '';

  return renderPartialTemplate('delay/delay.py.jinja2', { delayEntries: entries });
}
