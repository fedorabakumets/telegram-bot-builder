/**
 * @fileoverview Рендерер шаблона get_star_balance
 * @module templates/get-star-balance/get-star-balance.renderer
 */

import type { Node } from '@shared/schema';
import type {
  GetStarBalanceEntry,
  GetStarBalanceTemplateParams,
} from './get-star-balance.params';
import { getStarBalanceParamsSchema } from './get-star-balance.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает записи из узлов холста
 * @param nodes - Узлы
 * @returns Записи шаблона
 */
export function collectGetStarBalanceEntries(nodes: Node[]): GetStarBalanceEntry[] {
  const validNodes = nodes.filter((n) => n != null);
  const entries: GetStarBalanceEntry[] = [];

  for (const node of validNodes) {
    if ((node.type as string) !== 'get_star_balance') continue;
    const data = node.data as any;
    const saveTo = String(data?.saveStarBalanceTo ?? 'star_balance').trim() || 'star_balance';
    entries.push({
      nodeId: node.id,
      safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      targetNodeId: data?.autoTransitionTo ?? '',
      saveStarBalanceTo: saveTo,
      ignoreErrors: Boolean(data?.ignoreErrors),
      balanceMsgError: data?.balanceMsgError ?? 'Не удалось получить баланс звёзд',
      balanceErrorTarget: data?.balanceErrorTarget ?? '',
    });
  }

  return entries;
}

/**
 * Генерация Python из параметров
 * @param params - Параметры
 * @returns Код
 */
export function generateGetStarBalance(params: GetStarBalanceTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = getStarBalanceParamsSchema.parse(params);
  return renderPartialTemplate('get-star-balance/get-star-balance.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python из узлов
 * @param nodes - Узлы холста
 * @returns Код
 */
export function generateGetStarBalanceHandlers(nodes: Node[]): string {
  const entries = collectGetStarBalanceEntries(nodes);
  if (entries.length === 0) return '';
  return generateGetStarBalance({ entries });
}
