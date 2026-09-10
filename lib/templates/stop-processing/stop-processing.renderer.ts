/**
 * @fileoverview Рендерер шаблона узла stop_processing
 * @module templates/stop-processing/stop-processing.renderer
 */

import type { Node } from '@shared/schema';
import type { StopProcessingEntry, StopProcessingTemplateParams } from './stop-processing.params';
import { stopProcessingParamsSchema } from './stop-processing.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает параметры узлов stop_processing из графа
 * @param nodes - Массив узлов холста
 * @returns Массив StopProcessingEntry
 */
export function collectStopProcessingEntries(nodes: Node[]): StopProcessingEntry[] {
  return nodes
    .filter(n => n != null && (n.type as string) === 'stop_processing')
    .map(node => ({
      nodeId: node.id,
      autoTransitionTo: String(node.data?.autoTransitionTo ?? ''),
    }));
}

/**
 * Генерирует Python-код обработчиков stop_processing (низкоуровневый API)
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python-код
 */
export function generateStopProcessing(params: StopProcessingTemplateParams): string {
  if (params.stopProcessingEntries.length === 0) return '';
  const validated = stopProcessingParamsSchema.parse(params);
  return renderPartialTemplate('stop-processing/stop-processing.py.jinja2', validated);
}

/**
 * Генерирует Python-код обработчиков stop_processing из узлов графа
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateStopProcessingHandlers(nodes: Node[]): string {
  const entries = collectStopProcessingEntries(nodes);
  if (entries.length === 0) return '';
  return generateStopProcessing({ stopProcessingEntries: entries });
}
