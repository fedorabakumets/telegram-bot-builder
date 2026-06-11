/**
 * @fileoverview Рендерер шаблона parallel_split — генерирует Python-код
 * параллельного запуска веток (fan-out без точки сбора)
 * @module templates/parallel-split/parallel-split.renderer
 */

import type { Node } from '@shared/schema';
import type { ParallelSplitEntry, ParallelSplitBranchEntry } from './parallel-split.params';
import { parallelSplitEntrySchema } from './parallel-split.schema';
import { renderPartialTemplate } from '../template-renderer';

/** Жёсткий потолок семафора при maxConcurrent = 0 (без лимита) */
const NO_LIMIT_SEMAPHORE = 999;

/**
 * Преобразует ID узла в безопасное имя для Python функции
 * @param nodeId - ID узла
 * @returns Безопасное имя
 */
function safeName(nodeId: string): string {
  return nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Собирает parallel_split-ноды из массива узлов
 * @param nodes - Массив всех узлов проекта
 * @returns Массив параметров для генерации кода
 */
export function collectParallelSplitEntries(nodes: Node[]): ParallelSplitEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const allIds = new Set(validNodes.map(n => n.id));
  return validNodes
    .filter(n => (n.type as string) === 'parallel_split')
    .map(node => {
      const data = node.data as any;
      const rawBranches: any[] = Array.isArray(data?.parallelBranches) ? data.parallelBranches : [];
      /** Оставляем только ветки с существующими целевыми нодами */
      const branches: ParallelSplitBranchEntry[] = rawBranches
        .filter(b => b?.target && allIds.has(b.target))
        .map((b, index) => {
          const onErrorTarget = b.onErrorTarget || '';
          const onErrorTargetExists = Boolean(onErrorTarget && allIds.has(onErrorTarget));
          return {
            id: String(b.id || `pbranch_${index}`),
            label: String(b.label || `Ветка ${index + 1}`),
            target: String(b.target),
            targetSafe: safeName(String(b.target)),
            onErrorTarget,
            onErrorTargetSafe: onErrorTargetExists ? safeName(String(onErrorTarget)) : '',
            onErrorTargetExists,
          };
        });
      return {
        nodeId: node.id,
        safeName: safeName(node.id),
        branches,
        maxConcurrent: typeof data?.maxConcurrent === 'number' ? data.maxConcurrent : 5,
        awaitAll: Boolean(data?.awaitAll),
        skipIfRunning: data?.skipIfRunning !== false,
      };
    });
}

/**
 * Генерирует Python-код одного узла parallel_split (низкоуровневый API)
 * @param entry - Параметры узла
 * @returns Сгенерированный Python-код
 */
export function generateParallelSplit(entry: ParallelSplitEntry): string {
  const parsed = parallelSplitEntrySchema.parse(entry);
  const semaphoreLimit = parsed.maxConcurrent > 0
    ? parsed.maxConcurrent
    : Math.max(parsed.branches.length, NO_LIMIT_SEMAPHORE);
  return renderPartialTemplate('parallel-split/parallel-split.py.jinja2', {
    ...parsed,
    semaphoreLimit,
  });
}

/**
 * Генерирует Python-код для всех parallel_split-нод (высокоуровневый API).
 * Перед обработчиками один раз добавляет реестр активных запусков.
 * @param nodes - Массив всех узлов проекта
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateParallelSplitHandlers(nodes: Node[]): string {
  const entries = collectParallelSplitEntries(nodes);
  if (entries.length === 0) return '';
  const header = [
    '# Реестр активных запусков parallel_split: (user_id, node_id)',
    '_active_splits: set = set()',
    '',
  ].join('\n');
  return header + entries.map(entry => generateParallelSplit(entry)).join('\n');
}
