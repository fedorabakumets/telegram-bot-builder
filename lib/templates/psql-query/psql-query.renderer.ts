/**
 * @fileoverview Функции рендеринга шаблона узла psql_query
 * @module templates/psql-query/psql-query.renderer
 */

import type { Node } from '@shared/schema';
import type { PsqlQueryTemplateParams } from './psql-query.params';
import { psqlQueryParamsSchema } from './psql-query.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает параметры шаблона для всех узлов типа psql_query.
 * @param nodes - Массив узлов холста
 * @returns Массив PsqlQueryTemplateParams для генерации кода
 */
export function collectPsqlQueryEntries(nodes: Node[]): PsqlQueryTemplateParams[] {
  return nodes
    .filter(n => n != null && n.type === 'psql_query')
    .map(node => ({
      nodeId: node.id,
      query: node.data?.query || '',
      saveResultTo: node.data?.saveResultTo || '',
      resultFormat: node.data?.resultFormat || 'first_row',
      textTemplate: node.data?.textTemplate || '',
      autoTransitionTo: node.data?.autoTransitionTo || '',
      connectionSource: node.data?.connectionSource || 'builtin',
      connectionEnvVar: node.data?.connectionEnvVar || '',
      connectionString: node.data?.connectionString || '',
    }));
}

/**
 * Генерирует Python-код обработчиков для всех узлов psql_query.
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generatePsqlQueryHandlers(nodes: Node[]): string {
  const entries = collectPsqlQueryEntries(nodes);
  if (entries.length === 0) return '';

  return entries
    .map(params => {
      const validated = psqlQueryParamsSchema.parse(params);
      return renderPartialTemplate('psql-query/psql-query.py.jinja2', validated);
    })
    .join('\n');
}
