/**
 * @fileoverview Рендерер шаблона узла rate_counter
 * @module templates/rate-counter/rate-counter.renderer
 */

import type { Node } from '@shared/schema';
import type { RateCounterEntry, RateCounterTemplateParams } from './rate-counter.params';
import { rateCounterParamsSchema } from './rate-counter.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает параметры узлов rate_counter из графа
 * @param nodes - Массив узлов холста
 * @returns Массив RateCounterEntry
 */
export function collectRateCounterEntries(nodes: Node[]): RateCounterEntry[] {
  return nodes
    .filter(n => n != null && (n.type as string) === 'rate_counter')
    .map(node => {
      const data = node.data as Record<string, unknown>;
      return {
        nodeId: node.id,
        counterKey: String(data?.counterKey ?? node.id),
        windowSeconds: String(data?.windowSeconds ?? '60'),
        saveResultTo: String(data?.saveResultTo ?? 'rate_count'),
        autoTransitionTo: String(data?.autoTransitionTo ?? ''),
      };
    });
}

/**
 * Генерирует Python-код обработчиков rate_counter (низкоуровневый API)
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python-код
 */
export function generateRateCounter(params: RateCounterTemplateParams): string {
  if (params.rateCounterEntries.length === 0) return '';
  const validated = rateCounterParamsSchema.parse(params);
  return renderPartialTemplate('rate-counter/rate-counter.py.jinja2', validated);
}

/**
 * Генерирует Python-код обработчиков rate_counter из узлов графа
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateRateCounterHandlers(nodes: Node[]): string {
  const entries = collectRateCounterEntries(nodes);
  if (entries.length === 0) return '';
  return generateRateCounter({ rateCounterEntries: entries });
}
