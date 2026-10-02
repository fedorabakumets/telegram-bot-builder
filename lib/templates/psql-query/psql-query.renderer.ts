/**
 * @fileoverview Функции рендеринга шаблона узла psql_query
 * @module templates/psql-query/psql-query.renderer
 */

import type { Node } from '@shared/schema';
import type { PsqlQueryTemplateParams } from './psql-query.params';
import { psqlQueryParamsSchema } from './psql-query.schema';
import { renderPartialTemplate } from '../template-renderer';

/** Опции генерации узлов psql_query */
export interface PsqlQueryRenderOptions {
  /** Разрешён ли режим builtin (БД платформы); по умолчанию true для обратной совместимости */
  builtinEnabled?: boolean;
}

/**
 * Собирает параметры шаблона для всех узлов типа psql_query.
 * @param nodes - Массив узлов холста
 * @param options - Опции генерации (разрешён ли builtin)
 * @returns Массив PsqlQueryTemplateParams для генерации кода
 */
export function collectPsqlQueryEntries(
  nodes: Node[],
  options: PsqlQueryRenderOptions = {},
): PsqlQueryTemplateParams[] {
  const builtinEnabled = options.builtinEnabled ?? true;
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
      builtinEnabled,
    }));
}

/**
 * Генерирует Python-код обработчиков для всех узлов psql_query.
 * Если есть узлы с режимами env/custom, один раз добавляет хелпер `_psql_safe_dsn`.
 * @param nodes - Массив узлов холста
 * @param options - Опции генерации (разрешён ли builtin)
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generatePsqlQueryHandlers(
  nodes: Node[],
  options: PsqlQueryRenderOptions = {},
): string {
  const entries = collectPsqlQueryEntries(nodes, options);
  if (entries.length === 0) return '';

  const handlers = entries.map(params => {
    const validated = psqlQueryParamsSchema.parse(params);
    return renderPartialTemplate('psql-query/psql-query.py.jinja2', validated);
  });
  const needsDsnHelper = entries.some(e => e.connectionSource === 'env' || e.connectionSource === 'custom');
  if (needsDsnHelper) {
    handlers.unshift(renderPartialTemplate('psql-query/psql-query-dsn.py.jinja2', {}));
  }
  return handlers.join('\n');
}
