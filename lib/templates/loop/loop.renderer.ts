/**
 * @fileoverview Рендерер шаблона loop — генерирует Python-код цикла по массиву
 * @module templates/loop/loop.renderer
 */

import type { Node } from '@shared/schema';
import type { LoopEntry } from './loop.params';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Преобразует ID узла в безопасное имя для Python функции
 * @param nodeId - ID узла
 * @returns Безопасное имя
 */
function safeName(nodeId: string): string {
  return nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Собирает loop-ноды из массива узлов
 * @param nodes - Массив всех узлов проекта
 * @returns Массив параметров для генерации кода
 */
export function collectLoopEntries(nodes: Node[]): LoopEntry[] {
  const allIds = new Set(nodes.map(n => n.id));
  return nodes
    .filter(n => (n.type as string) === 'loop')
    .map(node => {
      const data = node.data as any;
      const autoTransitionTo = data?.autoTransitionTo || '';
      const afterLoopTo = data?.afterLoopTo || '';
      return {
        nodeId: node.id,
        safeName: safeName(node.id),
        sourceVariable: data?.sourceVariable || '',
        itemVariable: data?.itemVariable || 'item',
        indexVariable: data?.indexVariable || 'index',
        parallel: data?.parallel || false,
        delaySeconds: data?.delaySeconds || 0,
        maxIterations: data?.maxIterations || 0,
        autoTransitionTo,
        autoTransitionToSafe: safeName(autoTransitionTo),
        autoTransitionTargetExists: allIds.has(autoTransitionTo),
        afterLoopTo,
        afterLoopToSafe: safeName(afterLoopTo),
        afterLoopTargetExists: allIds.has(afterLoopTo),
      };
    })
    .filter(e => e.sourceVariable); // Пропускаем loop без sourceVariable
}

/**
 * Генерирует Python-код для всех loop-нод
 * @param nodes - Массив всех узлов проекта
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateLoopHandlers(nodes: Node[]): string {
  const entries = collectLoopEntries(nodes);
  if (entries.length === 0) return '';
  return entries
    .map(entry => renderPartialTemplate('loop/loop.py.jinja2', entry))
    .join('\n');
}
